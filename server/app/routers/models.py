
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
#security = HTTPBearer()


@router.post("/upload", response_model=PostResponse)
async def upload_files(
    request: PostRequest,
):
    """
    Upload endpoint that uses JWT authentication to ensure
    users can only access their own files
    """
    try:
        #current_user = await get_current_user_from_token(token)
        verification = await verify_auth(request.token)
        if verification.authenticated:
            current_user = verification.user
            # List files for the authenticated user
            '''//////'''
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

            for key, path in paths.items():
                try:
                    # List files in storage
                    response = supabase.storage.from_("study_materials").list(
                        path=path,
                        options={
                            "limit": 100,
                            "sortBy": {"column": "name", "order": "desc"}
                        }
                    )

                    # Validate response
                    if response is None or len(response) == 0:
                        file_urls[key] = []  # Initialize empty list for this key
                        continue  # Skip to next iteration instead of raising exception

                    # Generate public URLs for the files with error handling
                    file_urls[key] = []
                    for file in response:
                        try:
                            url = supabase.storage.from_("study_materials").get_public_url(
                                f"{path}/{file['name']}"
                            )
                            file_urls[key].append(url)
                        except Exception as e:
                            logger.error(f"Error generating URL for file {file['name']}: {str(e)}")
                            continue  # Skip failed URL generation and continue with next file

                except Exception as e:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error accessing storage for {key}: {str(e)}"
                    )

'''
            response = supabase.storage.from_("study_materials").list(
                path=current_user.id,  # Use authenticated user's ID from JWT
                options={
                    "limit": 100,
                    "sortBy": {"column": "name", "order": "desc"}
                }
            )
'''
        ##### Adding subject to subjects table
            try:
                # Check if the subject and user_id already exist in the public.subjects table
                existing_entry = supabase.table("subjects").select("*").eq("user_id", current_user.id).eq("subject_name", request.subject).execute()

                if not existing_entry.data:
                    # Insert the new subject and user_id into the public.subjects table
                    supabase.table("subjects").insert({"user_id": current_user.id, "subject_name": request.subject}).execute()
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to insert subject: {str(e)}"
                )
####



            if response is None:  # Check if response is None
                raise HTTPException(
                    status_code=404,
                    detail="No files found"
                )

            # Generate public URLs for the files
            file_urls = [
                supabase.storage.from_("study_materials").get_public_url(
                    f"{current_user.id}/{file['name']}"
            # Convert dictionary of URLs to list of FileDetail objects
            all_files = []
            for category, urls in file_urls.items():
                for url in urls:
                    all_files.append(FileDetail(name=category, url=url))
                file_urls=all_files
            )
                for file in response
            ]

            '''return PostResponse(
                user_id=current_user.id,  # Use authenticated user's ID
                subject=request.subject,
                file_urls=file_urls
            )'''

        else:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )
