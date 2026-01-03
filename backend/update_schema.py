import asyncio
import os
from sqlalchemy import text
from database import engine

async def update_schema():
    print("Connecting to database...")
    async with engine.connect() as conn:
        print("Updating schema...")
        # Start transaction
        async with conn.begin():
             # Create type if not exists
             print("Creating Enum Type 'ingestion_status_enum'...")
             try:
                 await conn.execute(text("CREATE TYPE ingestion_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');"))
                 print("Created Enum Type.")
             except Exception as e:
                 # Postgres error code for duplicate object is 42710, but generic catch is okay for this script
                 print(f"Enum Type might exist: {e}")
             
             print("Adding ingestion_status column...")
             try:
                 await conn.execute(text("ALTER TABLE lenders ADD COLUMN ingestion_status ingestion_status_enum DEFAULT 'pending';"))
                 print("Added ingestion_status column.")
             except Exception as e:
                 print(f"Column ingestion_status error: {e}")

             print("Adding ingestion_error column...")
             try:
                 await conn.execute(text("ALTER TABLE lenders ADD COLUMN ingestion_error TEXT;"))
                 print("Added ingestion_error column.")
             except Exception as e:
                 print(f"Column ingestion_error error: {e}")
                 
    print("Schema update complete.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(update_schema())
