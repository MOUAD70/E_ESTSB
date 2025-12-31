from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.user_models import Candidat, Filiere, Eligibilite, Documents
import os
from werkzeug.utils import secure_filename
from flask import current_app

candidate_bp = Blueprint("candidate", __name__, url_prefix="/api/candidate")

@candidate_bp.route('/apply', methods=['POST'])
@jwt_required()
def apply():
    claims = get_jwt()
    if claims.get("role") != "CANDIDAT":
        return jsonify(msg="Accès refusé : Seuls les candidats peuvent soumettre ce formulaire"), 403

    user_id = get_jwt_identity()
    data = request.get_json()

    if not data:
        return jsonify(msg="Aucune donnée fournie"), 400

    candidate = Candidat.query.filter_by(user_id=user_id).first()
    if not candidate:
        candidate = Candidat(user_id=user_id, cne=data.get('CNE'))
        db.session.add(candidate)
    
    try:
        candidate.t_diplome = data.get('t_diplome')
        candidate.branche_diplome = data.get('branche_diplome')
        candidate.bac_type = data.get('bac_type')
        candidate.filiere_id = data.get('filiere_id')
        
        candidate.moy_bac = float(data.get('moy_bac', 0))
        candidate.m_s1 = float(data.get('m_s1', 0))
        candidate.m_s2 = float(data.get('m_s2', 0))
        candidate.m_s3 = float(data.get('m_s3', 0))
        candidate.m_s4 = float(data.get('m_s4', 0))
        
        db.session.commit()
    except ValueError as e:
        return jsonify(msg=str(e)), 400
    except Exception as e:
        db.session.rollback()
        return jsonify(msg="Une erreur est survenue lors de l'enregistrement des données"), 500

    return jsonify(msg="Données académiques soumises avec succès"), 200



@candidate_bp.route('/eligible-programs', methods=['GET'])
@jwt_required()
def get_eligible_programs():
    user_id = get_jwt_identity()
    candidate = Candidat.query.filter_by(user_id=user_id).first()

    if not candidate or not candidate.branche_diplome or not candidate.t_diplome:
        return jsonify(msg="Veuillez d'abord compléter vos informations académiques"), 400

    programmes = db.session.query(Filiere).join(Eligibilite).filter(
        Eligibilite.type_diplome_requis == candidate.t_diplome,
        Eligibilite.branche_source == candidate.branche_diplome
    ).all()

    return jsonify([{
        "id": p.id,
        "nom_filiere": p.nom_filiere
    } for p in programmes]), 200



@candidate_bp.route('/select-filiere', methods=['POST'])
@jwt_required()
def select_filiere():
    user_id = get_jwt_identity()
    data = request.get_json()
    filiere_id_choisie = data.get('filiere_id')

    candidate = Candidat.query.filter_by(user_id=user_id).first()
    
    is_eligible = db.session.query(Eligibilite).filter_by(
        filiere_id=filiere_id_choisie,
        type_diplome_requis=candidate.t_diplome,
        branche_source=candidate.branche_diplome
    ).first()

    if not candidate:
        return jsonify(msg="Candidat introuvable"), 404

    if not is_eligible:
        return jsonify(msg="Action refusée : Vous n'êtes pas éligible pour cette filière"), 403

    try:
        candidate.filiere_id = filiere_id_choisie
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify(msg="Erreur lors de l'enregistrement du choix"), 500

    return jsonify(msg="Filière choisie avec succès"), 200

@candidate_bp.route('/upload-docs', methods=['POST'])
@jwt_required()
def upload_docs():
    user_id = get_jwt_identity()
    candidate = Candidat.query.filter_by(user_id=user_id).first()

    if not candidate:
        return jsonify(msg="Veuillez d'abord remplir vos informations académiques"), 400

    expected_files = ['bac', 'rn_bac', 'diplome', 'rn_diplome', 'cin_file']

    missing_files = [key for key in expected_files if key not in request.files]
    if missing_files:
        return jsonify(
            msg="Tous les documents sont obligatoires",
            fichiers_manquants=missing_files
        ), 

    if not any(key in request.files for key in expected_files):
        return jsonify(msg="Aucun fichier envoyé"), 400

    doc_entry = Documents.query.filter_by(candidat_id=candidate.id).first()
    if not doc_entry:
        doc_entry = Documents(candidat_id=candidate.id)
        db.session.add(doc_entry)

    try:
        base_upload = current_app.config["UPLOAD_FOLDER"]
        candidate_folder = os.path.join(base_upload, f"cand_{candidate.id}")
        os.makedirs(candidate_folder, exist_ok=True)

        for key in expected_files:
            if key in request.files:
                file = request.files[key]

                if file and file.filename != '':
                    if not file.filename.lower().endswith('.pdf'):
                        return jsonify(msg=f"Le fichier {key} doit être un PDF"), 400

                    filename = secure_filename(f"{key}.pdf")
                    file_path = os.path.join(candidate_folder, filename)

                    file.save(file_path)

                    # 💾 Store relative path in DB
                    setattr(doc_entry, key, f"cand_{candidate.id}/{filename}")

        db.session.commit()
        return jsonify(msg="Documents téléchargés avec succès"), 200

    except Exception as e:
        db.session.rollback()
        return jsonify(msg="Erreur serveur lors de l'enregistrement des fichiers"), 500
