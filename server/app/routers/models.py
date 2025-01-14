from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uuid
import jwt
from typing import List
from app.services.supabase_service import supabase
from app.routers.auth import get_current_user_from_token, verify_auth
from app.schemas.model_schemas import PostRequest, PostResponse
import os

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
            response = supabase.storage.from_("study_materials").list(
                path=current_user.id,  # Use authenticated user's ID from JWT
                options={
                    "limit": 100,
                    "sortBy": {"column": "name", "order": "desc"}
                }
            )
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
                )
                for file in response
            ]

            return PostResponse(
                user_id=current_user.id,  # Use authenticated user's ID
                subject=request.subject,
                file_urls=file_urls
            )
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

