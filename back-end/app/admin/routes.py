from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app import db
from app.models.user_models import (
    User, Role, Candidat, Documents,
    ScoreAI, Evaluateur, FinalScore, Filiere
)
from sqlalchemy import func
from app.utils.helpers import hash_password

admin_bp = Blueprint("admin", __name__)

def admin_required():
    claims = get_jwt()
    if claims.get("role") != "ADMIN":
        return False
    return True

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    users = User.query.all()
    return jsonify([
        {
            "id": u.id,
            "nom": u.nom,
            "prenom": u.prenom,
            "email": u.email,
            "cin": u.cin,
            "phone_num": u.phone_num,
            "role": u.role.role_name
        }
        for u in users
    ]), 200

@admin_bp.route("/stats/overview", methods=["GET"])
@jwt_required()
def stats_overview():
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    total_users = User.query.count()
    total_candidates = Candidat.query.count()
    submitted_apps = Candidat.query.filter(Candidat.filiere_id.isnot(None)).count()
    uploaded_docs = Documents.query.count()
    evaluated = FinalScore.query.count()

    return jsonify({
        "total_users": total_users,
        "total_candidates": total_candidates,
        "applications_submitted": submitted_apps,
        "documents_uploaded": uploaded_docs,
        "evaluated_candidates": evaluated
    }), 200


@admin_bp.route("/stats/filieres", methods=["GET"])
@jwt_required()
def stats_filieres():
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    results = (
        db.session.query(
            Filiere.nom_filiere,
            func.count(Candidat.id),
            func.avg(ScoreAI.note_ai),
            func.avg(FinalScore.note_final)
        )
        .outerjoin(Candidat, Candidat.filiere_id == Filiere.id)
        .outerjoin(ScoreAI, ScoreAI.candidat_id == Candidat.id)
        .outerjoin(FinalScore, FinalScore.score_ai_id == ScoreAI.id)
        .group_by(Filiere.nom_filiere)
        .all()
    )

    return jsonify([
        {
            "filiere": r[0],
            "candidatures": r[1],
            "avg_ai_score": round(r[2], 2) if r[2] else None,
            "avg_final_score": round(r[3], 2) if r[3] else None
        }
        for r in results
    ]), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify(msg="Utilisateur introuvable"), 404

    return jsonify({
        "id": user.id,
        "nom": user.nom,
        "prenom": user.prenom,
        "email": user.email,
        "cin": user.cin,
        "phone_num": user.phone_num,
        "role": user.role.role_name
    }), 200

@admin_bp.route("/users", methods=["POST"])
@jwt_required()
def create_user():
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    data = request.get_json()
    required = ["nom", "prenom", "email", "password", "cin", "role"]

    if not all(k in data for k in required):
        return jsonify(msg="Champs requis manquants"), 400
    
    if User.query.filter((User.email == data["email"]) | (User.cin == data["cin"])).first():
        return jsonify(msg="Email ou CIN déjà utilisé"), 400


    role = Role.query.filter_by(role_name=data["role"].upper()).first()
    if not role:
        return jsonify(msg="Rôle invalide"), 400

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
    db.session.flush()

    if role.role_name == "CANDIDAT":
        db.session.add(Candidat(user=user, cne=f"CNE-{user.id}"))

    if role.role_name == "EVALUATEUR":
        db.session.add(Evaluateur(user=user, formule="60_AI_40_JURY"))

    db.session.commit()
    return jsonify(msg="Utilisateur créé avec succès"), 201

@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    for field in ["nom", "prenom", "email", "cin", "phone_num"]:
        if field in data:
            setattr(user, field, data[field])
    if "email" in data:
        if User.query.filter(User.email == data["email"], User.id != user.id).first():
            return jsonify(msg="Email déjà utilisé"), 400

    if "cin" in data:
        if User.query.filter(User.cin == data["cin"], User.id != user.id).first():
            return jsonify(msg="CIN déjà utilisé"), 400

    if "role" in data:
        new_role = Role.query.filter_by(
            role_name=data["role"].upper()
        ).first()

        if not new_role:
            return jsonify(msg="Rôle invalide"), 400

        old_role = user.role.role_name

        if old_role == "CANDIDAT" and user.candidat:
            if user.candidat.scores_ai or user.candidat.notes_eval:
                return jsonify(
                    msg="Impossible de changer le rôle après évaluation"
                ), 400

        if new_role.id != user.role_id:
            if old_role == "CANDIDAT" and user.candidat:
                db.session.delete(user.candidat)

            if old_role == "EVALUATEUR" and user.evaluateur:
                db.session.delete(user.evaluateur)

            user.role_id = new_role.id

            if new_role.role_name == "CANDIDAT":
                db.session.add(
                    Candidat(user=user, cne=f"CNE-{user.id}")
                )

            elif new_role.role_name == "EVALUATEUR":
                db.session.add(
                    Evaluateur(user=user, formule="60_AI_40_JURY")
                )

    db.session.commit()
    return jsonify(msg="Utilisateur mis à jour avec succès"), 200



@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()

    return jsonify(msg="Utilisateur supprimé avec succès"), 200