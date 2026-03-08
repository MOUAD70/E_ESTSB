import logging
import re

import pandas as pd
from flask import Blueprint, jsonify, request
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.settings_models import GlobalSettings
from app.models.user_models import (
    Candidat, Documents, Evaluateur, FinalScore,
    Filiere, NoteEvaluateur, Role, ScoreAI, User,
)
from app.services.ml_service import get_pipeline
from app.utils.decorators import role_required
from app.utils.helpers import hash_password

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")



# ---------------------------------------------------------------------------
# AI scoring
# ---------------------------------------------------------------------------

@admin_bp.route("/ai/score", methods=["POST"])
@role_required('ADMIN')
def admin_ai_score():
    filiere_name_by_id = {f.id: f.nom_filiere for f in Filiere.query.all()}
    candidates = Candidat.query.filter(Candidat.filiere_id.isnot(None)).all()

    pipe = get_pipeline()
    scored = missing_fields = avg_lt_10 = 0

    existing_ai = {
        r.candidat_id: r
        for r in ScoreAI.query.filter(
            ScoreAI.candidat_id.in_([c.id for c in candidates])
        ).all()
    }

    for c in candidates:
        if not all([c.t_diplome, c.branche_diplome, c.bac_type, c.filiere_id]):
            missing_fields += 1
            continue
        if any(v is None for v in [c.m_s1, c.m_s2, c.m_s3, c.m_s4]):
            missing_fields += 1
            continue

        avg_sem = (c.m_s1 + c.m_s2 + c.m_s3 + c.m_s4) / 4

        if avg_sem < 10:
            note_ai = 0.0
            avg_lt_10 += 1
        else:
            filiere_name = filiere_name_by_id.get(c.filiere_id)
            if not filiere_name:
                missing_fields += 1
                continue

            X = pd.DataFrame([{
                "t_diplome": c.t_diplome,
                "branche_diplome": c.branche_diplome,
                "bac_type": c.bac_type,
                "filiere": filiere_name,
                "moy_bac": float(c.moy_bac) if c.moy_bac is not None else 0.0,
                "m_s1": float(c.m_s1),
                "m_s2": float(c.m_s2),
                "m_s3": float(c.m_s3),
                "m_s4": float(c.m_s4),
            }])
            note_ai = round(float(pipe.predict_proba(X)[0][1]) * 20, 2)

        row = existing_ai.get(c.id)
        if not row:
            row = ScoreAI(candidat_id=c.id, note_ai=note_ai)
            db.session.add(row)
            existing_ai[c.id] = row
        else:
            row.note_ai = note_ai

        scored += 1

    db.session.commit()
    logger.info("AI scoring: scored=%d, skipped=%d, forced_zero=%d", scored, missing_fields, avg_lt_10)
    return jsonify(
        msg="AI scoring terminé",
        scored=scored,
        skipped_missing_fields=missing_fields,
        forced_zero_avg_lt_10=avg_lt_10,
    ), 200


# ---------------------------------------------------------------------------
# Final score computation
# ---------------------------------------------------------------------------

@admin_bp.route("/final-scores/compute", methods=["POST"])
@role_required('ADMIN')
def compute_final_scores():
    # Read weights from GlobalSettings; fall back to 60/40 if not yet configured
    settings = GlobalSettings.query.first()
    if settings:
        W_JURY = settings.human_weight / 100.0
        W_AI = settings.ai_weight / 100.0
    else:
        W_JURY = 0.60
        W_AI = 0.40
        logger.warning("GlobalSettings not found — using default weights (60/40)")

    candidates = Candidat.query.filter(Candidat.filiere_id.isnot(None)).all()
    candidate_ids = [c.id for c in candidates]

    ai_map = {
        r.candidat_id: r
        for r in ScoreAI.query.filter(ScoreAI.candidat_id.in_(candidate_ids)).all()
    }
    fs_map = {
        r.candidat_id: r
        for r in FinalScore.query.filter(FinalScore.candidat_id.in_(candidate_ids)).all()
    }
    jury_avgs = dict(
        db.session.query(
            NoteEvaluateur.candidat_id,
            func.avg(NoteEvaluateur.note_eval),
        )
        .filter(NoteEvaluateur.candidat_id.in_(candidate_ids))
        .group_by(NoteEvaluateur.candidat_id)
        .all()
    )

    updated = skipped = ai_missing = 0

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
                note_final=final_note,
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


# ---------------------------------------------------------------------------
# Users CRUD
# ---------------------------------------------------------------------------

@admin_bp.route("/users", methods=["GET"])
@role_required('ADMIN')
def get_users():
    page        = request.args.get("page", 1, type=int)
    per_page    = request.args.get("per_page", 8, type=int)
    q           = request.args.get("q", "", type=str).strip().lower()
    role_filter = request.args.get("role", "", type=str).strip().upper()
    sort_by     = request.args.get("sort_by", "default", type=str)

    query = User.query

    if q:
        query = query.filter(
            or_(
                User.nom.ilike(f"%{q}%"),
                User.prenom.ilike(f"%{q}%"),
                User.email.ilike(f"%{q}%"),
                User.cin.ilike(f"%{q}%"),
                User.phone_num.ilike(f"%{q}%"),
            )
        )

    if role_filter and role_filter != "ALL":
        role_obj = Role.query.filter_by(role_name=role_filter).first()
        if role_obj:
            query = query.filter(User.role_id == role_obj.id)
        else:
            return jsonify(users=[], total=0, global_total=0, total_admins=0,
                           total_evals=0, page=page, per_page=per_page, pages=0), 200

    if sort_by == "newest":
        query = query.order_by(User.id.desc())
    else:
        query = query.order_by(User.id.asc())

    # Global counts — always unfiltered, used for stat cards
    global_total = User.query.count()
    total_admins = (
        db.session.query(func.count(User.id))
        .join(Role, Role.id == User.role_id)
        .filter(Role.role_name == "ADMIN")
        .scalar() or 0
    )
    total_evals = (
        db.session.query(func.count(User.id))
        .join(Role, Role.id == User.role_id)
        .filter(Role.role_name == "EVALUATEUR")
        .scalar() or 0
    )

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify(
        users=[_user_dict(u) for u in pagination.items],
        total=pagination.total,
        global_total=global_total,
        total_admins=total_admins,
        total_evals=total_evals,
        page=pagination.page,
        per_page=pagination.per_page,
        pages=pagination.pages,
    ), 200


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@role_required('ADMIN')
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(msg="Utilisateur introuvable"), 404
    return jsonify(_user_dict(user)), 200


@admin_bp.route("/users", methods=["POST"])
@role_required('ADMIN')
def create_user():
    data = request.get_json() or {}

    required = ["nom", "prenom", "email", "password", "cin", "phone_num", "role"]
    for k in required:
        if not data.get(k):
            return jsonify(msg=f"Champ requis manquant: {k}"), 400

    email = data["email"].strip().lower()
    cin = str(data["cin"]).strip()
    phone = str(data["phone_num"]).strip()
    role_name = str(data["role"]).strip().upper()

    if User.query.filter(
        (User.email == email) | (User.cin == cin) | (User.phone_num == phone)
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
@role_required('ADMIN')
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(msg="Utilisateur introuvable"), 404

    data = request.get_json() or {}

    if "email" in data and data["email"]:
        new_email = data["email"].strip().lower()
        if new_email != user.email:
            if User.query.filter(User.email == new_email, User.id != user.id).first():
                return jsonify(msg="Email déjà utilisé"), 400
            user.email = new_email

    if "cin" in data and data["cin"]:
        new_cin = str(data["cin"]).strip()
        if new_cin != user.cin:
            if User.query.filter(User.cin == new_cin, User.id != user.id).first():
                return jsonify(msg="CIN déjà utilisé"), 400
            user.cin = new_cin

    if "phone_num" in data and data["phone_num"]:
        new_phone = str(data["phone_num"]).strip()
        if new_phone != user.phone_num:
            if User.query.filter(User.phone_num == new_phone, User.id != user.id).first():
                return jsonify(msg="Téléphone déjà utilisé"), 400
            user.phone_num = new_phone

    for field in ["nom", "prenom"]:
        if field in data and data[field]:
            setattr(user, field, str(data[field]).strip())

    if "role" in data and data["role"]:
        new_role_name = str(data["role"]).strip().upper()
        new_role = Role.query.filter_by(role_name=new_role_name).first()
        if not new_role:
            return jsonify(msg="Rôle invalide"), 400

        old_role = (user.role.role_name if user.role else "").upper()

        if old_role == "CANDIDAT" and getattr(user, "candidat", None):
            cand = user.candidat
            has_scores = (
                ScoreAI.query.filter_by(candidat_id=cand.id).first() is not None
                or NoteEvaluateur.query.filter_by(candidat_id=cand.id).first() is not None
            )
            if has_scores:
                return jsonify(msg="Impossible de changer le rôle après évaluation"), 400

        if new_role.id != user.role_id:
            if old_role == "EVALUATEUR" and getattr(user, "evaluateur", None):
                db.session.delete(user.evaluateur)

            user.role_id = new_role.id

            if new_role.role_name == "EVALUATEUR" and not getattr(user, "evaluateur", None):
                db.session.add(Evaluateur(user_id=user.id, formule="DEFAULT"))

    db.session.commit()
    return jsonify(msg="Utilisateur mis à jour avec succès"), 200


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@role_required('ADMIN')
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


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@admin_bp.route("/stats/overview", methods=["GET"])
@role_required('ADMIN')
def stats_overview():
    return jsonify({
        "total_users": User.query.count(),
        "total_candidates": Candidat.query.count(),
        "applications_submitted": Candidat.query.filter(Candidat.filiere_id.isnot(None)).count(),
        "documents_uploaded": Documents.query.count(),
        "evaluated_candidates": FinalScore.query.count(),
    }), 200


@admin_bp.route("/stats/filieres", methods=["GET"])
@role_required('ADMIN')
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
            "avg_ai_score": round(r.avg_ai, 2) if r.avg_ai is not None else None,
            "avg_final_score": round(r.avg_final, 2) if r.avg_final is not None else None,
        }
        for r in results
    ]), 200


@admin_bp.route("/final-scores", methods=["GET"])
@role_required('ADMIN')
def get_final_scores():
    rows = (
        db.session.query(
            Candidat.id.label("candidat_id"),
            User.nom, User.prenom, User.email, User.cin,
            Candidat.cne,
            Filiere.nom_filiere.label("filiere"),
            ScoreAI.note_ai,
            func.avg(NoteEvaluateur.note_eval).label("note_jury"),
            FinalScore.note_final,
        )
        .join(User, User.id == Candidat.user_id)
        .outerjoin(Filiere, Filiere.id == Candidat.filiere_id)
        .outerjoin(ScoreAI, ScoreAI.candidat_id == Candidat.id)
        .outerjoin(NoteEvaluateur, NoteEvaluateur.candidat_id == Candidat.id)
        .outerjoin(FinalScore, FinalScore.candidat_id == Candidat.id)
        .group_by(
            Candidat.id, User.nom, User.prenom, User.email, User.cin,
            Candidat.cne, Filiere.nom_filiere, ScoreAI.note_ai, FinalScore.note_final,
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


# ---------------------------------------------------------------------------
# Formula settings
# ---------------------------------------------------------------------------

@admin_bp.route("/formule", methods=["GET"])
@role_required('ADMIN')
def get_global_formule():
    row = GlobalSettings.query.first()
    if not row:
        row = GlobalSettings(human_weight=70, ai_weight=30)
        db.session.add(row)
        db.session.commit()
    return jsonify(human=row.human_weight, ai=row.ai_weight), 200


@admin_bp.route("/formule", methods=["PUT"])
@role_required('ADMIN')
def update_global_formule():
    data = request.get_json() or {}
    try:
        human, ai = _parse_formule(data)

        if not (0 <= human <= 100) or not (0 <= ai <= 100):
            return jsonify(msg="Les poids doivent être entre 0 et 100"), 400
        if abs((human + ai) - 100.0) > 0.001:
            return jsonify(msg="La somme doit être 100"), 400

        row = GlobalSettings.query.first()
        if not row:
            row = GlobalSettings(human_weight=human, ai_weight=ai)
            db.session.add(row)
        else:
            row.human_weight = human
            row.ai_weight = ai

        db.session.commit()
        return jsonify(msg="Formule globale mise à jour", human=human, ai=ai), 200

    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 400


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "nom": u.nom,
        "prenom": u.prenom,
        "email": u.email,
        "cin": u.cin,
        "phone_num": u.phone_num,
        "role": u.role.role_name if u.role else None,
    }


def _parse_formule(payload: dict) -> tuple[float, float]:
    """
    Accept either:
      { "human": 70, "ai": 30 }
      { "formule": "70*human 30*AI" }
      { "formule": { "human": 70, "ai": 30 } }
    Returns (human_weight, ai_weight).
    """
    if not payload:
        raise ValueError("Body requis")

    formule = payload.get("formule", payload)

    if isinstance(formule, dict):
        human, ai = formule.get("human"), formule.get("ai")
        if human is None or ai is None:
            raise ValueError("Doit contenir human et ai")
        return float(human), float(ai)

    if isinstance(formule, str):
        pairs = re.findall(r"(\d+(?:\.\d+)?)\s*\*?\s*(human|ai)", formule.strip().lower())
        values = {key: float(num) for num, key in pairs}
        if "human" not in values or "ai" not in values:
            raise ValueError("Format invalide. Exemple: '70*human 30*AI'")
        return values["human"], values["ai"]

    raise ValueError("Type invalide pour formule")