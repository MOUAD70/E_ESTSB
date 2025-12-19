from flask import Blueprint, request, jsonify
from app import db
from app.models.user_models import User, Role
from app.utils.helpers import hash_password, verify_password
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    role_name = data.get("role", "CANDIDAT").upper()
    role = Role.query.filter_by(role_name=role_name).first()
    
    if not role:
        return jsonify(msg="Rôle invalide."), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify(msg="Cet email est déjà utilisé."), 400

    if User.query.filter_by(cin=data["cin"]).first():
        return jsonify(msg="Ce CIN est déjà utilisé par un autre compte."), 400
    
    if User.query.filter_by(phone_num=data["phone_num"]).first():
        return jsonify(msg="Ce numéro de téléphone est déjà utilisé."), 400

    try:
        user = User(
            nom=data["nom"],
            prenom=data["prenom"],
            email=data["email"],
            password=hash_password(data["password"]),
            cin=data["cin"],
            phone_num=data.get("phone_num"),
            role_id=role.id
        )
        db.session.add(user)
        db.session.commit()
        return jsonify(msg="Utilisateur enregistré avec succès."), 201
    except Exception as e:
        db.session.rollback()
        return jsonify(msg="Une erreur est survenue lors de l'enregistrement."), 500
    

@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify(msg="Email et mot de passe requis."), 400

        user = User.query.filter_by(email=email).first()

        if not user or not verify_password(password, user.password):
            return jsonify(msg="Identifiants invalides."), 401

        claims = {
            "role": user.role.role_name,
            "nom": user.nom,
            "prenom": user.prenom
        }

        access_token = create_access_token(identity=str(user.id), additional_claims=claims)

        return jsonify(
            access_token=access_token,
            role=user.role.role_name,
            msg="Connexion réussie."
        ), 200

    except Exception as e:
        return jsonify(msg="Une erreur interne est survenue."), 500
