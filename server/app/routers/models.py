from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import uuid
import jwt
from typing import List
from app.services.supabase_service import supabase
import os

router = APIRouter()
security = HTTPBearer()

# Request/Response models
class PostRequest(BaseModel):
    subject: str  # Removed user_id since we'll get it from the token

class PostResponse(BaseModel):
    user_id: str
    subject: str
    file_urls: List[str]

class UserData(BaseModel):
    id: str
    email: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserData:
    """Verify JWT token and return user data"""
    try:
        # Get JWT secret from environment
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            raise HTTPException(
                status_code=500,
                detail="JWT secret not configured"
            )

        # Verify the token
        payload = jwt.decode(
            credentials.credentials,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )

        # Extract user data from token
        return UserData(
            id=payload.get('sub'),
            email=payload.get('email')
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

@router.post("/upload", response_model=PostResponse)
async def upload_files(
    request: PostRequest,
    current_user: UserData = Depends(get_current_user)
):
    """
    Upload endpoint that uses JWT authentication to ensure
    users can only access their own files
    """
    try:
        # List files for the authenticated user
        response = supabase.storage.from_("study_materials").list(
            path=current_user.id,  # Use authenticated user's ID from JWT
            options={
                "limit": 100,
                "sortBy": {"column": "name", "order": "desc"}
            }
        )

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

    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

# Optional: Add an endpoint to verify authentication
@router.get("/verify")
async def verify_auth(current_user: UserData = Depends(get_current_user)):
    """
    Endpoint to verify authentication is working
    """
    return {
        "authenticated": True,
        "user_id": current_user.id,
        "email": current_user.email
    }