from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_URL:str
    PORT:int = 8080
    LLM_API_KEY:str
    JWT_SECRET:str
    class Config:
        env_file = '.env'
        env_file_encoding = "utf-8"

settings = Settings()#type:ignore