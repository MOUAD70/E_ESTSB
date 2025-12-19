from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.user_models import Candidat, Filiere, Eligibilite

candidate_bp = Blueprint('candidate', __name__)

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

    if not is_eligible:
        return jsonify(msg="Action refusée : Vous n'êtes pas éligible pour cette filière"), 403

    try:
        candidate.filiere_id = filiere_id_choisie
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify(msg="Erreur lors de l'enregistrement du choix"), 500

    return jsonify(msg="Filière choisie avec succès"), 200