from motor.motor_asyncio import AsyncIOMotorClient
from config import settings


async def get_mongo_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    try:
        yield client[settings.MONGODB_NAME]
    finally:
        client.close()
