# At the top of your file, update the logging configuration:

from fastapi import APIRouter, HTTPException
from fastapi.security import HTTPBearer
import uuid
import jwt
from typing import List
import logging
from logging.handlers import RotatingFileHandler
import os
import json
import aiohttp
import aiofiles
from app.services.supabase_service import supabase
from app.routers.auth import verify_auth
from app.schemas.model_schemas import PostRequest, PostResponse, FileDetail
from model.src.config import Config
from model.src.utils.pdf_utils import extract_text_from_pdf
from model.src.generator.content_generator import ContentGenerator

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

        # Process PDFs and generate content
        logger.info("=== Starting PDF processing and content generation ===")
        logger.info("Processing syllabus files...")
        syllabus_text = load_multiple_pdfs(saved_files["syllabus"])
        logger.info("Processing question papers...")
        questions_text = load_multiple_pdfs(saved_files["pyq"])
        logger.info("Processing notes...")
        notes_text = load_multiple_pdfs(saved_files["notes"])

        if all([syllabus_text, questions_text, notes_text]):
            try:
                logger.info("Generating content from processed PDFs")
                generator = ContentGenerator()
                content = generator.generate_all_content(syllabus_text, questions_text, notes_text)

                # Save output
                output_dir = os.path.join(Config.DATA_DIR, current_user.id, request.subject)
                output_path = os.path.join(output_dir, "output.json")
                
                logger.info(f"Saving generated content to: {output_path}")
                async with aiofiles.open(output_path, "w", encoding='utf-8') as f:
                    await f.write(json.dumps(content, indent=2, ensure_ascii=False))
                
                logger.info(f"Successfully saved content for {request.subject}")
            except Exception as e:
                logger.error(f"Error generating content: {str(e)}")
        else:
            logger.warning("Some PDF files could not be processed")

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