from prisma import Prisma

# This creates a single, reusable client instance
db_client = Prisma()

async def get_db():
    yield prisma

