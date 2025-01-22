import os
import logging
from fastapi import APIRouter, HTTPException
from app.services.supabase_service import supabase
from app.routers.auth import verify_auth
from app.schemas.auth_schema import TokenSchema
from pydantic import BaseModel, UUID4
from typing import List
from datetime import datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from os import getenv
from dotenv import load_dotenv

# Configure logging
try:
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)

    # Configure logging format
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # Setup file handler
    file_handler = logging.FileHandler('logs/app.log')
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)

    # Setup console handler  
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Add handlers if not already present
    if not root_logger.handlers:
        root_logger.addHandler(file_handler)
        root_logger.addHandler(console_handler)

    # Get module logger
    logger = logging.getLogger(__name__)
    logger.info("Logging initialized successfully")

except Exception as e:
    print(f"Failed to initialize logging: {str(e)}")
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    logger.error(f"Fallback logging configured due to error: {str(e)}")

router = APIRouter()

class ScheduleResponse(BaseModel):
    id: UUID4
    subject_id: UUID4
    start_time: datetime
    end_time: datetime
    title: str
    description: str
    created_by: str
    created_at: datetime

class CalendarSyncRequest(BaseModel):
    user_id: str
    subject_id: UUID4
    token: TokenSchema

@router.post("/sync")
async def sync_to_google_calendar(request: CalendarSyncRequest):
    try:
        verification = await verify_auth(request.token)
        if not verification.authenticated:
            raise HTTPException(status_code=401, detail="Unauthorized")

        current_user = verification.user
        
        # Log token information (exclude sensitive parts)
        logger.info(f"Attempting calendar sync for user {current_user.id}")
        logger.debug("Token present: %s", bool(request.token.access_token))
        logger.debug("Refresh token present: %s", bool(request.token.refresh_token))

        # 1. Fetch unsynced schedules from database
        response = supabase.table("schedules")\
            .select("*")\
            .eq("created_by", current_user.id)\
            .eq("subject_id", request.subject_id)\
            .execute()

        if not response.data:
            logger.info(f"No schedules found for user {current_user.id}")
            return {
                "success": True,
                "message": "No schedules found to sync",
                "synced_events": [],
                "failed_events": []
            }

        # 2. Prepare OAuth credentials
        load_dotenv()
        token = request.token.access_token
        refresh_token = request.token.refresh_token
        client_id = getenv('GOOGLE_CLIENT_ID')
        client_secret = getenv('GOOGLE_CLIENT_SECRET')
        token_uri = 'https://oauth2.googleapis.com/token'

        SCOPES = ['https://www.googleapis.com/auth/calendar']

        try:
            # First validate the token format
            if not token or not refresh_token:
                logger.error("Missing required token information")
                return {
                    "success": False,
                    "error": "Invalid Google Calendar authorization. Please reconnect your Google Calendar.",
                    "error_code": "MISSING_TOKEN_INFO"
                }

            # Create credentials object
            creds = Credentials(
                token,
                refresh_token=refresh_token,
                token_uri=token_uri,
                client_id=client_id,
                client_secret=client_secret,
                scopes=SCOPES
            )

            # Attempt to refresh token if needed
            if not creds.valid:
                if creds.expired:
                    logger.info("Token expired, attempting refresh")
                    try:
                        # Use a separate Request object for refresh
                        request_obj = Request()
                        creds.refresh(request_obj)
                        logger.info("Successfully refreshed token")
                        
                        # Consider saving the new tokens here
                        new_access_token = creds.token
                        new_refresh_token = creds.refresh_token
                        
                        # TODO: Update tokens in your database if needed
                        # await update_user_tokens(current_user.id, new_access_token, new_refresh_token)
                        
                    except Exception as refresh_error:
                        logger.error(f"Token refresh failed: {str(refresh_error)}")
                        return {
                            "success": False,
                            "error": "Google Calendar authorization expired. Please reconnect your account.",
                            "error_code": "TOKEN_REFRESH_FAILED",
                            "error_details": str(refresh_error)
                        }

            # Create calendar service with validated credentials
            try:
                service = build('calendar', 'v3', credentials=creds)
                
                # Test API access with a simple call
                calendar_list = service.calendarList().list(maxResults=1).execute()
                logger.info("Successfully validated Google Calendar access")
                
            except Exception as service_error:
                logger.error(f"Failed to initialize calendar service: {str(service_error)}")
                return {
                    "success": False,
                    "error": "Unable to access Google Calendar API. Please reconnect your account.",
                    "error_code": "SERVICE_INITIALIZATION_FAILED",
                    "error_details": str(service_error)
                }

            # Process events
            synced_events = []
            failed_events = []
            
            for schedule in response.data:
                event = {
                    'summary': schedule['title'],
                    'description': schedule['description'],
                    'start': {
                        'dateTime': schedule['start_time'],
                        'timeZone': 'UTC',
                    },
                    'end': {
                        'dateTime': schedule['end_time'],
                        'timeZone': 'UTC',
                    },
                    'reminders': {
                        'useDefault': True
                    }
                }

                try:
                    created_event = service.events().insert(
                        calendarId='primary',
                        body=event
                    ).execute()

                    # Update database with sync information
                    supabase.table("schedules").update({
                        "google_event_id": created_event['id'],
                        "is_synced": True,
                        "last_sync_at": datetime.now().isoformat()
                    }).eq("id", schedule['id']).execute()

                    synced_events.append({
                        "schedule_id": schedule['id'],
                        "google_event_id": created_event['id']
                    })
                    
                    logger.info(f"Successfully synced schedule {schedule['id']}")
                    
                except Exception as event_error:
                    logger.error(f"Failed to sync schedule {schedule['id']}: {str(event_error)}")
                    failed_events.append({
                        "schedule_id": schedule['id'],
                        "error": str(event_error)
                    })

            return {
                "success": len(failed_events) == 0,
                "synced_events": synced_events,
                "failed_events": failed_events,
                "total_synced": len(synced_events),
                "total_failed": len(failed_events)
            }

        except Exception as google_error:
            logger.error(f"Google Calendar API error: {str(google_error)}")
            return {
                "success": False,
                "error": "Failed to connect to Google Calendar. Please try again later.",
                "error_code": "GOOGLE_API_ERROR",
                "error_details": str(google_error)
            }

    except Exception as e:
        logger.error(f"Error in sync_to_google_calendar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))