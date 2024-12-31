from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
#from app.routers import notes, study_sessions

app = FastAPI(
    title="StudyGPT",
    description="An AI-powered study assistant and note-taking platform",
    version="1.0.0",
)

# CORS setup
origins = [
    "http://localhost:3000",  #Local Host
    "https://studygpt.vercel.app",  #Deployed Frontend URL
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
#app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
#app.include_router(study_sessions.router, prefix="/api/study-sessions", tags=["Study Sessions"])

@app.get("/")
def read_root():
    return {"message": "Welcome to StudyGPT API!"}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "Server is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)