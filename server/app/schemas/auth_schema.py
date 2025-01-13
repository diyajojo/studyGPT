from pydantic import BaseModel
from typing import Optional

class TokenSchema(BaseModel):
    access_token: str
    refresh_token: str
class UserData(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = None

class VerifyResponse(BaseModel):
    authenticated: bool
    user: UserData
