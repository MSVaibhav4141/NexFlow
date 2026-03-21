from fastapi import FastAPI, Request, status, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.v0.router import api_router
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

app = FastAPI()

origins = [
    "http://localhost:3002",  # Your Next.js frontend
    # "https://your-production-domain.com" # You will add this later when deploying!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers (like Content-Type, Authorization)
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "message": "Data validation failed",
            "errors": exc.errors() 
        },
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.detail
        },
    )
@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    print(f"Database Integrity Error: {exc}") 
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT, 
        content={
            "status": "error",
            "message": "Data conflict. This record might already exist or violate a constraint."
        },
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    print(f"General Database Error: {exc}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "An internal database error occurred." 
        },
    )
app.include_router(api_router, prefix="/api/v0")
    