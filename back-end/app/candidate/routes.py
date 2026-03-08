import logging
import os

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models.user_models import Candidat, Documents, Eligibilite, Filiere, FinalScore
from app.utils.decorators import role_required

logger = logging.getLogger(__name__)

candidate_bp = Blueprint("candidate", __name__, url_prefix="/api/candidate")


@candidate_bp.route("/apply", methods=["POST"])
@role_required('CANDIDAT')
def apply():
    user_id = get_jwt_identity()

    data = request.get_json() or {}

    if Candidat.query.filter_by(user_id=user_id).first():
        return jsonify(msg="Profil déjà enregistré. Modification non autorisée."), 400

    required = ["cne", "t_diplome", "branche_diplome", "bac_type", "moy_bac"]
    for field in required:
        if field not in data:
            return jsonify(msg=f"{field} est requis"), 400

    try:
        candidat = Candidat(
            user_id=user_id,
            cne=data["cne"],
            t_diplome=data["t_diplome"],
            branche_diplome=data["branche_diplome"],
            bac_type=data["bac_type"],
            moy_bac=float(data["moy_bac"]),
            m_s1=float(data.get("m_s1", 0)),
            m_s2=float(data.get("m_s2", 0)),
            m_s3=float(data.get("m_s3", 0)),
            m_s4=float(data.get("m_s4", 0)),
            status="PENDING",
        )
        db.session.add(candidat)
        db.session.commit()
        return jsonify(msg="Profil académique enregistré"), 201

    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 400


@candidate_bp.route("/eligible-programs", methods=["GET"])
@role_required('CANDIDAT')
def eligible_programs():
    user_id = get_jwt_identity()

    candidat = Candidat.query.filter_by(user_id=user_id).first()
    if not candidat:
        return jsonify(msg="Profil manquant"), 400

    programmes = (
        db.session.query(Filiere)
        .join(Eligibilite)
        .filter(
            Eligibilite.type_diplome_requis == candidat.t_diplome,
            Eligibilite.branche_source == candidat.branche_diplome,
        )
        .all()
    )

    return jsonify([{"id": f.id, "nom_filiere": f.nom_filiere} for f in programmes])


@candidate_bp.route("/select-filiere", methods=["POST"])
@role_required('CANDIDAT')
def select_filiere():
    user_id = get_jwt_identity()

    data = request.get_json() or {}
    candidat = Candidat.query.filter_by(user_id=user_id).first()
    if not candidat:
        return jsonify(msg="Profil introuvable"), 404

    if candidat.filiere_id:
        return jsonify(msg="Filière déjà choisie"), 400

    eligible = Eligibilite.query.filter_by(
        filiere_id=data.get("filiere_id"),
        type_diplome_requis=candidat.t_diplome,
        branche_source=candidat.branche_diplome,
    ).first()
    if not eligible:
        return jsonify(msg="Non éligible à cette filière"), 403

    candidat.filiere_id = data["filiere_id"]
    candidat.status = "SUBMITTED"
    db.session.commit()
    return jsonify(msg="Filière sélectionnée avec succès")


@candidate_bp.route("/upload-docs", methods=["POST"])
@role_required('CANDIDAT')
def upload_docs():
    user_id = get_jwt_identity()

    candidat = Candidat.query.filter_by(user_id=user_id).first()
    if not candidat:
        return jsonify(msg="Profil requis"), 400

    if candidat.documents:
        return jsonify(msg="Documents déjà soumis"), 400

    expected = ["bac", "rn_bac", "diplome", "rn_diplome", "cin_file"]
    missing = [f for f in expected if f not in request.files]
    if missing:
        return jsonify(msg="Documents manquants", missing=missing), 400

    try:
        doc = Documents(candidat_id=candidat.id)
        folder = os.path.join(current_app.config["UPLOAD_FOLDER"], f"cand_{candidat.id}")
        os.makedirs(folder, exist_ok=True)

        for field in expected:
            file = request.files[field]
            if not file.filename.lower().endswith(".pdf"):
                return jsonify(msg=f"{field} doit être un PDF"), 400
            path = os.path.join(folder, f"{field}.pdf")
            file.save(path)
            setattr(doc, field, f"cand_{candidat.id}/{field}.pdf")

        db.session.add(doc)
        db.session.commit()
        return jsonify(msg="Documents envoyés avec succès")

    except Exception:
        db.session.rollback()
        return jsonify(msg="Erreur lors du téléchargement"), 500


@candidate_bp.route("/result", methods=["GET"])
@role_required('CANDIDAT')
def view_result():
    user_id = get_jwt_identity()

    candidat = Candidat.query.filter_by(user_id=user_id).first()
    if not candidat:
        return jsonify(msg="Profil manquant"), 400

    result = FinalScore.query.filter_by(candidat_id=candidat.id).first()
    if not result:
        return jsonify(msg="Résultat non disponible"), 404

    return jsonify(
        note_ai=result.note_ai,
        note_jury=result.note_jury,
        note_final=result.note_final,
        created_at=result.created_at,
    ), 200


@candidate_bp.route("/profile", methods=["GET"])
@role_required('CANDIDAT')
def get_profile():
    user_id = get_jwt_identity()

    candidat = Candidat.query.filter_by(user_id=user_id).first()
    if not candidat:
        return jsonify(msg="Profil manquant"), 404

    return jsonify(
        id=candidat.id,
        status=candidat.status,
        filiere_id=candidat.filiere_id,
        documents_submitted=bool(candidat.documents),
    )
