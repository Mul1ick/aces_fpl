from prisma import Prisma

# This creates a single, reusable client instance
db_client = Prisma()

async def get_db():
    # ensure connected once, then just yield
    if not db_client.is_connected():
        await db_client.connect()
    yield db_client

