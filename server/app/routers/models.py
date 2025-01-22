from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse
import uuid
from typing import List, Optional
import logging
from logging.handlers import RotatingFileHandler
import os
import json
import aiohttp
import aiofiles
from app.services.supabase_service import supabase
from app.routers.auth import verify_auth
from app.schemas.auth_schema import TokenSchema
from app.schemas.model_schemas import PostRequest, PostResponse, FileDetail, CurrentSubjectResponse
from model.src.config import Config
from model.src.utils.pdf_utils import extract_text_from_pdf
from model.src.generator.content_generator import ContentGenerator

''' db enetering import code '''
import json
from typing import Dict, List, Any
''''''

# Create logs directory if it doesn't exist
os.makedirs('logs', exist_ok=True)

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Create formatters
file_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
console_formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Create and configure file handler with rotation
file_handler = RotatingFileHandler(
    'logs/app.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(file_formatter)

# Create and configure console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(console_formatter)

# Add handlers to logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Remove any existing handlers from the root logger
logging.getLogger().handlers = []

router = APIRouter()

# Add new status tracking dictionary
#processing_status = {}

async def download_file(url: str, save_path: str):
    """Download a file from URL and save it locally"""
    try:
        logger.info(f"Starting download of file from URL: {url}")
        bucket_path = url.split("study_materials/")[1]
        logger.debug(f"Extracted bucket path: {bucket_path}")
        
        async with aiofiles.open(save_path, 'wb+') as f:
            logger.debug(f"Downloading from Supabase storage to: {save_path}")
            response = supabase.storage.from_("study_materials").download(bucket_path)
            await f.write(response)
            logger.info(f"Successfully downloaded and saved file to: {save_path}")
        return True
    except Exception as e:
        logger.error(f"Error in download_file: {str(e)}")
        return False

def load_multiple_pdfs(file_paths):
    """Extract and concatenate text from multiple PDF files."""
    all_text = ""
    logger.info(f"Starting PDF processing for {len(file_paths)} files")
    for path in file_paths:
        logger.info(f"Processing PDF: {path}")
        text = extract_text_from_pdf(path)
        if text:     
            all_text += f"\n{text}"
            logger.info(f"Successfully extracted text from: {path}")
        else:
            logger.error(f"Failed to read PDF file at {path}")
    return all_text

# In your router file, modify the PDF loading and content generation section:

def load_pdf(file_path: str) -> str:
    """Extract text from a single PDF file with error handling"""
    try:
        text = extract_text_from_pdf(file_path)
        return text if text else ""
    except Exception as e:
        logger.error(f"Error reading PDF {file_path}: {str(e)}")
        return ""

def load_module_notes(notes_files: list) -> Dict[str, str]:
    """Load notes files and organize them by module"""
    module_notes = {}
    for file_path in notes_files:
        # Extract module number from filename (assuming format modX.pdf)
        module_key = os.path.splitext(os.path.basename(file_path))[0]
        if not module_key.startswith('mod'):
            continue
        
        text = load_pdf(file_path)
        if text:
            module_notes[module_key] = text
    
    return module_notes



async def insert_content_to_database(user_id: str, subject: str, content: Dict[str, Any], logger: logging.Logger):
    try:
        logger.info("=== Starting database insertion process ===")
        
        # Get subject_id from database
        subject_response = supabase.table("subjects")\
            .select("id")\
            .eq("user_id", user_id)\
            .eq("subject_name", subject)\
            .execute()
            
        if not subject_response.data:
            logger.error(f"Subject not found for user {user_id}")
            raise ValueError("Subject not found in database")
            
        subject_id = subject_response.data[0]['id']
        
        # Insert flashcards
        logger.info("Inserting flashcards...")
        flashcards_dict = content.get("flashcards", {})
        
        if flashcards_dict:
            try:
                # Convert flashcards to list format
                flashcards_list = []
                for module_key, cards in flashcards_dict.items():
                    if isinstance(cards, list):
                        for card in cards:
                            if isinstance(card, dict):
                                flashcards_list.append({
                                    "question": str(card.get("question", "")),
                                    "answer": str(card.get("answer", "")),
                                    "module_no": str(module_key).replace("mod", "").strip()
                                })
                
                if flashcards_list:
                    # Insert using RPC call
                    response = supabase.rpc(
                        "insert_flashcards",
                        {
                            "p_subject_id": subject_id,
                            "p_flashcards": flashcards_list
                        }
                    ).execute()
                    logger.info(f"Successfully inserted {len(flashcards_list)} flashcards")
            except Exception as e:
                logger.error(f"Error inserting flashcards: {str(e)}")
        
        # Insert module topics
        logger.info("Inserting module topics...")
        for module_name, module_data in content.get("important_topics", {}).items():
            # Extract module number from module name (e.g., 'mod1' -> '1')
            module_no = module_name.replace('mod', '')
            topics = module_data
            
            if topics:
                try:
                    response = supabase.rpc(
                        "insert_module_topics",
                        {
                            "p_subject_id": subject_id,
                            "p_module_no": module_no,
                            "p_topics": topics
                        }
                    ).execute()
                    logger.info(f"Successfully inserted topics for module {module_no}")
                except Exception as e:
                    logger.error(f"Error inserting topics for module {module_no}: {str(e)}")

        # Insert module Q&A
        logger.info("Inserting module Q&A...")
        for module_name, questions in content.get("important_qna", {}).items():
            # Extract module number
            module_no = module_name.replace('mod', '')
            
            if questions:
                try:
                    # Convert questions to JSONB format
                    questions_jsonb = [
                        {
                            "question": qa["question"],
                            "answer": qa["answer"]
                        } for qa in questions
                    ]
                    response = supabase.rpc(
                        "insert_module_questions",
                        {
                            "p_subject_id": subject_id,
                            "p_module_no": module_no,
                            "p_questions": questions_jsonb
                        }
                    ).execute()
                    logger.info(f"Successfully inserted Q&A for module {module_no}")
                except Exception as e:
                    logger.error(f"Error inserting Q&A for module {module_no}: {str(e)}")

        logger.info("=== Database insertion process completed ===")
        return True

    except Exception as e:
        logger.error(f"Error in database insertion process: {str(e)}")
        raise


async def upload_file_to_storage(file_path: str, user_id: str, subject: str, logger: logging.Logger) -> Optional[str]:
    """
    Upload a file to Supabase storage in the study_materials bucket.
    
    Args:
        file_path: Local path to the file to be uploaded
        user_id: User ID for the directory structure
        subject: Subject name for the directory structure
        logger: Logger instance for tracking operations
        
    Returns:
        Optional[str]: URL of the uploaded file if successful, None if file doesn't exist
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            logger.error(f"File not found at path: {file_path}")
            return None
            
        # Get the filename from the path
        filename = os.path.basename(file_path)
        
        # Create the storage path
        storage_path = f"{user_id}/{subject}/{filename}"
        
        logger.info(f"Starting upload of {filename} to storage path: {storage_path}")
        
        # Read the file content
        with open(file_path, 'rb') as file:
            file_content = file.read()
        
        # Get file extension and set content type
        file_extension = os.path.splitext(filename)[1].lower()
        content_type = "application/json" if file_extension == '.json' else "application/octet-stream"
        
        try:
            # Try to remove existing file first
            supabase.storage.from_("study_materials").remove([storage_path])
        except Exception:
            # If file doesn't exist or other error, continue with upload
            pass
            
        # Upload to Supabase storage
        response = supabase.storage\
            .from_("study_materials")\
            .upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": content_type}
            )
            
        # Get the public URL
        file_url = supabase.storage\
            .from_("study_materials")\
            .get_public_url(storage_path)
            
        logger.info(f"Successfully uploaded {filename} to storage")
        return file_url
        
    except Exception as e:
        logger.error(f"Error uploading file to storage: {str(e)}")
        raise


'''------------------'''
# Add status tracking
file_processing_status = {}

async def process_files_background(request: PostRequest, user_id: str):
    """Background task for processing uploaded files"""
    try:
        file_processing_status[user_id] = {"status": "processing", "error": None}
        
        # Move existing upload_files logic here
        logger.info("=== Starting background processing ===")
        logger.info("=== Starting upload process ===")
        logger.info(f"Verifying authentication for user request")
        verification = await verify_auth(request.token)
        if not verification.authenticated:
            logger.warning("Authentication failed")
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )

        current_user = verification.user
        logger.info(f"Authentication successful for user: {current_user.id}")
        
  
        # Define paths for different file categories
        paths = {
            "notes": f"{current_user.id}/{request.subject}/notes",
            "pyq": f"{current_user.id}/{request.subject}/pyq",
            "syllabus": f"{current_user.id}/{request.subject}/syllabus"
        }
        logger.info(f"Processing subject: {request.subject}")

        file_urls = {
            "notes": [],
            "pyq": [],
            "syllabus": []
        }

        saved_files = {
            "notes": [],
            "pyq": [],
            "syllabus": []
        }

        # Fetch files and download them
        logger.info("=== Starting file processing ===")
        for key, path in paths.items():
            try:
                logger.info(f"Processing category: {key}")
                logger.debug(f"Listing files from path: {path}")
                response = supabase.storage.from_("study_materials").list(
                    path=path,
                    options={
                        "limit": 100,
                        "sortBy": {"column": "name", "order": "desc"}
                    }
                )

                if response is None or len(response) == 0:
                    logger.info(f"No files found in {key} category")
                    continue

                logger.info(f"Found {len(response)} files in {key} category")

                # Create directory for saving files
                save_dir = os.path.join(Config.DATA_DIR, current_user.id, request.subject, key)
                os.makedirs(save_dir, exist_ok=True)
                logger.debug(f"Created directory: {save_dir}")

                for file in response:
                    try:
                        logger.info(f"Processing file: {file['name']}")
                        url = supabase.storage.from_("study_materials").get_public_url(
                            f"{path}/{file['name']}"
                        )
                        file_urls[key].append(url)
                        logger.debug(f"Generated public URL: {url}")

                        # Download the file
                        save_path = os.path.join(save_dir, file['name'])
                        success = await download_file(url, save_path)
                        if success:
                            saved_files[key].append(save_path)
                            logger.info(f"Successfully saved file to: {save_path}")
                        else:
                            logger.error(f"Failed to download file: {url}")

                    except Exception as e:
                        logger.error(f"Error processing file {file['name']}: {str(e)}")
                        continue

            except Exception as e:
                logger.error(f"Error accessing storage for {key}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error accessing storage for {key}: {str(e)}"
                )


        # Process PDFs and generate content & store to database
        logger.info("=== Starting PDF processing and content generation ===")
        try:
            # Process syllabus
            logger.info("Processing syllabus files...")
            if saved_files["syllabus"]:
                syllabus_text = load_pdf(saved_files["syllabus"][0])  # Take the first syllabus file
            else:
                syllabus_text = ""
                logger.warning("No syllabus files found")

            # Process question papers
            logger.info("Processing question papers...")
            questions_texts = [load_pdf(qf) for qf in saved_files["pyq"]]
            if not any(questions_texts):
                logger.warning("No question papers could be read")
                questions_texts = [""]  # Provide empty fallback

            # Process module notes
            logger.info("Processing notes...")
            module_notes = load_module_notes(saved_files["notes"])
            
            if not syllabus_text:
                logger.error("Failed to read syllabus file")
                raise HTTPException(status_code=500, detail="Failed to process syllabus file")

            # If module notes are empty, create fallback notes from syllabus and questions
            if not module_notes:
                logger.warning("Failed to read module notes, using syllabus and questions as fallback")
                # Combine all question texts
                combined_questions = "\n\n".join(qt for qt in questions_texts if qt)
                
                # Create a fallback module notes dictionary using syllabus text and questions
                module_notes = {
                    "syllabus_content": syllabus_text,
                    "questions_content": combined_questions
                }
                
            #if not module_notes:
                #logger.error("Failed to read any module notes")
                #raise HTTPException(status_code=500, detail="Failed to process module notes")

            # Generate content
            logger.info("Generating content from processed PDFs")
            generator = ContentGenerator()
            content = generator.generate_all_content(
                syllabus_text=syllabus_text,
                questions_texts=questions_texts,
                module_notes=module_notes  # Changed from notes_texts to module_notes
            )
            
            # Save output to file
            output_dir = os.path.join(Config.DATA_DIR, current_user.id, request.subject)
            output_path = os.path.join(output_dir, "output.json")
            
            logger.info(f"Saving generated content to: {output_path}")
            async with aiofiles.open(output_path, "w", encoding='utf-8') as f:
                await f.write(json.dumps(content, indent=2, ensure_ascii=False))

            # Upload saved file to storage
            try:
                storage_url = await upload_file_to_storage(
                    file_path=output_path,
                    user_id=current_user.id,
                    subject=request.subject,
                    logger=logger
                )
            except Exception as e:
                logger.error(f"Error uploading to storage: {str(e)}")
                # Continue execution even if storage upload fails

            # Insert content into database
            logger.info("Inserting generated content into database")
            await insert_content_to_database(
                user_id=current_user.id,
                subject=request.subject,
                content=content,
                logger=logger
            )
            
            logger.info(f"Successfully saved and stored content for {request.subject}")

        except Exception as e:
            logger.error(f"Error in content generation or storage: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error in content generation: {str(e)}")

        # Prepare response
        logger.info("=== Preparing response ===")
        all_files = []
        for category, urls in file_urls.items():
            for url in urls:
                all_files.append(FileDetail(name=category, url=url))
        logger.info(f"Total files in response: {len(all_files)}")

        logger.info("=== Upload process completed successfully ===")

        file_processing_status[user_id] = {"status": "completed", "error": None}
        logger.info(f"Background processing completed for user {user_id}")
        

    except HTTPException as he:
        logger.error(f"HTTP Exception occurred: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Background processing error: {str(e)}")
        file_processing_status[user_id] = {"status": "failed", "error": str(e)}

@router.post("/upload")
async def handle_upload(
    request: PostRequest,
    background_tasks: BackgroundTasks
):
    """Quick-return upload endpoint that triggers background processing"""
    try:
        verification = await verify_auth(request.token)
        if not verification.authenticated:
            raise HTTPException(status_code=401)
        
        current_user = verification.user
        #user_id = verification.user.id  #current_user.id
        background_tasks.add_task(process_files_background, request, current_user.id)
        
        # Add subject to subjects table
        logger.info("=== Updating subjects table ===")
        try:
            logger.info(f"Checking if subject {request.subject} exists for user {current_user.id}")
            existing_entry = supabase.table("subjects").select("*")\
                .eq("user_id", current_user.id)\
                .eq("subject_name", request.subject)\
                .execute()

            if not existing_entry.data:
                logger.info("Subject not found, adding to subjects table")
                supabase.table("subjects").insert({
                    "user_id": current_user.id,
                    "subject_name": request.subject
                }).execute()
                logger.info("Successfully added subject to table")
        except Exception as e:
            logger.error(f"Failed to insert subject: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to insert subject: {str(e)}"
            )

        # Update user's current subject
        logger.info("=== Updating user's current subject ===")
        try:
            # Get the subject_id
            subject_response = supabase.table("subjects").select("id")\
                .eq("user_id", current_user.id)\
                .eq("subject_name", request.subject)\
                .execute()
            
            if not subject_response.data:
                logger.error("Subject ID not found")
                raise ValueError("Subject not found in database")
        
            subject_id = subject_response.data[0]['id']
            
            # Update or insert into user_current_subject
            supabase.rpc(
                "upsert_user_current_subject",
                {
                    "p_user_id": current_user.id,
                    "p_subject_id": subject_id,
                    "p_subject_name": request.subject
                }
            ).execute()
            logger.info("Successfully updated user's current subject")
        except Exception as e:
            logger.error(f"Error updating user's current subject: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update current subject: {str(e)}"
            )

        return JSONResponse(
            status_code=202,
            content={
                "message": "Processing started",
                "status_endpoint": f"/status/{current_user.id}"
            }
        )
    except Exception as e:
        logger.error(f"Upload initiation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

#not used 4 now
@router.get("/status/{user_id}")
async def get_processing_status(user_id: str):
    """Check file processing status"""
    status = file_processing_status.get(user_id, {"status": "not_found", "error": None})
    return status




'''----------------------'''
'''
@router.post("/upload", response_model=PostResponse)
async def upload_files(request: PostRequest):
    """
    Upload endpoint that handles file listing, PDF processing, and content generation
    """
    try:
        logger.info("=== Starting upload process ===")
        logger.info(f"Verifying authentication for user request")
        verification = await verify_auth(request.token)
        if not verification.authenticated:
            logger.warning("Authentication failed")
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )

        current_user = verification.user
        logger.info(f"Authentication successful for user: {current_user.id}")
        
        # Define paths for different file categories
        paths = {
            "notes": f"{current_user.id}/{request.subject}/notes",
            "pyq": f"{current_user.id}/{request.subject}/pyq",
            "syllabus": f"{current_user.id}/{request.subject}/syllabus"
        }
        logger.info(f"Processing subject: {request.subject}")

        file_urls = {
            "notes": [],
            "pyq": [],
            "syllabus": []
        }

        saved_files = {
            "notes": [],
            "pyq": [],
            "syllabus": []
        }

        # Fetch files and download them
        logger.info("=== Starting file processing ===")
        for key, path in paths.items():
            try:
                logger.info(f"Processing category: {key}")
                logger.debug(f"Listing files from path: {path}")
                response = supabase.storage.from_("study_materials").list(
                    path=path,
                    options={
                        "limit": 100,
                        "sortBy": {"column": "name", "order": "desc"}
                    }
                )

                if response is None or len(response) == 0:
                    logger.info(f"No files found in {key} category")
                    continue

                logger.info(f"Found {len(response)} files in {key} category")

                # Create directory for saving files
                save_dir = os.path.join(Config.DATA_DIR, current_user.id, request.subject, key)
                os.makedirs(save_dir, exist_ok=True)
                logger.debug(f"Created directory: {save_dir}")

                for file in response:
                    try:
                        logger.info(f"Processing file: {file['name']}")
                        url = supabase.storage.from_("study_materials").get_public_url(
                            f"{path}/{file['name']}"
                        )
                        file_urls[key].append(url)
                        logger.debug(f"Generated public URL: {url}")

                        # Download the file
                        save_path = os.path.join(save_dir, file['name'])
                        success = await download_file(url, save_path)
                        if success:
                            saved_files[key].append(save_path)
                            logger.info(f"Successfully saved file to: {save_path}")
                        else:
                            logger.error(f"Failed to download file: {url}")

                    except Exception as e:
                        logger.error(f"Error processing file {file['name']}: {str(e)}")
                        continue

            except Exception as e:
                logger.error(f"Error accessing storage for {key}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error accessing storage for {key}: {str(e)}"
                )

        # Add subject to subjects table
        logger.info("=== Updating subjects table ===")
        try:
            logger.info(f"Checking if subject {request.subject} exists for user {current_user.id}")
            existing_entry = supabase.table("subjects").select("*")\
                .eq("user_id", current_user.id)\
                .eq("subject_name", request.subject)\
                .execute()

            if not existing_entry.data:
                logger.info("Subject not found, adding to subjects table")
                supabase.table("subjects").insert({
                    "user_id": current_user.id,
                    "subject_name": request.subject
                }).execute()
                logger.info("Successfully added subject to table")
        except Exception as e:
            logger.error(f"Failed to insert subject: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to insert subject: {str(e)}"
            )

        # Update user's current subject
        logger.info("=== Updating user's current subject ===")
        try:
            # Get the subject_id
            subject_response = supabase.table("subjects").select("id")\
                .eq("user_id", current_user.id)\
                .eq("subject_name", request.subject)\
                .execute()
            
            if not subject_response.data:
                logger.error("Subject ID not found")
                raise ValueError("Subject not found in database")
        
            subject_id = subject_response.data[0]['id']
            
            # Update or insert into user_current_subject
            supabase.rpc(
                "upsert_user_current_subject",
                {
                    "p_user_id": current_user.id,
                    "p_subject_id": subject_id,
                    "p_subject_name": request.subject
                }
            ).execute()
            logger.info("Successfully updated user's current subject")
        except Exception as e:
            logger.error(f"Error updating user's current subject: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update current subject: {str(e)}"
            )

        # Process PDFs and generate content & store to database
        logger.info("=== Starting PDF processing and content generation ===")
        try:
            # Process syllabus
            logger.info("Processing syllabus files...")
            if saved_files["syllabus"]:
                syllabus_text = load_pdf(saved_files["syllabus"][0])  # Take the first syllabus file
            else:
                syllabus_text = ""
                logger.warning("No syllabus files found")

            # Process question papers
            logger.info("Processing question papers...")
            questions_texts = [load_pdf(qf) for qf in saved_files["pyq"]]
            if not any(questions_texts):
                logger.warning("No question papers could be read")
                questions_texts = [""]  # Provide empty fallback

            # Process module notes
            logger.info("Processing notes...")
            module_notes = load_module_notes(saved_files["notes"])
            
            if not syllabus_text:
                logger.error("Failed to read syllabus file")
                raise HTTPException(status_code=500, detail="Failed to process syllabus file")

            if not module_notes:
                logger.error("Failed to read any module notes")
                raise HTTPException(status_code=500, detail="Failed to process module notes")

            # Generate content
            logger.info("Generating content from processed PDFs")
            generator = ContentGenerator()
            content = generator.generate_all_content(
                syllabus_text=syllabus_text,
                questions_texts=questions_texts,
                notes_texts=module_notes
            )

            # Save output to file
            output_dir = os.path.join(Config.DATA_DIR, current_user.id, request.subject)
            output_path = os.path.join(output_dir, "output.json")
            
            logger.info(f"Saving generated content to: {output_path}")
            async with aiofiles.open(output_path, "w", encoding='utf-8') as f:
                await f.write(json.dumps(content, indent=2, ensure_ascii=False))

            # Upload saved file to storage
            try:
                storage_url = await upload_file_to_storage(
                    file_path=output_path,
                    user_id=current_user.id,
                    subject=request.subject,
                    logger=logger
                )
            except Exception as e:
                logger.error(f"Error uploading to storage: {str(e)}")
                # Continue execution even if storage upload fails

            # Insert content into database
            logger.info("Inserting generated content into database")
            await insert_content_to_database(
                user_id=current_user.id,
                subject=request.subject,
                content=content,
                logger=logger
            )
            
            logger.info(f"Successfully saved and stored content for {request.subject}")

        except Exception as e:
            logger.error(f"Error in content generation or storage: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error in content generation: {str(e)}")

        # Prepare response
        logger.info("=== Preparing response ===")
        all_files = []
        for category, urls in file_urls.items():
            for url in urls:
                all_files.append(FileDetail(name=category, url=url))
        logger.info(f"Total files in response: {len(all_files)}")

        logger.info("=== Upload process completed successfully ===")
        return PostResponse(
            user_id=current_user.id,
            subject=request.subject,
            file_urls=all_files
        )

    except HTTPException as he:
        logger.error(f"HTTP Exception occurred: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

'''

@router.post("/get-current-subject", response_model=CurrentSubjectResponse)
async def get_current_subject(token: TokenSchema):
    try:
        logger.info("=== Getting current subject ===")
        verification = await verify_auth(token)
        if not verification.authenticated:
            logger.warning("Authentication failed")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        current_user = verification.user
        logger.info(f"Authentication successful for user: {current_user.id}")

        response = supabase.table("user_current_subject")\
            .select("subject_id, subject_name")\
            .eq("user_id", current_user.id)\
            .single()\
            .execute()

        if not response.data:
            logger.info(f"No current subject found for user {current_user.id}")
            return CurrentSubjectResponse()

        logger.info("Successfully retrieved current subject")
        return CurrentSubjectResponse(
            subject_name=response.data.get("subject_name"),
            subject_id=response.data.get("subject_id")
        )

    except Exception as e:
        logger.error(f"Error getting current subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        
'''        
@router.get("/current-subject")  #will havto make it a post to get the refresh tokens
async def get_current_subject():
    try:
        logger.info("=== Getting current subject ===")
        verification = await verify_auth()
        if not verification.authenticated:
            logger.warning("Authentication failed")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        current_user = verification.user
        logger.info(f"Authentication successful for user: {current_user.id}")

        response = supabase.table("user_current_subject")\
            .select("subject_id, subject_name, last_accessed")\
            .eq("user_id", current_user.id)\
            .single()\
            .execute()

        if not response.data:
            logger.info(f"No current subject found for user {current_user.id}")
            return {"subject": None}

        logger.info("Successfully retrieved current subject")
        return {
            "subject": response.data
        }

    except Exception as e:
        logger.error(f"Error getting current subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

'''


@router.post("/get-output-json")
async def get_output_json(request: PostRequest):
    try:
        logger.info("=== Getting output.json ===")
        verification = await verify_auth(request.token)
        if not verification.authenticated:
            logger.warning("Authentication failed")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        current_user = verification.user
        logger.info(f"Authentication successful for user: {current_user.id}")

        # Construct the file path
        file_path = f"{current_user.id}/{request.subject}/output.json"

        try:
            # Download the file from storage
            response = supabase.storage.from_("study_materials").download(file_path)
            
            # Parse the JSON content
            content = json.loads(response.decode('utf-8'))
            
            logger.info(f"Successfully retrieved output.json for {request.subject}")
            return content

        except Exception as e:
            logger.error(f"Error retrieving output.json: {str(e)}")
            raise HTTPException(status_code=404, detail="Output file not found")

    except Exception as e:
        logger.error(f"Error in get_output_json: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def generate_module_flashcards(self, module_key: str, module_content: str, notes_text: str, 
                             existing_qa: List[Dict[str, str]] = None) -> List[Dict[str, str]]:
    try:
        context = self.get_cached_context(module_content, notes_text)
        context = self.truncate_text(context, self.max_chunk_size)
        
        # Format prompt
        prompt = f"""Generate exactly {self.flashcards_per_module} flashcard pairs for module {module_key}.
        Make sure each flashcard tests a different concept.
        Focus on key terminology, definitions, and core concepts.
        Return in this exact JSON format:
        [
            {{"question": "question text", "answer": "answer text"}},
            ...
        ]
        
        Module content: {module_content}
        Additional context: {context}"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert in creating educational flashcards."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        # Parse and validate response
        try:
            flashcards = json.loads(response.choices[0].message.content)
            if not isinstance(flashcards, list):
                raise ValueError("Expected list of flashcards")
                
            # Validate and format each flashcard
            validated_flashcards = []
            for card in flashcards:
                if isinstance(card, dict) and "question" in card and "answer" in card:
                    validated_flashcards.append({
                        "question": str(card["question"]),
                        "answer": str(card["answer"]),
                        "module_number": module_key.replace("mod", "").strip()
                    })
            
            return validated_flashcards

        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse flashcards JSON for module {module_key}: {str(e)}")
            return []
            
    except Exception as e:
        logging.error(f"Error generating flashcards for module {module_key}: {str(e)}")
        return []