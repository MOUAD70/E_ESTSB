from app import create_app, db
from app.models.user_models import Role, Filiere, Eligibilite

app = create_app()

def seed_data():
    with app.app_context():
        print("Début du peuplement de la base de données...")

        # 1. Création des Rôles
        roles_list = ["CANDIDAT", "EVALUATEUR", "ADMIN"]
        for r_name in roles_list:
            if not Role.query.filter_by(role_name=r_name).first():
                db.session.add(Role(role_name=r_name))
        
        db.session.flush()

        # 2. Création des Filières (Bachelors)
        filieres_data = [
            {"nom": "Bachelor ISITW", "desc": "Ingénierie des Systèmes Informatiques et Technologies Web"},
            {"nom": "Bachelor CSTC", "desc": "Cyber Sécurité et Technologie Cloud"},
            {"nom": "Bachelor BDAPA", "desc": "Biotechnologies Digitalisation et Amélioration des Productions Agricoles"},
            {"nom": "Bachelor CCA", "desc": "Comptabilité Contrôle et Audit"},
            {"nom": "Bachelor GCF", "desc": "Gestion Comptable et Financière"}
        ]

        filiere_objs = {}
        for f in filieres_data:
            obj = Filiere.query.filter_by(nom_filiere=f["nom"]).first()
            if not obj:
                obj = Filiere(nom_filiere=f["nom"], description=f["desc"])
                db.session.add(obj)
            filiere_objs[f["nom"]] = obj
        
        db.session.flush() # Pour garantir que tous les objets ont un ID

        # 3. Définition des règles d'éligibilité (Mapping Dynamique)
        # On définit ici quels types de diplômes et quelles branches ont accès à quel Bachelor
        eligibility_mapping = [
            {
                "targets": ["Bachelor ISITW", "Bachelor CSTC"],
                "diplomes": ["DTS", "DUT", "BTS", "DEUST", "DEUG"],
                "branches": ["INFRASTRUCTURE DIGITAL", "DEVELOPPEMENT DIGITAL", "GENIE INFORMATIQUE", "SMI", "RÉSEAUX ET TÉLÉCOMS"]
            },
            {
                "targets": ["Bachelor CCA", "Bachelor GCF"],
                "diplomes": ["DTS", "DUT", "BTS", "DEUG"],
                "branches": ["GESTION DES ENTREPRISES", "TECHNIQUES DE MANAGEMENT", "ECONOMIE", "COMPTABILITÉ"]
            },
            {
                "targets": ["Bachelor BDAPA"],
                "diplomes": ["DTS", "DUT", "BTS", "DEUST"],
                "branches": ["AGRONOMIE", "AGRO-ALIMENTAIRE", "SCIENCES DE LA VIE", "ENVIRONNEMENT"]
            }
        ]

        for rule in eligibility_mapping:
            for target_name in rule["targets"]:
                f_id = filiere_objs[target_name].id
                for d_type in rule["diplomes"]:
                    for b_name in rule["branches"]:
                        # Vérification anti-doublon avant insertion
                        exists = Eligibilite.query.filter_by(
                            type_diplome_requis=d_type,
                            branche_source=b_name,
                            filiere_id=f_id
                        ).first()
                        
                        if not exists:
                            db.session.add(Eligibilite(
                                type_diplome_requis=d_type,
                                branche_source=b_name,
                                filiere_id=f_id
                            ))

        try:
            db.session.commit()
            print("Base de données peuplée avec succès !")
        except Exception as e:
            db.session.rollback()
            print(f"Erreur lors du commit : {e}")

if __name__ == "__main__":
    seed_data()