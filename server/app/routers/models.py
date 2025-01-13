from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
from app.services.supabase_service import supabase

router = APIRouter()

class PostRequest(BaseModel):
    user_id: str
    subject: str

class PostResponse(BaseModel):
    user_id: str
    subject: str
    file_urls: list[str]

@router.post("/upload", response_model=PostResponse)
async def upload_files(request: PostRequest):
    try:
        # Generate a new UUID
        new_uuid = str(uuid.uuid4())
        
        # Get the list of files in the directory named as the UUID
        #response = supabase.storage.from_("study_materials").list(new_uuid)
        response = supabase.storage.from_("study_materials").list(
            request.user_id#,
            #{"limit": 100, "offset": 0, "sortBy": {"column": "name", "order": "desc"}},
        )
        if not response:
            raise HTTPException(status_code=400, detail="Error fetching files from Supabase")

        # Generate URLs for the files
        file_urls = [supabase.storage.from_("study_materials").get_public_url(f"{new_uuid}/{file['name']}") for file in response]

        return PostResponse(user_id=request.user_id, subject=request.subject, file_urls=file_urls)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
