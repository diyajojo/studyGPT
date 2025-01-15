from fastapi import APIRouter, HTTPException
from fastapi.security import HTTPBearer
import uuid
import jwt
from typing import List
import logging
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

logger = logging.getLogger(__name__)
router = APIRouter()
async def download_file(url: str, save_path: str):
    """Download a file from URL and save it locally"""
    bucket_path = url.split("study_materials/")[1]  # Extract path after bucket name
    
    async with aiofiles.open(save_path, 'wb+') as f:
        response = supabase.storage.from_("study_materials").download(bucket_path)
        await f.write(response)
    return True
'''
async def download_file(url: str, save_path: str):
    """Download a file from URL and save it locally"""
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                async with aiofiles.open(save_path, 'wb') as f:
                    await f.write(await response.read())
                return True
    return False
'''
def load_multiple_pdfs(file_paths):
    """Extract and concatenate text from multiple PDF files."""
    all_text = ""
    for path in file_paths:
        text = extract_text_from_pdf(path)
        if text:     
            all_text += f"\n{text}"  # Separate files with a newline
        else:
            logger.error(f"Error: Failed to read PDF file at {path}")
    return all_text

@router.post("/upload", response_model=PostResponse)
async def upload_files(request: PostRequest):
    """
    Upload endpoint that handles file listing, PDF processing, and content generation
    """
    try:
        verification = await verify_auth(request.token)
        if not verification.authenticated:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )

        current_user = verification.user
        
        # Define paths for different file categories
        paths = {
            "notes": f"{current_user.id}/{request.subject}/notes",
            "pyq": f"{current_user.id}/{request.subject}/pyq",
            "syllabus": f"{current_user.id}/{request.subject}/syllabus"
        }

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
        for key, path in paths.items():
            try:
                response = supabase.storage.from_("study_materials").list(
                    path=path,
                    options={
                        "limit": 100,
                        "sortBy": {"column": "name", "order": "desc"}
                    }
                )

                if response is None or len(response) == 0:
                    continue

                # Create directory for saving files
                save_dir = os.path.join(Config.DATA_DIR, current_user.id, request.subject, key)
                os.makedirs(save_dir, exist_ok=True)

                for file in response:
                    try:
                        url = supabase.storage.from_("study_materials").get_public_url(
                            f"{path}/{file['name']}"
                        )
                        file_urls[key].append(url)

                        # Download the file
                        save_path = os.path.join(save_dir, file['name'])
                        success = await download_file(url, save_path)
                        if success:
                            saved_files[key].append(save_path)
                        else:
                            logger.error(f"Failed to download file: {url}")

                    except Exception as e:
                        logger.error(f"Error processing file {file['name']}: {str(e)}")
                        continue

            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error accessing storage for {key}: {str(e)}"
                )

        # Add subject to subjects table
        try:
            existing_entry = supabase.table("subjects").select("*")\
                .eq("user_id", current_user.id)\
                .eq("subject_name", request.subject)\
                .execute()

            if not existing_entry.data:
                supabase.table("subjects").insert({
                    "user_id": current_user.id,
                    "subject_name": request.subject
                }).execute()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to insert subject: {str(e)}"
            )

        # Process PDFs and generate content
        syllabus_text = load_multiple_pdfs(saved_files["syllabus"])
        questions_text = load_multiple_pdfs(saved_files["pyq"])
        notes_text = load_multiple_pdfs(saved_files["notes"])

        if all([syllabus_text, questions_text, notes_text]):
            try:
                # Generate content
                generator = ContentGenerator()
                content = generator.generate_all_content(syllabus_text, questions_text, notes_text)

                # Save output
                output_dir = os.path.join(Config.DATA_DIR, current_user.id, request.subject)
                output_path = os.path.join(output_dir, "output.json")
                
                async with aiofiles.open(output_path, "w", encoding='utf-8') as f:
                    await f.write(json.dumps(content, indent=2, ensure_ascii=False))
                
                logger.info(f"Successfully processed PDFs and generated content for {request.subject}")
            except Exception as e:
                logger.error(f"Error generating content: {str(e)}")
                # Continue execution even if content generation fails
        else:
            logger.warning("Some PDF files could not be processed")

        # Convert dictionary of URLs to list of FileDetail objects for response
        all_files = []
        for category, urls in file_urls.items():
            for url in urls:
                all_files.append(FileDetail(name=category, url=url))

        return PostResponse(
            user_id=current_user.id,
            subject=request.subject,
            file_urls=all_files
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )