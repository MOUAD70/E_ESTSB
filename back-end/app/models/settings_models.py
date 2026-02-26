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
