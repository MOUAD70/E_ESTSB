from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import os

from app import db
from app.models.user_models import (
    Candidat, Filiere, Eligibilite,
    Documents, FinalScore
)

candidate_bp = Blueprint("candidate", __name__, url_prefix="/api/candidate")

def candidate_required():
    claims = get_jwt()
    return claims.get("role") == "CANDIDAT"

@candidate_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply():
    if not candidate_required():
        return jsonify(msg="Accès refusé"), 403
    
    claims = get_jwt()
    if claims.get("role") != "CANDIDAT":
        return jsonify(msg="Accès refusé"), 403

    user_id = get_jwt_identity()
    data = request.get_json() or {}

    candidat = Candidat.query.filter_by(user_id=user_id).first()

    if candidat:
        return jsonify(msg="Profil déjà enregistré. Modification non autorisée."), 400

    required = ["cne", "t_diplome", "branche_diplome", "bac_type", "moy_bac"]
    for f in required:
        if f not in data:
            return jsonify(msg=f"{f} est requis"), 400

    try:
        if not candidat:
            candidat = Candidat(
                user_id=user_id,
                cne=data["cne"]
            )
            db.session.add(candidat)

        candidat.t_diplome = data["t_diplome"]
        candidat.branche_diplome = data["branche_diplome"]
        candidat.bac_type = data["bac_type"]
        candidat.moy_bac = float(data["moy_bac"])
        candidat.m_s1 = float(data.get("m_s1", 0))
        candidat.m_s2 = float(data.get("m_s2", 0))
        candidat.m_s3 = float(data.get("m_s3", 0))
        candidat.m_s4 = float(data.get("m_s4", 0))
        candidat.status = "PENDING"

        db.session.commit()
        return jsonify(msg="Profil académique enregistré")

    except Exception as e:
        db.session.rollback()
        return jsonify(msg=str(e)), 400



@candidate_bp.route('/eligible-programs', methods=['GET'])
@jwt_required()
def eligible_programs():
    if not candidate_required():
        return jsonify(msg="Accès refusé"), 403
    user_id = get_jwt_identity()
    candidat = Candidat.query.filter_by(user_id=user_id).first()

    if not candidat:
        return jsonify(msg="Profil manquant"), 400

    programmes = db.session.query(Filiere).join(Eligibilite).filter(
        Eligibilite.type_diplome_requis == candidat.t_diplome,
        Eligibilite.branche_source == candidat.branche_diplome
    ).all()

    return jsonify([
        {"id": f.id, "nom_filiere": f.nom_filiere}
        for f in programmes
    ])


@candidate_bp.route('/select-filiere', methods=['POST'])
@jwt_required()
def select_filiere():
    if not candidate_required():
        return jsonify(msg="Accès refusé"), 403
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
        branche_source=candidat.branche_diplome
    ).first()

    if not eligible:
        return jsonify(msg="Non éligible à cette filière"), 403

    candidat.filiere_id = data["filiere_id"]
    candidat.status = "SUBMITTED"
    db.session.commit()

    return jsonify(msg="Filière sélectionnée avec succès")

@candidate_bp.route('/upload-docs', methods=['POST'])
@jwt_required()
def upload_docs():
    if not candidate_required():
        return jsonify(msg="Accès refusé"), 403
    user_id = get_jwt_identity()
    candidat = Candidat.query.filter_by(user_id=user_id).first()

    if not candidat:
        return jsonify(msg="Profil requis"), 400

    if candidat.documents:
        return jsonify(msg="Documents déjà soumis"), 400

    expected = ['bac', 'rn_bac', 'diplome', 'rn_diplome', 'cin_file']
    missing = [f for f in expected if f not in request.files]
    if missing:
        return jsonify(msg="Documents manquants", missing=missing), 400

    try:
        doc = Documents(candidat_id=candidat.id)
        base = current_app.config["UPLOAD_FOLDER"]
        folder = os.path.join(base, f"cand_{candidat.id}")
        os.makedirs(folder, exist_ok=True)

        for f in expected:
            file = request.files[f]
            if not file.filename.lower().endswith(".pdf"):
                return jsonify(msg=f"{f} doit être un PDF"), 400

            path = os.path.join(folder, f"{f}.pdf")
            file.save(path)
            setattr(doc, f, f"cand_{candidat.id}/{f}.pdf")

        db.session.add(doc)
        db.session.commit()
        return jsonify(msg="Documents envoyés avec succès")

    except Exception:
        db.session.rollback()
        return jsonify(msg="Erreur lors du téléchargement"), 500


@candidate_bp.route('/result', methods=['GET'])
@jwt_required()
def view_result():
    if not candidate_required():
        return jsonify(msg="Accès refusé"), 403
    claims = get_jwt()
    if claims.get("role") != "CANDIDAT":
        return jsonify(msg="Accès refusé"), 403

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
        created_at=result.created_at
    ), 200


# in candidate routes

@candidate_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    claims = get_jwt()
    if claims.get("role") != "CANDIDAT":
        return jsonify(msg="Accès refusé"), 403

    user_id = get_jwt_identity()
    candidat = Candidat.query.filter_by(user_id=user_id).first()
    if not candidat:
        return jsonify(msg="Profil manquant"), 404

    return jsonify(
        id=candidat.id,
        status=candidat.status,
        filiere_id=candidat.filiere_id,
        documents_submitted=bool(candidat.documents),  # ✅ IMPORTANT
    )
