from datetime import datetime

from app import db
from sqlalchemy.orm import validates

class GlobalSettings(db.Model):
    __tablename__ = "global_settings"

    id = db.Column(db.Integer, primary_key=True)
    human_weight = db.Column(db.Float, nullable=False, default=70.0)
    ai_weight = db.Column(db.Float, nullable=False, default=30.0)

    @validates("human_weight", "ai_weight")
    def validate_weights(self, key, value):
        value = float(value)
        if not (0 <= value <= 100):
            raise ValueError("Les poids doivent être entre 0 et 100.")
        return value


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
