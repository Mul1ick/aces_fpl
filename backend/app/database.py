from prisma import Prisma

# This creates a single, reusable client instance
db_client = Prisma()

async def get_db():
    """
    Dependency that connects and disconnects the Prisma client
    for each request.
    """
    if not db_client.is_connected():
        await db_client.connect()
    
    try:
        yield db_client
    finally:
        if db_client.is_connected():
            await db_client.disconnect()