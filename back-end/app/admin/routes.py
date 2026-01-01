# app/routes/admin_routes.py
from __future__ import annotations

from functools import wraps
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, verify_jwt_in_request, get_jwt
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
import os
import joblib
import pandas as pd

from app import db
from app.models.user_models import (
    User, Role, Evaluateur, Documents,
    Candidat, ScoreAI, NoteEvaluateur, FinalScore, Filiere
)
from app.utils.helpers import hash_password

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# -----------------------------------------------------------------------------
# Auth helpers
# -----------------------------------------------------------------------------
def admin_only(fn):
    """Decorator: require valid JWT + role==ADMIN claim."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        role = (get_jwt().get("role") or "").upper()
        if role != "ADMIN":
            return jsonify(msg="Accès réservé à l'administrateur"), 403
        return fn(*args, **kwargs)
    return wrapper


# -----------------------------------------------------------------------------
# ML pipeline loader (cached)
# -----------------------------------------------------------------------------
_PIPELINE = None

def _default_model_path() -> str:
    """
    Tries:
    1) current_app.config["MODEL_PATH"]
    2) env MODEL_PATH
    3) fallback relative path: ../scripts/encoders/rf_pipeline.pkl
    """
    # 1) config
    cfg_path = current_app.config.get("MODEL_PATH") if current_app else None
    if cfg_path:
        return cfg_path

    # 2) env
    env_path = os.getenv("MODEL_PATH")
    if env_path:
        return env_path

    # 3) fallback relative to this file
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # back-end/app
    return os.path.normpath(os.path.join(base_dir, "..", "scripts", "encoders", "rf_pipeline.pkl"))

def get_pipeline():
    global _PIPELINE
    if _PIPELINE is None:
        model_path = _default_model_path()
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        _PIPELINE = joblib.load(model_path)
    return _PIPELINE


# -----------------------------------------------------------------------------
# Admin - AI scoring
# -----------------------------------------------------------------------------
@admin_bp.route("/ai/score", methods=["POST"])
@jwt_required()
@admin_only
def admin_ai_score():
    filiere_name_by_id = {f.id: f.nom_filiere for f in Filiere.query.all()}
    candidates = Candidat.query.filter(Candidat.filiere_id.isnot(None)).all()

    pipe = get_pipeline()
    scored = 0
    missing_fields = 0
    avg_lt_10 = 0

    # avoid N+1: load existing AI rows once
    existing_ai = {
        r.candidat_id: r
        for r in ScoreAI.query.filter(ScoreAI.candidat_id.in_([c.id for c in candidates])).all()
    }

    for c in candidates:
        # required fields
        if not all([c.t_diplome, c.branche_diplome, c.bac_type, c.filiere_id]):
            missing_fields += 1
            continue
        if any(v is None for v in [c.m_s1, c.m_s2, c.m_s3, c.m_s4]):
            missing_fields += 1
            continue

        avg_sem = (c.m_s1 + c.m_s2 + c.m_s3 + c.m_s4) / 4

        # Hard rule: avg < 10 => note_ai = 0
        if avg_sem < 10:
            note_ai = 0.0
            avg_lt_10 += 1
        else:
            filiere_name = filiere_name_by_id.get(c.filiere_id)
            if not filiere_name:
                missing_fields += 1
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

        row = existing_ai.get(c.id)
        if not row:
            row = ScoreAI(candidat_id=c.id, note_ai=note_ai)
            db.session.add(row)
            existing_ai[c.id] = row
        else:
            row.note_ai = note_ai

        scored += 1

    db.session.commit()
    return jsonify(
        msg="AI scoring terminé",
        scored=scored,
        skipped_missing_fields=missing_fields,
        forced_zero_avg_lt_10=avg_lt_10,
    ), 200


# -----------------------------------------------------------------------------
# Admin - compute final scores
# -----------------------------------------------------------------------------
@admin_bp.route("/final-scores/compute", methods=["POST"])
@jwt_required()
@admin_only
def compute_final_scores():
    W_JURY = 0.60
    W_AI = 0.40

    candidates = Candidat.query.filter(Candidat.filiere_id.isnot(None)).all()
    candidate_ids = [c.id for c in candidates]

    # prefetch AI + final score rows to avoid N+1
    ai_map = {
        r.candidat_id: r
        for r in ScoreAI.query.filter(ScoreAI.candidat_id.in_(candidate_ids)).all()
    }
    fs_map = {
        r.candidat_id: r
        for r in FinalScore.query.filter(FinalScore.candidat_id.in_(candidate_ids)).all()
    }

    # precompute jury avg per candidate in one query
    jury_avgs = dict(
        db.session.query(
            NoteEvaluateur.candidat_id,
            func.avg(NoteEvaluateur.note_eval)
        )
        .filter(NoteEvaluateur.candidat_id.in_(candidate_ids))
        .group_by(NoteEvaluateur.candidat_id)
        .all()
    )

    updated = 0
    skipped = 0
    ai_missing = 0

    for c in candidates:
        jury_avg = jury_avgs.get(c.id)
        if jury_avg is None:
            skipped += 1
            continue

        jury_avg = float(jury_avg)

        ai_row = ai_map.get(c.id)
        if not ai_row or ai_row.note_ai is None:
            ai_missing += 1
            ai_note = 0.0
        else:
            ai_note = float(ai_row.note_ai)

        final_note = round((W_JURY * jury_avg) + (W_AI * ai_note), 2)

        fs = fs_map.get(c.id)
        if not fs:
            fs = FinalScore(
                candidat_id=c.id,
                note_ai=ai_note,
                note_jury=round(jury_avg, 2),
                note_final=final_note
            )
            db.session.add(fs)
            fs_map[c.id] = fs
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
        ai_missing=ai_missing,
        weights={"jury": W_JURY, "ai": W_AI},
    ), 200


# -----------------------------------------------------------------------------
# Admin - USERS CRUD
# -----------------------------------------------------------------------------
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@admin_only
def get_users():
    users = User.query.all()
    return jsonify([
        {
            "id": u.id,
            "nom": u.nom,
            "prenom": u.prenom,
            "email": u.email,
            "cin": u.cin,
            "phone_num": u.phone_num,
            "role": (u.role.role_name if u.role else None),
        }
        for u in users
    ]), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
@admin_only
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(msg="Utilisateur introuvable"), 404

    return jsonify({
        "id": user.id,
        "nom": user.nom,
        "prenom": user.prenom,
        "email": user.email,
        "cin": user.cin,
        "phone_num": user.phone_num,
        "role": (user.role.role_name if user.role else None),
    }), 200


@admin_bp.route("/users", methods=["POST"])
@jwt_required()
@admin_only
def create_user():
    data = request.get_json() or {}

    required = ["nom", "prenom", "email", "password", "cin", "phone_num", "role"]
    for k in required:
        if not data.get(k):
            return jsonify(msg=f"Champ requis manquant: {k}"), 400

    # normalize
    email = data["email"].strip().lower()
    cin = str(data["cin"]).strip()
    phone = str(data["phone_num"]).strip()
    role_name = str(data["role"]).strip().upper()

    if User.query.filter(
        (User.email == email) |
        (User.cin == cin) |
        (User.phone_num == phone)
    ).first():
        return jsonify(msg="Email / CIN / Téléphone déjà utilisé"), 400

    role = Role.query.filter_by(role_name=role_name).first()
    if not role:
        return jsonify(msg="Rôle invalide"), 400

    user = User(
        nom=data["nom"].strip(),
        prenom=data["prenom"].strip(),
        email=email,
        password=hash_password(data["password"]),
        cin=cin,
        phone_num=phone,
        role_id=role.id,
    )

    db.session.add(user)
    db.session.flush()

    if role.role_name == "EVALUATEUR":
        db.session.add(Evaluateur(user_id=user.id, formule="DEFAULT"))

    db.session.commit()
    return jsonify(msg="Utilisateur créé avec succès", user_id=user.id), 201


@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@jwt_required()
@admin_only
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(msg="Utilisateur introuvable"), 404

    data = request.get_json() or {}

    # email
    if "email" in data and data["email"]:
        new_email = data["email"].strip().lower()
        if new_email != user.email:
            if User.query.filter(User.email == new_email, User.id != user.id).first():
                return jsonify(msg="Email déjà utilisé"), 400
            user.email = new_email

    # cin
    if "cin" in data and data["cin"]:
        new_cin = str(data["cin"]).strip()
        if new_cin != user.cin:
            if User.query.filter(User.cin == new_cin, User.id != user.id).first():
                return jsonify(msg="CIN déjà utilisé"), 400
            user.cin = new_cin

    # phone
    if "phone_num" in data and data["phone_num"]:
        new_phone = str(data["phone_num"]).strip()
        if new_phone != user.phone_num:
            if User.query.filter(User.phone_num == new_phone, User.id != user.id).first():
                return jsonify(msg="Téléphone déjà utilisé"), 400
            user.phone_num = new_phone

    # nom / prenom
    for field in ["nom", "prenom"]:
        if field in data and data[field]:
            setattr(user, field, str(data[field]).strip())

    # role change
    if "role" in data and data["role"]:
        new_role_name = str(data["role"]).strip().upper()
        new_role = Role.query.filter_by(role_name=new_role_name).first()
        if not new_role:
            return jsonify(msg="Rôle invalide"), 400

        old_role = (user.role.role_name if user.role else "").upper()

        # business rule: prevent candidate role change after evaluation
        if old_role == "CANDIDAT" and getattr(user, "candidat", None):
            cand = user.candidat
            # if candidate has AI scores or evaluator notes, block role change
            has_ai = ScoreAI.query.filter_by(candidat_id=cand.id).first() is not None
            has_eval = NoteEvaluateur.query.filter_by(candidat_id=cand.id).first() is not None
            if has_ai or has_eval:
                return jsonify(msg="Impossible de changer le rôle après évaluation"), 400

        if new_role.id != user.role_id:
            # if leaving evaluateur role -> delete evaluateur profile
            if old_role == "EVALUATEUR" and getattr(user, "evaluateur", None):
                db.session.delete(user.evaluateur)

            user.role_id = new_role.id

            # if becoming evaluateur -> ensure profile
            if new_role.role_name == "EVALUATEUR" and not getattr(user, "evaluateur", None):
                db.session.add(Evaluateur(user_id=user.id, formule="DEFAULT"))

    db.session.commit()
    return jsonify(msg="Utilisateur mis à jour avec succès"), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_only
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(msg="Utilisateur introuvable"), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify(msg="Utilisateur supprimé avec succès"), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify(msg="Impossible de supprimer: données liées existent"), 400


# -----------------------------------------------------------------------------
# Admin - Stats
# -----------------------------------------------------------------------------
@admin_bp.route("/stats/overview", methods=["GET"])
@jwt_required()
@admin_only
def stats_overview():
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
        "evaluated_candidates": evaluated,
    }), 200


@admin_bp.route("/stats/filieres", methods=["GET"])
@jwt_required()
@admin_only
def stats_filieres():
    results = (
        db.session.query(
            Filiere.nom_filiere.label("filiere"),
            func.count(Candidat.id).label("candidatures"),
            func.avg(ScoreAI.note_ai).label("avg_ai"),
            func.avg(FinalScore.note_final).label("avg_final"),
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
            # keep your original keys (frontend may rely on them)
            "avg_ai_score": round(r.avg_ai, 2) if r.avg_ai is not None else None,
            "avg_final_score": round(r.avg_final, 2) if r.avg_final is not None else None,
        }
        for r in results
    ]), 200


# -----------------------------------------------------------------------------
# Admin - Final scores list
# -----------------------------------------------------------------------------
@admin_bp.route("/final-scores", methods=["GET"])
@jwt_required()
@admin_only
def get_final_scores():
    rows = (
        db.session.query(
            Candidat.id.label("candidat_id"),
            User.nom.label("nom"),
            User.prenom.label("prenom"),
            User.email.label("email"),
            User.cin.label("cin"),
            Candidat.cne.label("cne"),
            Filiere.nom_filiere.label("filiere"),
            ScoreAI.note_ai.label("note_ai"),
            func.avg(NoteEvaluateur.note_eval).label("note_jury"),
            FinalScore.note_final.label("note_final"),
        )
        .join(User, User.id == Candidat.user_id)
        .outerjoin(Filiere, Filiere.id == Candidat.filiere_id)
        .outerjoin(ScoreAI, ScoreAI.candidat_id == Candidat.id)
        .outerjoin(NoteEvaluateur, NoteEvaluateur.candidat_id == Candidat.id)
        .outerjoin(FinalScore, FinalScore.candidat_id == Candidat.id)
        .group_by(
            Candidat.id,
            User.nom, User.prenom, User.email, User.cin,
            Candidat.cne,
            Filiere.nom_filiere,
            ScoreAI.note_ai,
            FinalScore.note_final,
        )
        .all()
    )

    return jsonify([
        {
            "candidat_id": r.candidat_id,
            "nom": r.nom,
            "prenom": r.prenom,
            "email": r.email,
            "cin": r.cin,
            "cne": r.cne,
            "filiere": r.filiere,
            "note_ai": float(r.note_ai) if r.note_ai is not None else None,
            "note_jury": round(float(r.note_jury), 2) if r.note_jury is not None else None,
            "note_final": float(r.note_final) if r.note_final is not None else None,
        }
        for r in rows
    ]), 200
