from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Body  # Added Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from models import (
    Chat,
    MessageInChat,
    MessageCreatePayload,
    User,
    UserCreate,
    UserResponse
)
from database import get_mongo_db
from config import settings
from typing import List
import datetime
import uuid

app = FastAPI(title="Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Constants ---
CHAT_DOCUMENT_ID = "main_chat"  # id for a single chat document


@app.get("/")
async def read_root():
    """ Basic endpoint to check if the API is running. """
    return {"status": "API is running"}


# function retrieves all messages from the single chat document
@app.get("/chat/",
         response_model=List[MessageInChat],
         summary="Get all messages",
         tags=["Chat"])
async def get_chat_messages(db: AsyncIOMotorClient = Depends(get_mongo_db)):
    chat_doc = await db["chats"].find_one({"_id": CHAT_DOCUMENT_ID})
    if chat_doc:
        # Return the messages array, default to empty list if 'messages' field doesn't exist
        return chat_doc.get("messages", [])
    else:
        # If the chat document doesn't exist yet, return an empty list
        return []


@app.post("/chat/",
          response_model=MessageInChat,  # Return the message that was added
          status_code=status.HTTP_201_CREATED,
          summary="Post a new message",
          tags=["Chat"])
async def post_new_message(
    payload: MessageCreatePayload = Body(...),  # Use payload model
    db: AsyncIOMotorClient = Depends(get_mongo_db)
):
    # 1. Validate user exists
    user = await db["users"].find_one({"_id": payload.user_name})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"User '{payload.user_name}' not found")

    # 2. Create the message object
    new_message = MessageInChat(
        user_id=payload.user_name,
        message=payload.message_text
    )
    message_dict = new_message.model_dump(by_alias=True)  # Get dict with _id

    update_result = await db["chats"].find_one_and_update(
        {"_id": CHAT_DOCUMENT_ID},
        {"$push": {"messages": message_dict}},
        upsert=True,
        return_document=True
    )
    if not update_result:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to update chat document")
    return new_message


# create new user
@app.post("/users/",
          response_model=UserResponse,
          status_code=status.HTTP_201_CREATED,
          summary="Create a new user",
          tags=["Users"])
async def post_user(
    user_data: UserCreate = Body(...),
    db: AsyncIOMotorClient = Depends(get_mongo_db)
):
    collection = db["users"]
    user_id = user_data.user_name

    # Check if user already exists
    existing_user = await collection.find_one({"_id": user_id})
    if existing_user:
        existing_user["id"] = existing_user.pop("_id")
        return UserResponse(**existing_user)

    # Create new user document
    new_user_doc = User(_id=user_id)
    insert_result = await collection.insert_one(new_user_doc.model_dump(by_alias=True))
    created_user = await collection.find_one({"_id": insert_result.inserted_id})
    if created_user:
        created_user["id"] = created_user.pop("_id")
        print(f"Created user: {created_user}")
        return UserResponse(**created_user)
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to retrieve user after creation.")


@app.get("/users/",
         response_model=List[UserResponse],
         summary="Get all users",
         tags=["Users"])
async def get_users(db: AsyncIOMotorClient = Depends(get_mongo_db)):
    users_cursor = db["users"].find()
    users_list = await users_cursor.to_list(length=None)  # Get all users
    # Convert MongoDB docs to UserResponse models
    return [UserResponse(**user) for user in users_list]
