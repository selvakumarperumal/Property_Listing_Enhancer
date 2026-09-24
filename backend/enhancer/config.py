from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    HF_TOKEN: str
    HF_THINKING_MODEL_REPO: str
    HF_THINKING_MODEL_PROVIDER_NAME: str
    MAX_NEW_TOKENS: int = 1024

settings = Settings()