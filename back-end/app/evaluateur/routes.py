from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func

from app import db
from app.models.user_models import (
    User, Evaluateur, Candidat, NoteEvaluateur, Filiere
)

evaluateur_bp = Blueprint("evaluateur", __name__, url_prefix="/api/evaluateur")


def evaluateur_required():
    claims = get_jwt()
    return claims.get("role") == "EVALUATEUR"


def get_evaluateur_or_404(user_id: int):
    ev = Evaluateur.query.filter_by(user_id=user_id).first()
    return ev


# ---------------------------------------------------------
# 1) List candidates to evaluate (SUBMITTED only)
# ---------------------------------------------------------
@evaluateur_bp.route("/candidates", methods=["GET"])
@jwt_required()
def list_candidates():
    if not evaluateur_required():
        return jsonify(msg="Accès réservé aux évaluateurs"), 403

    user_id = int(get_jwt_identity())
    ev = get_evaluateur_or_404(user_id)
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    # filters (optional, simple)
    filiere_id = request.args.get("filiere_id", type=int)
    status = request.args.get("status", default="SUBMITTED", type=str)

    q = Candidat.query

    if status:
        q = q.filter(Candidat.status == status)

    if filiere_id:
        q = q.filter(Candidat.filiere_id == filiere_id)

    # only candidates who selected filiere
    q = q.filter(Candidat.filiere_id.isnot(None))

    candidates = q.order_by(Candidat.id.desc()).all()

    # What did I already evaluate?
    my_notes = {
        n.candidat_id: n.note_eval
        for n in NoteEvaluateur.query.filter_by(evaluateur_id=ev.id).all()
    }

    filiere_map = {f.id: f.nom_filiere for f in Filiere.query.all()}

    return jsonify([
        {
            "candidat_id": c.id,
            "user_id": c.user_id,
            "cne": c.cne,
            "t_diplome": c.t_diplome,
            "branche_diplome": c.branche_diplome,
            "bac_type": c.bac_type,
            "m_s1": c.m_s1,
            "m_s2": c.m_s2,
            "m_s3": c.m_s3,
            "m_s4": c.m_s4,
            "status": c.status,
            "filiere_id": c.filiere_id,
            "filiere_nom": filiere_map.get(c.filiere_id),
            "my_note": my_notes.get(c.id)  # None if not evaluated yet
        }
        for c in candidates
    ]), 200


# ---------------------------------------------------------
# 2) Submit note for a candidate (one per evaluator)
# ---------------------------------------------------------
@evaluateur_bp.route("/notes", methods=["POST"])
@jwt_required()
def submit_note():
    if not evaluateur_required():
        return jsonify(msg="Accès réservé aux évaluateurs"), 403

    user_id = int(get_jwt_identity())
    ev = get_evaluateur_or_404(user_id)
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    data = request.get_json() or {}
    candidat_id = data.get("candidat_id")
    note_eval = data.get("note_eval")

    if candidat_id is None or note_eval is None:
        return jsonify(msg="candidat_id et note_eval sont requis"), 400

    try:
        note_eval = float(note_eval)
    except ValueError:
        return jsonify(msg="note_eval doit être un nombre"), 400

    # Candidate must exist and be submitted
    candidat = Candidat.query.get(candidat_id)
    if not candidat:
        return jsonify(msg="Candidat introuvable"), 404

    if candidat.status != "SUBMITTED":
        return jsonify(msg="Ce candidat n'est pas prêt pour évaluation"), 400

    # Unique constraint: one note per (evaluateur, candidat)
    existing = NoteEvaluateur.query.filter_by(
        evaluateur_id=ev.id,
        candidat_id=candidat.id
    ).first()

    if existing:
        return jsonify(msg="Vous avez déjà évalué ce candidat"), 400

    try:
        row = NoteEvaluateur(
            evaluateur_id=ev.id,
            candidat_id=candidat.id,
            note_eval=note_eval
        )
        db.session.add(row)
        db.session.commit()
        return jsonify(msg="Note enregistrée", note_id=row.id), 201

    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 400


# ---------------------------------------------------------
# 3) Update my note (optional, controlled)
# ---------------------------------------------------------
@evaluateur_bp.route("/notes/<int:candidat_id>", methods=["PUT"])
@jwt_required()
def update_my_note(candidat_id):
    if not evaluateur_required():
        return jsonify(msg="Accès réservé aux évaluateurs"), 403

    user_id = int(get_jwt_identity())
    ev = get_evaluateur_or_404(user_id)
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    data = request.get_json() or {}
    note_eval = data.get("note_eval")
    if note_eval is None:
        return jsonify(msg="note_eval est requis"), 400

    try:
        note_eval = float(note_eval)
    except ValueError:
        return jsonify(msg="note_eval doit être un nombre"), 400

    row = NoteEvaluateur.query.filter_by(
        evaluateur_id=ev.id,
        candidat_id=candidat_id
    ).first()

    if not row:
        return jsonify(msg="Aucune note trouvée pour ce candidat"), 404

    try:
        row.note_eval = note_eval
        db.session.commit()
        return jsonify(msg="Note mise à jour"), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 400


# ---------------------------------------------------------
# 4) My evaluation history
# ---------------------------------------------------------
@evaluateur_bp.route("/my-notes", methods=["GET"])
@jwt_required()
def my_notes():
    if not evaluateur_required():
        return jsonify(msg="Accès réservé aux évaluateurs"), 403

    user_id = int(get_jwt_identity())
    ev = get_evaluateur_or_404(user_id)
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    notes = NoteEvaluateur.query.filter_by(evaluateur_id=ev.id).order_by(NoteEvaluateur.id.desc()).all()

    return jsonify([
        {
            "note_id": n.id,
            "candidat_id": n.candidat_id,
            "note_eval": n.note_eval
        }
        for n in notes
    ]), 200
