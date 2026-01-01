from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func
import os, joblib
import pandas as pd

from app import db
from app.models.user_models import (
    User, Role, Evaluateur, Documents,
    Candidat, ScoreAI, NoteEvaluateur, FinalScore, Filiere
)
from app.utils.helpers import hash_password

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

def admin_required():
    claims = get_jwt()
    return claims.get("role") == "ADMIN"

_PIPELINE = None

def get_pipeline():
    global _PIPELINE
    if _PIPELINE is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # back-end/app
        model_path = os.path.normpath(os.path.join(base_dir, "..", "scripts", "encoders", "rf_pipeline.pkl"))
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        _PIPELINE = joblib.load(model_path)
    return _PIPELINE


def admin_required():
    claims = get_jwt()
    return claims.get("role") == "ADMIN"

@admin_bp.route("/ai/score", methods=["POST"])
@jwt_required()
def admin_ai_score():
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    data = request.get_json() or {}
    filiere_name_by_id = {f.id: f.nom_filiere for f in Filiere.query.all()}

    # Score only candidates who submitted a filiere (or use status SUBMITTED if you rely on it)
    candidates = Candidat.query.filter(Candidat.filiere_id.isnot(None)).all()

    pipe = get_pipeline()
    scored = 0

    for c in candidates:
        # Must have required fields to score
        if not all([c.t_diplome, c.branche_diplome, c.bac_type, c.filiere_id]):
            continue
        if c.m_s1 is None or c.m_s2 is None or c.m_s3 is None or c.m_s4 is None:
            continue

        avg_sem = (c.m_s1 + c.m_s2 + c.m_s3 + c.m_s4) / 4

        # Hard rule: avg < 10 => note_ai = 0
        if avg_sem < 10:
            note_ai = 0.0
        else:
            filiere_name = filiere_name_by_id.get(c.filiere_id)
            if not filiere_name:
                continue

            X_one = [{
                "t_diplome": c.t_diplome,
                "branche_diplome": c.branche_diplome,
                "bac_type": c.bac_type,
                "filiere": filiere_name,
                "m_s1": float(c.m_s1),
                "m_s2": float(c.m_s2),
                "m_s3": float(c.m_s3),
                "m_s4": float(c.m_s4),
            }]

            prob = float(pipe.predict_proba(pd.DataFrame(X_one))[0][1])
            note_ai = round(prob * 20, 2)

        row = ScoreAI.query.filter_by(candidat_id=c.id).first()
        if not row:
            row = ScoreAI(candidat_id=c.id, note_ai=note_ai)
            db.session.add(row)
        else:
            row.note_ai = note_ai

        scored += 1

    db.session.commit()
    return jsonify(msg="AI scoring terminé", scored=scored), 200

@admin_bp.route("/final-scores/compute", methods=["POST"])
@jwt_required()
def compute_final_scores():
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    # weights: 60% jury, 40% AI
    W_JURY = 0.60
    W_AI = 0.40

    candidates = Candidat.query.filter(Candidat.filiere_id.isnot(None)).all()
    updated = 0
    skipped = 0

    for c in candidates:
        # average jury note for this candidate
        jury_avg = db.session.query(func.avg(NoteEvaluateur.note_eval)).filter(
            NoteEvaluateur.candidat_id == c.id
        ).scalar()

        if jury_avg is None:
            skipped += 1
            continue

        jury_avg = float(jury_avg)

        ai_row = ScoreAI.query.filter_by(candidat_id=c.id).first()
        ai_note = float(ai_row.note_ai) if ai_row and ai_row.note_ai is not None else 0.0

        final_note = round((W_JURY * jury_avg) + (W_AI * ai_note), 2)

        fs = FinalScore.query.filter_by(candidat_id=c.id).first()
        if not fs:
            fs = FinalScore(
                candidat_id=c.id,
                note_ai=ai_note,
                note_jury=round(jury_avg, 2),
                note_final=final_note
            )
            db.session.add(fs)
        else:
            fs.note_ai = ai_note
            fs.note_jury = round(jury_avg, 2)
            fs.note_final = final_note

        updated += 1

    db.session.commit()
    return jsonify(
        msg="Final scores calculés",
        updated=updated,
        skipped_no_jury_notes=skipped,
        weights={"jury": W_JURY, "ai": W_AI}
    ), 200


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

    data = request.get_json() or {}

    required = ["nom", "prenom", "email", "password", "cin", "phone_num", "role"]
    for k in required:
        if not data.get(k):
            return jsonify(msg=f"Champ requis manquant: {k}"), 400

    if User.query.filter(
        (User.email == data["email"]) |
        (User.cin == data["cin"]) |
        (User.phone_num == data["phone_num"])
    ).first():
        return jsonify(msg="Email / CIN / Téléphone déjà utilisé"), 400

    role = Role.query.filter_by(role_name=data["role"].upper()).first()
    if not role:
        return jsonify(msg="Rôle invalide"), 400

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
    db.session.flush()

    if role.role_name == "EVALUATEUR":
        db.session.add(Evaluateur(user_id=user.id, formule="DEFAULT"))

    db.session.commit()
    return jsonify(msg="Utilisateur créé avec succès", user_id=user.id), 201


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
def update_user(user_id):
    if not admin_required():
        return jsonify(msg="Accès réservé à l'administrateur"), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    if "email" in data and data["email"] != user.email:
        if User.query.filter(User.email == data["email"], User.id != user.id).first():
            return jsonify(msg="Email déjà utilisé"), 400
        user.email = data["email"].lower()

    if "cin" in data and data["cin"] != user.cin:
        if User.query.filter(User.cin == data["cin"], User.id != user.id).first():
            return jsonify(msg="CIN déjà utilisé"), 400
        user.cin = data["cin"]

    if "phone_num" in data and data["phone_num"] != user.phone_num:
        if User.query.filter(User.phone_num == data["phone_num"], User.id != user.id).first():
            return jsonify(msg="Téléphone déjà utilisé"), 400
        user.phone_num = data["phone_num"]

    for field in ["nom", "prenom"]:
        if field in data and data[field]:
            setattr(user, field, data[field].strip())

    if "role" in data:
        new_role = Role.query.filter_by(role_name=data["role"].upper()).first()
        if not new_role:
            return jsonify(msg="Rôle invalide"), 400

        old_role = user.role.role_name

        if old_role == "CANDIDAT" and user.candidat:
            if user.candidat.scores_ai or user.candidat.notes_eval:
                return jsonify(msg="Impossible de changer le rôle après évaluation"), 400

        if new_role.id != user.role_id:
            if old_role == "EVALUATEUR" and user.evaluateur:
                db.session.delete(user.evaluateur)

            user.role_id = new_role.id

            if new_role.role_name == "EVALUATEUR" and not user.evaluateur:
                db.session.add(Evaluateur(user_id=user.id, formule="DEFAULT"))

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
            Filiere.nom_filiere.label("filiere"),
            func.count(Candidat.id).label("candidatures"),
            func.avg(ScoreAI.note_ai).label("avg_ai"),
            func.avg(FinalScore.note_final).label("avg_final")
        )
        .outerjoin(Candidat, Candidat.filiere_id == Filiere.id)
        .outerjoin(ScoreAI, ScoreAI.candidat_id == Candidat.id)
        .outerjoin(FinalScore, FinalScore.candidat_id == Candidat.id)
        .group_by(Filiere.nom_filiere)
        .all()
    )

    return jsonify([
        {
            "filiere": r.filiere,
            "candidatures": int(r.candidatures or 0),
            "avg_ai_score": round(r.avg_ai, 2) if r.avg_ai is not None else None,
            "avg_final_score": round(r.avg_final, 2) if r.avg_final is not None else None
        }
        for r in results
    ]), 200
