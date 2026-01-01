from flask import Blueprint, request, jsonify
from app import db
from app.models.user_models import User, Role
from app.utils.helpers import hash_password, verify_password
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    required_fields = ["nom", "prenom", "email", "password", "cin", "phone_num"]
    for field in required_fields:
        if not data.get(field):
            return jsonify(msg=f"{field} est requis."), 400

    role_name = data.get("role", "CANDIDAT").upper()
    if role_name != "CANDIDAT":
        return jsonify(msg="Impossible de s'enregistrer avec ce rôle."), 400

    role = Role.query.filter_by(role_name=role_name).first()
    if not role:
        return jsonify(msg="Rôle invalide."), 400

    if len(data["password"]) < 8:
        return jsonify(msg="Mot de passe trop court (min 8 caractères)."), 400

    if User.query.filter(
        (User.email == data["email"]) |
        (User.cin == data["cin"]) |
        (User.phone_num == data["phone_num"])
    ).first():
        return jsonify(msg="Email, CIN ou téléphone déjà utilisé."), 400

    try:
        user = User(
            nom=data["nom"].strip(),
            prenom=data["prenom"].strip(),
            email=data["email"].lower(),
            password=hash_password(data["password"]),
            cin=data["cin"],
            phone_num=data["phone_num"],
            role_id=role.id
        )

        db.session.add(user)
        db.session.commit()

        return jsonify(msg="Utilisateur enregistré avec succès."), 201

    except Exception:
        db.session.rollback()
        return jsonify(msg="Erreur lors de l'enregistrement."), 500

    

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify(msg="Email et mot de passe requis."), 400

    user = User.query.filter_by(email=email).first()

    if not user or not verify_password(password, user.password):
        return jsonify(msg="Identifiants invalides."), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role.role_name,
            "nom": user.nom,
            "prenom": user.prenom
        }
    )

    return jsonify(
        access_token=access_token,
        role=user.role.role_name,
        msg="Connexion réussie."
    ), 200
