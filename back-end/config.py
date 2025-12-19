from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "ESTSB@2025")
    SQLALCHEMY_DATABASE_URI = os.getenv("DB_URL", "mysql+pymysql://root@localhost/ESTSB")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ESTSB@2025")
