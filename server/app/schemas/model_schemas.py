from pydantic import BaseModel
from typing import List,Optional
from app.schemas.auth_schema import UserData, TokenSchema

class PostRequest(BaseModel):
    user_id: str
    subject: str  # Removed user_id since we'll get it from the token
    token: TokenSchema
    #access_token: str
    #refresh_token: str
class FileDetail(BaseModel):
    name: str
    url: str

class PostResponse(BaseModel):
    user_id: str
    subject: str
    file_urls: List[FileDetail]

class CurrentSubjectResponse(BaseModel):
    subject_name: Optional[str] = None
    subject_id: Optional[str] = None

