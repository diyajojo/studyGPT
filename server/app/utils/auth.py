from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict
import jwt
from pydantic import BaseModel
import os
from datetime import datetime

security = HTTPBearer()

class UserData(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = None

class AuthService:
    def __init__(self):
        # Get this from Supabase Dashboard -> Project Settings -> API -> JWT Settings
        self.jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not self.jwt_secret:
            raise ValueError("SUPABASE_JWT_SECRET environment variable is not set")

    def decode_token(self, token: str) -> Dict:
        try:
            # Decode and verify the JWT token
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
            
            # Check if token is expired
            if payload.get('exp'):
                exp_timestamp = payload.get('exp')
                if datetime.utcnow().timestamp() > exp_timestamp:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired"
                    )
            
            return payload
            
        except jwt.InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )

    def extract_user_data(self, payload: Dict) -> UserData:
        """Extract user data from JWT payload"""
        user_metadata = payload.get('user_metadata', {})
        
        return UserData(
            id=payload.get('sub'),
            email=payload.get('email'),
            full_name=user_metadata.get('full_name'),
            avatar_url=user_metadata.get('avatar_url'),
            provider=payload.get('app_metadata', {}).get('provider')
        )

auth_service = AuthService()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserData:
    """
    Dependency to get the current authenticated user from the access token.
    Usage:
    @app.get("/protected")
    async def protected_route(user: UserData = Depends(get_current_user)):
        return {"message": f"Hello {user.full_name}"}
    """
    try:
        # Verify and decode the access token
        payload = auth_service.decode_token(credentials.credentials)
        
        # Extract user data from the payload
        user = auth_service.extract_user_data(payload)
        
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# Optional: Refresh token handling
async def refresh_access_token(refresh_token: str):
    """
    Handle token refresh if needed.
    Note: Supabase client libraries usually handle token refresh automatically,
    but this is here if you need manual refresh handling.
    """
    try:
        # You would typically call Supabase's token refresh endpoint
        # This is just a placeholder for the structure
        raise NotImplementedError(
            "Token refresh should typically be handled by Supabase client"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not refresh token"
        )
'''
# Example protected route
from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
async def get_user_profile(user: UserData = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "provider": user.provider
    }
    '''