from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uuid
import jwt
from typing import List
import logging
from app.services.supabase_service import supabase
from app.routers.auth import get_current_user_from_token, verify_auth
from app.schemas.model_schemas import PostRequest, PostResponse, FileDetail
import os

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload", response_model=PostResponse)
async def upload_files(request: PostRequest):
    """
    Upload endpoint that uses JWT authentication to ensure
    users can only access their own files
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

        # Fetch files for each category
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

                # Generate public URLs for the files
                for file in response:
                    try:
                        url = supabase.storage.from_("study_materials").get_public_url(
                            f"{path}/{file['name']}"
                        )
                        file_urls[key].append(url)
                    except Exception as e:
                        logger.error(f"Error generating URL for file {file['name']}: {str(e)}")
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

        # Convert dictionary of URLs to list of FileDetail objects
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