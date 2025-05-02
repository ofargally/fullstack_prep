import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status, Body, Path, Depends
from pydantic import BaseModel, Field, EmailStr, validator
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from dotenv import load_dotenv
from typing_extensions import Annotated

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "myFastapiDb")

db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    """Establishes an asynchronous connection to MongoDB."""
    global db
    print(f"Attempting to connect to MongoDB at {MONGODB_URI}...")
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')  # Verify connection
        db = client[DB_NAME]
        print(f"Successfully connected to MongoDB database: {DB_NAME}")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        db = None


async def close_mongo_connection():
    """Closes the MongoDB connection (if established)."""
    global db
    if db and db.client:
        db.client.close()
        print("MongoDB connection closed.")

PyObjectId = Annotated[
    str,
    BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v),
]


class ItemBase(BaseModel):
    """Base model with common fields."""
    name: str = Field(..., min_length=3, max_length=50,
                      description="Name of the item")
    description: Optional[str] = Field(
        None, max_length=300, description="Optional description")
    price: float = Field(..., gt=0,
                         description="Price must be greater than zero")
    tax: Optional[float] = Field(
        None, ge=0, description="Optional tax, must be non-negative")

    @validator('name')
    def name_must_not_contain_special_chars(cls, v):
        if any(char in "!@#$%^&*()" for char in v):
            raise ValueError(
                "Name must not contain special characters: !@#$%^&*()")
        return v.title()


class ItemCreate(ItemBase):
    """Model used when creating an item (doesn't include ID)."""
    pass


class ItemUpdate(BaseModel):
    """Model used for updating an item (all fields optional)."""
    name: Optional[str] = Field(
        None, min_length=3, max_length=50, description="Name of the item")
    description: Optional[str] = Field(
        None, max_length=300, description="Optional description")
    price: Optional[float] = Field(
        None, gt=0, description="Price must be greater than zero")
    tax: Optional[float] = Field(
        None, ge=0, description="Optional tax, must be non-negative")

    @validator('name')
    def name_must_not_contain_special_chars_update(cls, v):
        if v is None:
            return v
        if any(char in "!@#$%^&*()" for char in v):
            raise ValueError(
                "Name must not contain special characters: !@#$%^&*()")
        return v.title()


class ItemInDB(ItemBase):
    """Model representing an item as stored in MongoDB."""
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")


class ItemResponse(ItemBase):
    """Model used for API responses (includes ID)."""
    id: str

    class Config:
        model_config = {
            "populate_by_name": True,
            "json_encoders": {ObjectId: str},
            "arbitrary_types_allowed": True,
            "json_schema_extra": {
                "example": {
                    "id": "60d5ec49f7e4e2a3e8c4b5f6",
                    "name": "Example Item",
                    "description": "This is a sample item.",
                    "price": 99.99,
                    "tax": 9.99
                }
            }
        }


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency function to get the database instance."""
    if db is None:
        await connect_to_mongo()
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection not available."
            )
    return db


async def create_item(item_data: ItemCreate, db: AsyncIOMotorDatabase) -> ItemInDB:
    """
    Creates a new item in the database.
    Uses Motor's `insert_one` operation on the 'items' collection.
    """
    item_dict = item_data.model_dump()
    print(f"Inserting document into 'items' collection: {item_dict}")
    # MongoDB Operation: Insert a single document
    result = await db["items"].insert_one(item_dict)
    print(f"Inserted document ID: {result.inserted_id}")

    # MongoDB Operation: Find the newly inserted document by its _id
    created_item = await db["items"].find_one({"_id": result.inserted_id})

    if created_item:
        return ItemInDB(**created_item)
    else:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to retrieve created item after insertion.")


async def get_item_by_id(item_id: str, db: AsyncIOMotorDatabase) -> Optional[ItemInDB]:
    """
    Retrieves a single item by its ID.
    Uses Motor's `find_one` operation on the 'items' collection, querying by '_id'.
    """
    try:
        oid = ObjectId(item_id)
    except Exception:
        print(f"Invalid ObjectId format: {item_id}")
        return None

    print(f"Querying 'items' collection for _id: {oid}")
    # MongoDB Operation: Find a single document matching the _id
    item = await db["items"].find_one({"_id": oid})

    if item:
        print(f"Found document: {item}")
        return ItemInDB(**item)
    else:
        print(f"Document with _id {oid} not found.")
        return None


async def get_all_items(db: AsyncIOMotorDatabase, skip: int = 0, limit: int = 100) -> List[ItemInDB]:
    """
    Retrieves a list of items with pagination.
    Uses Motor's `find` operation on the 'items' collection, with `skip` and `limit` for pagination.
    """
    print(f"Querying 'items' collection with skip={skip}, limit={limit}")
    # MongoDB Operation: Find multiple documents, applying skip and limit
    items_cursor = db["items"].find().skip(skip).limit(limit)
    items = await items_cursor.to_list(length=limit)
    print(f"Found {len(items)} documents.")
    return [ItemInDB(**item) for item in items]


async def update_item(item_id: str, item_data: ItemUpdate, db: AsyncIOMotorDatabase) -> Optional[ItemInDB]:
    """
    Updates an existing item in the database using MongoDB's $set operator.
    Uses Motor's `update_one` operation on the 'items' collection, querying by '_id'.
    """
    try:
        oid = ObjectId(item_id)
    except Exception:
        print(f"Invalid ObjectId format for update: {item_id}")
        return None

    update_data = item_data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    print(
        f"Updating document in 'items' collection with _id: {oid}, update data: {update_data}")
    # MongoDB Operation: Update a single document matching _id using $set
    result = await db["items"].update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    print(
        f"Update result: matched_count={result.matched_count}, modified_count={result.modified_count}")

    if result.matched_count == 0:
        print(f"Document with _id {oid} not found for update.")
        return None

    # MongoDB Operation: Find the updated document by its _id to return it
    updated_item = await db["items"].find_one({"_id": oid})
    if updated_item:
        print(f"Returning updated document: {updated_item}")
        return ItemInDB(**updated_item)
    else:
        # This case is unlikely if matched_count > 0 but handles potential race conditions or issues
        print(f"Failed to retrieve document with _id {oid} after update.")
        return None


async def delete_item(item_id: str, db: AsyncIOMotorDatabase) -> bool:
    """
    Deletes an item from the database.
    Uses Motor's `delete_one` operation on the 'items' collection, querying by '_id'.
    """
    try:
        oid = ObjectId(item_id)
    except Exception:
        print(f"Invalid ObjectId format for delete: {item_id}")
        return False

    print(f"Deleting document in 'items' collection with _id: {oid}")
    # MongoDB Operation: Delete a single document matching _id
    result = await db["items"].delete_one({"_id": oid})
    print(f"Delete result: deleted_count={result.deleted_count}")

    return result.deleted_count > 0

app = FastAPI(
    title="Item Service API",
    description="API for managing items in a MongoDB database using FastAPI and Motor.",
    version="1.0.0",
)


@app.post("/items/",
          response_model=ItemResponse,
          status_code=status.HTTP_201_CREATED,
          summary="Create a new item",
          tags=["Items"])
async def create_new_item(item: ItemCreate = Body(...), db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Creates a new item with the provided data.

    - **name**: Each item must have a name (3-50 chars).
    - **description**: Optional description (max 300 chars).
    - **price**: Required price, must be positive.
    - **tax**: Optional non-negative tax.
    """
    try:
        created_item_db = await create_item(item, db)
        return created_item_db
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in create_new_item endpoint: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"An unexpected error occurred: {e}")


@app.get("/items/",
         response_model=List[ItemResponse],
         summary="Retrieve multiple items",
         tags=["Items"])
async def read_items(skip: int = 0, limit: int = 10, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Retrieve items with pagination.
    - **skip**: Number of items to skip.
    - **limit**: Maximum number of items to return.
    """
    if limit > 1000:
        limit = 1000
    items_db = await get_all_items(db, skip=skip, limit=limit)
    return items_db


@app.get("/items/{item_id}",
         response_model=ItemResponse,
         summary="Retrieve a single item by ID",
         tags=["Items"])
async def read_single_item(
    item_id: str = Path(..., description="The ID of the item to retrieve",
                        example="60d5ec49f7e4e2a3e8c4b5f6"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get details of a specific item using its unique MongoDB ObjectId.
    """
    item = await get_item_by_id(item_id, db)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Item with id {item_id} not found")
    return item


@app.put("/items/{item_id}",
         response_model=ItemResponse,
         summary="Update an item by ID",
         tags=["Items"])
async def update_existing_item(
    item_id: str = Path(..., description="The ID of the item to update"),
    item_update: ItemUpdate = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update an item's details. Provide only the fields you want to change.
    Uses PUT semantics but underlying logic performs a partial update ($set).
    """
    updated_item = await update_item(item_id, item_update, db)
    if updated_item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Item with id {item_id} not found or update failed")
    return updated_item


@app.delete("/items/{item_id}",
            status_code=status.HTTP_204_NO_CONTENT,
            summary="Delete an item by ID",
            tags=["Items"])
async def delete_existing_item(
    item_id: str = Path(..., description="The ID of the item to delete"),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Deletes an item from the database based on its ID.
    Returns 204 No Content on successful deletion.
    """
    deleted = await delete_item(item_id, db)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Item with id {item_id} not found")


@app.get("/", summary="Root endpoint", include_in_schema=False)
async def root():
    return {"message": "Welcome to the Item Service API!"}
