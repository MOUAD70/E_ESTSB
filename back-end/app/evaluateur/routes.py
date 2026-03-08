import logging

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models.user_models import (
    Candidat, Documents, Evaluateur, Filiere, NoteEvaluateur, User,
)
from app.utils.decorators import role_required

logger = logging.getLogger(__name__)

evaluateur_bp = Blueprint("evaluateur", __name__, url_prefix="/api/evaluateur")


@evaluateur_bp.route("/candidates/<int:candidat_id>", methods=["GET"])
@role_required('EVALUATEUR')
def get_candidate_details(candidat_id):
    ev = Evaluateur.query.filter_by(user_id=int(get_jwt_identity())).first()
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    c = Candidat.query.get(candidat_id)
    if not c:
        return jsonify(msg="Candidat introuvable"), 404

    u = User.query.get(c.user_id)
    filiere = Filiere.query.get(c.filiere_id) if c.filiere_id else None
    note_row = NoteEvaluateur.query.filter_by(evaluateur_id=ev.id, candidat_id=c.id).first()
    docs = Documents.query.filter_by(candidat_id=c.id).first()

    return jsonify({
        "candidat_id": c.id,
        "status": c.status,

        "nom": u.nom if u else None,
        "prenom": u.prenom if u else None,
        "email": u.email if u else None,
        "cin": u.cin if u else None,
        "phone_num": u.phone_num if u else None,

        "cne": c.cne,
        "t_diplome": c.t_diplome,
        "branche_diplome": c.branche_diplome,
        "bac_type": c.bac_type,
        "moy_bac": c.moy_bac,
        "m_s1": c.m_s1,
        "m_s2": c.m_s2,
        "m_s3": c.m_s3,
        "m_s4": c.m_s4,

        "filiere_id": c.filiere_id,
        "filiere_nom": filiere.nom_filiere if filiere else None,

        "documents": {
            "bac": docs.bac if docs else None,
            "rn_bac": docs.rn_bac if docs else None,
            "diplome": docs.diplome if docs else None,
            "rn_diplome": docs.rn_diplome if docs else None,
            "cin_file": docs.cin_file if docs else None,
        },

        "my_note": note_row.note_eval if note_row else None,
        "my_note_id": note_row.id if note_row else None,
    }), 200


@evaluateur_bp.route("/candidates", methods=["GET"])
@role_required('EVALUATEUR')
def list_candidates():
    ev = Evaluateur.query.filter_by(user_id=int(get_jwt_identity())).first()
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    filiere_id = request.args.get("filiere_id", type=int)
    status = request.args.get("status", default="SUBMITTED", type=str)

    q = (
        db.session.query(Candidat, User, Filiere)
        .join(User, User.id == Candidat.user_id)
        .outerjoin(Filiere, Filiere.id == Candidat.filiere_id)
        .filter(Candidat.filiere_id.isnot(None))
    )

    if status:
        q = q.filter(Candidat.status == status)
    if filiere_id:
        q = q.filter(Candidat.filiere_id == filiere_id)

    rows = q.order_by(Candidat.id.desc()).all()

    my_notes = {
        n.candidat_id: n.note_eval
        for n in NoteEvaluateur.query.filter_by(evaluateur_id=ev.id).all()
    }

    return jsonify([
        {
            "candidat_id": c.id,
            "user_id": u.id,
            "nom": u.nom,
            "prenom": u.prenom,
            "email": u.email,
            "cin": u.cin,
            "phone_num": u.phone_num,
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
            "filiere": f.nom_filiere if f else None,
            "my_note": my_notes.get(c.id),
        }
        for (c, u, f) in rows
    ]), 200


@evaluateur_bp.route("/notes", methods=["POST"])
@role_required('EVALUATEUR')
def submit_note():
    ev = Evaluateur.query.filter_by(user_id=int(get_jwt_identity())).first()
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    data = request.get_json() or {}
    candidat_id = data.get("candidat_id")
    note_eval = data.get("note_eval")

    if candidat_id is None or note_eval is None:
        return jsonify(msg="candidat_id et note_eval sont requis"), 400

    try:
        note_eval = float(note_eval)
    except (ValueError, TypeError):
        return jsonify(msg="note_eval doit être un nombre"), 400

    candidat = Candidat.query.get(candidat_id)
    if not candidat:
        return jsonify(msg="Candidat introuvable"), 404

    if candidat.status != "SUBMITTED":
        return jsonify(msg="Ce candidat n'est pas prêt pour évaluation"), 400

    if NoteEvaluateur.query.filter_by(evaluateur_id=ev.id, candidat_id=candidat.id).first():
        return jsonify(msg="Vous avez déjà évalué ce candidat"), 400

    try:
        row = NoteEvaluateur(
            evaluateur_id=ev.id,
            candidat_id=candidat.id,
            note_eval=note_eval,
        )
        db.session.add(row)
        db.session.commit()
        return jsonify(msg="Note enregistrée", note_id=row.id), 201
    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 400


@evaluateur_bp.route("/notes/<int:candidat_id>", methods=["PUT"])
@role_required('EVALUATEUR')
def update_my_note(candidat_id):
    ev = Evaluateur.query.filter_by(user_id=int(get_jwt_identity())).first()
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    data = request.get_json() or {}
    note_eval = data.get("note_eval")
    if note_eval is None:
        return jsonify(msg="note_eval est requis"), 400

    try:
        note_eval = float(note_eval)
    except (ValueError, TypeError):
        return jsonify(msg="note_eval doit être un nombre"), 400

    row = NoteEvaluateur.query.filter_by(
        evaluateur_id=ev.id, candidat_id=candidat_id
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


@evaluateur_bp.route("/my-notes", methods=["GET"])
@role_required('EVALUATEUR')
def my_notes():
    ev = Evaluateur.query.filter_by(user_id=int(get_jwt_identity())).first()
    if not ev:
        return jsonify(msg="Profil évaluateur introuvable"), 404

    notes = (
        NoteEvaluateur.query
        .filter_by(evaluateur_id=ev.id)
        .order_by(NoteEvaluateur.id.desc())
        .all()
    )

    return jsonify([
        {"note_id": n.id, "candidat_id": n.candidat_id, "note_eval": n.note_eval}
        for n in notes
    ]), 200
