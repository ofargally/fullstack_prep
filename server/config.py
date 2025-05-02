# This file is a replacement to the previous methid whereby we use dotenv library and load the variables directly
# This keeps everything centralized and ensures that pydantic validates the env variable content and converts
# them to appropriate type if necessary
from pydantic_settings import BaseSettings


# pydantic is case insensitive but whatever
class Settings(BaseSettings):
    MONGODB_USERNAME: str
    MONGODB_PASSWORD: str
    MONGODB_CLUSTER: str
    MONGODB_NAME: str
    # auto parse from .env

    @property
    def MONGODB_URL(self):
        mongodb_url = f"mongodb+srv://{self.MONGODB_USERNAME}:{self.MONGODB_PASSWORD}@{self.MONGODB_CLUSTER}/"
        print(f"MongoDB URL: {mongodb_url}")
        return mongodb_url

    class Config:
        env_file = ".env"


settings = Settings()
