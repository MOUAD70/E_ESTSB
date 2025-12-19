from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app

# Authentication Helpers
def hash_password(password):
    return generate_password_hash(password)

def verify_password(password, hashed):
    return check_password_hash(hashed, password)
