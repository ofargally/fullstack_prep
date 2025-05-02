from bson import ObjectId
from pydantic import BaseModel, Field
from typing import List
import datetime
import uuid


class MessageInChat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()),
                    alias="_id")  # Use UUID for message ID
    user_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    timestamp: datetime.datetime = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc))


class Chat(BaseModel):
    # Fixed ID for the single chat document
    id: str = Field(default="main_chat", alias="_id")
    messages: List[MessageInChat] = []


class MessageCreatePayload(BaseModel):
    user_name: str = Field(..., min_length=1)
    message_text: str = Field(..., min_length=1)


class User(BaseModel):
    id: str = Field(..., alias="_id")


class UserCreate(BaseModel):
    user_name: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: str = Field(..., min_length=1)
