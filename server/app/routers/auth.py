from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from typing import Optional
import os

router = APIRouter()
security = HTTPBearer()

class UserData(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = None

class VerifyResponse(BaseModel):
    authenticated: bool
    user: UserData

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_refresh_token: Optional[str] = Header(None, alias="X-Refresh-Token")
) -> UserData:
    try:
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            raise HTTPException(
                status_code=500,
                detail="JWT secret not configured"
            )

        # Verify the access token
        payload = jwt.decode(
            credentials.credentials,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )

        # Extract user metadata from the token
        user_metadata = payload.get('user_metadata', {})
        
        return UserData(
            id=payload.get('sub'),
            email=payload.get('email'),
            full_name=user_metadata.get('full_name'),
            avatar_url=user_metadata.get('avatar_url'),
            provider=payload.get('app_metadata', {}).get('provider')
        )

    except jwt.ExpiredSignatureError:
        # If access token is expired and refresh token is provided
        if x_refresh_token:
            try:
                # Here you would typically verify the refresh token
                # and generate a new access token
                # For now, we'll raise an error to indicate refresh is needed
                raise HTTPException(
                    status_code=401,
                    detail="Token expired. Refresh required."
                )
            except Exception as refresh_error:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid refresh token"
                )
        raise HTTPException(
            status_code=401,
            detail="Token expired"
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

@router.post("/verify", response_model=VerifyResponse)
async def verify_auth(current_user: UserData = Depends(get_current_user)):
    """
    POST endpoint to verify authentication status
    """
    return VerifyResponse(
        authenticated=True,
        user=current_user
    )