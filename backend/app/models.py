from sqlalchemy import Table, Column, Integer, String, MetaData, ForeignKey

metadata = MetaData()

users = Table(
    "users", metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(50), unique=True, nullable=False),
    Column("password", String(128), nullable=False),
)

products = Table(
    "products", metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String(200), nullable=False),
    Column("price", Integer, nullable=False),
    Column("owner_id", Integer, ForeignKey("users.id"))
)
