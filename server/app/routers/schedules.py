from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from pydantic import BaseModel
from typing import List, Optional
import json
import openai
from datetime import datetime, timedelta
from supabase import create_client, Client

app = FastAPI()

# Configure Google OAuth2 settings
GOOGLE_CLIENT_CONFIG = {
    "web": {
        "client_id": "YOUR_CLIENT_ID",
        "client_secret": "YOUR_CLIENT_SECRET",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["YOUR_REDIRECT_URI"]
    }
}

# Initialize Supabase client
supabase: Client = create_client(
    "YOUR_SUPABASE_URL",
    "YOUR_SUPABASE_KEY"
)

# Pydantic models
class StudyTopic(BaseModel):
    name: str
    duration: int  # in minutes
    priority: int

class ScheduleRequest(BaseModel):
    user_id: str
    topics: List[StudyTopic]
    preferred_start_time: str
    preferred_end_time: str
    preferred_days: List[str]

class ScheduleResponse(BaseModel):
    calendar_events: List[dict]
    success: bool
    message: str

# Helper function to get user's Google credentials from Supabase
async def get_user_credentials(user_id: str) -> Credentials:
    response = supabase.table("user_calendar_tokens").select("*").eq("user_id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, message="User credentials not found")
    
    token_info = response.data[0]
    
    return Credentials(
        token=token_info['access_token'],
        refresh_token=token_info['refresh_token'],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_CONFIG['web']['client_id'],
        client_secret=GOOGLE_CLIENT_CONFIG['web']['client_secret'],
        scopes=['https://www.googleapis.com/auth/calendar']
    )

# Initialize Google Calendar Flow
flow = Flow.from_client_config(
    GOOGLE_CLIENT_CONFIG,
    scopes=['https://www.googleapis.com/auth/calendar'],
    redirect_uri=GOOGLE_CLIENT_CONFIG['web']['redirect_uris'][0]
)

@app.post("/auth/google/callback")
async def google_auth_callback(code: str, user_id: str):
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Store credentials in Supabase
        token_data = {
            "user_id": user_id,
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "expiry": credentials.expiry.isoformat() if credentials.expiry else None
        }

        supabase.table("user_calendar_tokens").upsert(token_data).execute()

        return {"success": True, "message": "Successfully authenticated with Google Calendar"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def generate_study_schedule(request: ScheduleRequest) -> List[dict]:
    try:
        # Create prompt for OpenAI
        prompt = f"""
        Create a study schedule for the following topics:
        {json.dumps(request.topics)}
        
        Preferred study times:
        Start: {request.preferred_start_time}
        End: {request.preferred_end_time}
        Days: {request.preferred_days}
        
        Return a JSON array of events with:
        - summary (string)
        - description (string)
        - start_time (ISO string)
        - end_time (ISO string)
        - topic_name (string)
        """

        response = await openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a scheduling assistant. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ]
        )

        # Parse the response into a list of events
        events = json.loads(response.choices[0].message['content'])
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating schedule: {str(e)}")

async def add_events_to_calendar(credentials: Credentials, events: List[dict]) -> List[dict]:
    try:
        service = build('calendar', 'v3', credentials=credentials)
        created_events = []

        for event in events:
            calendar_event = {
                'summary': event['summary'],
                'description': event['description'],
                'start': {
                    'dateTime': event['start_time'],
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': event['end_time'],
                    'timeZone': 'UTC',
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': 30},
                        {'method': 'email', 'minutes': 60},
                    ],
                },
            }

            created_event = service.events().insert(
                calendarId='primary',
                body=calendar_event
            ).execute()
            
            created_events.append(created_event)

        return created_events
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding events to calendar: {str(e)}")

@app.post("/create-study-schedule", response_model=ScheduleResponse)
async def create_study_schedule(request: ScheduleRequest):
    try:
        # Get user's Google credentials
        credentials = await get_user_credentials(request.user_id)
        
        # Generate study schedule using OpenAI
        events = await generate_study_schedule(request)
        
        # Add events to Google Calendar
        created_events = await add_events_to_calendar(credentials, events)
        
        return ScheduleResponse(
            calendar_events=created_events,
            success=True,
            message="Successfully created study schedule and added to calendar"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))