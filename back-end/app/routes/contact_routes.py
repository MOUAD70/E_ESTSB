import logging
import re

from flask import Blueprint, jsonify, request

from app import db
from app.models.settings_models import ContactMessage

logger = logging.getLogger(__name__)

contact_bp = Blueprint("contact", __name__)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@contact_bp.route("/api/contact", methods=["POST"])
def submit_contact():
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    message = (data.get("message") or "").strip()

    # ── Validation ─────────────────────────────────────────────────────────
    errors = {}
    if not name:
        errors["name"] = "Le nom est requis."
    if not email:
        errors["email"] = "L'email est requis."
    elif not EMAIL_RE.match(email):
        errors["email"] = "Adresse email invalide."
    if not message:
        errors["message"] = "Le message est requis."
    elif len(message) < 10:
        errors["message"] = "Le message doit contenir au moins 10 caractères."

    if errors:
        return jsonify(msg="Validation échouée.", errors=errors), 422

    # ── Persist ────────────────────────────────────────────────────────────
    try:
        contact = ContactMessage(name=name, email=email, message=message)
        db.session.add(contact)
        db.session.commit()
        logger.info("New contact message from %s (%s)", name, email)
        return jsonify(msg="Message envoyé avec succès. Nous vous répondrons bientôt."), 201
    except Exception:
        db.session.rollback()
        logger.exception("Failed to save contact message")
        return jsonify(msg="Une erreur est survenue. Veuillez réessayer."), 500
