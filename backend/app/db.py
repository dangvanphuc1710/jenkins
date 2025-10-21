import os
from sqlalchemy import create_engine, text

DB_HOST = os.getenv("DB_HOST", "localhost")   # trong docker-compose dùng 'db'
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USERNAME = os.getenv("DB_USERNAME", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "matkhau")
DB_DATABASE = os.getenv("DB_DATABASE", "app_db")

DATABASE_URL = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_DATABASE}"
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def init_db():
    with engine.begin() as conn:
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(200) NOT NULL
        );
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          title VARCHAR(200) NOT NULL,
          price INTEGER NOT NULL DEFAULT 0,
          owner_id INTEGER REFERENCES users(id)
        );
        """))
