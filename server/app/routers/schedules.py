from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from supabase import create_client, Client
import json

app = FastAPI()

# Initialize Supabase client
supabase: Client = create_client(
    "YOUR_SUPABASE_URL",
    "YOUR_SUPABASE_KEY"
)

class ScheduleEvent(BaseModel):
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    subject_id: Optional[UUID4]

class CalendarIntegrationRequest(BaseModel):
    user_id: str
    events: List[ScheduleEvent]

async def get_valid_credentials(user_id: str) -> Credentials:
    """Get and validate Google credentials for a user."""
    try:
        # Fetch tokens from database
        response = supabase.table("user_calendar_tokens").select("*").eq("user_id", user_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Google Calendar tokens not found"
            )
            
        token_data = response.data[0]
        
        # Check if token is expired
        if datetime.now(timezone.utc) >= datetime.fromisoformat(token_data['expiry']):
            # Implement token refresh logic here
            credentials = Credentials(
                token=token_data['access_token'],
                refresh_token=token_data['refresh_token'],
                token_uri=token_data['token_uri'],
                client_id="YOUR_GOOGLE_CLIENT_ID",
                client_secret="YOUR_GOOGLE_CLIENT_SECRET",
                scopes=['https://www.googleapis.com/auth/calendar']
            )
            
            # Refresh token
            credentials.refresh(Request())
            
            # Update tokens in database
            supabase.table("user_calendar_tokens").update({
                "access_token": credentials.token,
                "expiry": credentials.expiry.isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("user_id", user_id).execute()
            
            return credentials
        
        return Credentials(
            token=token_data['access_token'],
            refresh_token=token_data['refresh_token'],
            token_uri=token_data['token_uri'],
            client_id="YOUR_GOOGLE_CLIENT_ID",
            client_secret="YOUR_GOOGLE_CLIENT_SECRET",
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting credentials: {str(e)}"
        )

async def save_schedule_to_db(user_id: str, events: List[dict]) -> List[dict]:
    """Save schedule events to database."""
    try:
        saved_events = []
        for event in events:
            data = {
                "user_id": user_id,
                "subject_id": event.get("subject_id"),
                "start_time": event["start_time"],
                "end_time": event["end_time"],
                "title": event["title"],
                "description": event.get("description"),
                "google_event_id": event["google_event_id"],
                "is_synced": True,
                "last_sync_at": datetime.now(timezone.utc).isoformat()
            }
            
            response = supabase.table("study_schedule").insert(data).execute()
            saved_events.append(response.data[0])
            
        return saved_events
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving to database: {str(e)}"
        )

@app.post("/api/calendar/integrate")
async def integrate_with_calendar(request: CalendarIntegrationRequest):
    try:
        # Get valid credentials
        credentials = await get_valid_credentials(request.user_id)
        
        # Build Google Calendar service
        service = build('calendar', 'v3', credentials=credentials)
        
        created_events = []
        
        # Create each event in Google Calendar
        for event in request.events:
            calendar_event = {
                'summary': event.title,
                'description': event.description or "",
                'start': {
                    'dateTime': event.start_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': event.end_time.isoformat(),
                    'timeZone': 'UTC',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': 30},
                        {'method': 'email', 'minutes': 60},
                    ],
                }
            }
            
            try:
                created_event = service.events().insert(
                    calendarId='primary',
                    body=calendar_event
                ).execute()
                
                # Add Google event ID and other metadata
                event_data = event.dict()
                event_data["google_event_id"] = created_event["id"]
                created_events.append(event_data)
                
            except HttpError as e:
                print(f"Error creating event: {str(e)}")
                continue
        
        # Save events to database
        saved_events = await save_schedule_to_db(request.user_id, created_events)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": f"Successfully added {len(created_events)} events to Google Calendar",
                "events": saved_events
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/calendar/schedule/{user_id}")
async def get_user_schedule(user_id: str):
    """Get user's schedule with sync status."""
    try:
        response = supabase.table("study_schedule")\
            .select("*, subjects(name)")\
            .eq("user_id", user_id)\
            .order("start_time", desc=False)\
            .execute()
            
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "schedule": response.data
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching schedule: {str(e)}"
        )

@app.delete("/api/calendar/event/{event_id}")
async def delete_calendar_event(event_id: str, user_id: str):
    """Delete an event from both Google Calendar and database."""
    try:
        # Get event details from database
        event_response = supabase.table("study_schedule")\
            .select("google_event_id")\
            .eq("id", event_id)\
            .eq("user_id", user_id)\
            .execute()
            
        if not event_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
            
        google_event_id = event_response.data[0]["google_event_id"]
        
        # Delete from Google Calendar
        if google_event_id:
            credentials = await get_valid_credentials(user_id)
            service = build('calendar', 'v3', credentials=credentials)
            service.events().delete(
                calendarId='primary',
                eventId=google_event_id
            ).execute()
        
        # Delete from database
        supabase.table("study_schedule")\
            .delete()\
            .eq("id", event_id)\
            .execute()
            
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "Event deleted successfully"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting event: {str(e)}"
        )