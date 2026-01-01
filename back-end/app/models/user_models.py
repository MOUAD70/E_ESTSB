from app import db
from datetime import datetime
from sqlalchemy.orm import validates

class Role(db.Model):
    __tablename__ = "roles"
    id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50), unique=True, nullable=False)
    users = db.relationship("User", backref="role", lazy=True)

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(50), nullable=False)
    prenom = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    cin = db.Column(db.String(50), unique=True, nullable=False)
    phone_num = db.Column(db.String(20), unique=True, nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)

    evaluateur = db.relationship("Evaluateur", backref="user", uselist=False, cascade="all, delete-orphan")
    candidat = db.relationship("Candidat", backref="user", uselist=False, cascade="all, delete-orphan")

class Evaluateur(db.Model):
    __tablename__ = "evaluateurs"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    formule = db.Column(db.String(50))


class Candidat(db.Model):
    __tablename__ = "candidats"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    cne = db.Column(db.String(50), unique=True, nullable=False)
    t_diplome = db.Column(db.String(50))
    branche_diplome = db.Column(db.String(100))
    bac_type = db.Column(db.String(50))
    moy_bac = db.Column(db.Float)
    m_s1 = db.Column(db.Float)
    m_s2 = db.Column(db.Float)
    m_s3 = db.Column(db.Float)
    m_s4 = db.Column(db.Float)
    status = db.Column(db.String(20), default="PENDING")
    filiere_id = db.Column(db.Integer, db.ForeignKey("filieres.id"), nullable=True)
    
    documents = db.relationship(
        "Documents",
        backref="candidat",
        uselist=False,
        cascade="all, delete-orphan"
    )
    scores_ai = db.relationship("ScoreAI", backref="candidat", lazy=True)
    notes_eval = db.relationship("NoteEvaluateur", backref="candidat", lazy=True)

    @validates('moy_bac', 'm_s1', 'm_s2', 'm_s3', 'm_s4')
    def validate_grades(self, key, value):
        if value is not None:
            if not (0 <= value <= 20):
                raise ValueError(f"The field {key} must be between 0 and 20.")
        return value
    

class Documents(db.Model):
    __tablename__ = "documents"
    id = db.Column(db.Integer, primary_key=True)
    bac = db.Column(db.String(255))
    rn_bac = db.Column(db.String(255))
    diplome = db.Column(db.String(255))
    rn_diplome = db.Column(db.String(255))
    cin_file = db.Column(db.String(255))
    candidat_id = db.Column(db.Integer, db.ForeignKey("candidats.id"), nullable=False, unique=True)


class ScoreAI(db.Model):
    __tablename__ = "score_ai"
    id = db.Column(db.Integer, primary_key=True)
    candidat_id = db.Column(db.Integer, db.ForeignKey("candidats.id"), nullable=False, unique=True)
    note_ai = db.Column(db.Float)

class NoteEvaluateur(db.Model):
    __tablename__ = "note_evaluateur"
    id = db.Column(db.Integer, primary_key=True)
    note_eval = db.Column(db.Float, nullable=False)
    evaluateur_id = db.Column(db.Integer, db.ForeignKey("evaluateurs.id"), nullable=False)
    candidat_id = db.Column(db.Integer, db.ForeignKey("candidats.id"), nullable=False)

    __table_args__ = (
        db.UniqueConstraint("evaluateur_id", "candidat_id", name="unique_eval"),
    )

    @validates("note_eval")
    def validate_note(self, key, value):
        if not (0 <= value <= 20):
            raise ValueError("La note doit être entre 0 et 20.")
        return value


class FinalScore(db.Model):
    __tablename__ = "final_scores"
    id = db.Column(db.Integer, primary_key=True)
    candidat_id = db.Column(db.Integer, db.ForeignKey("candidats.id"), nullable=False, unique=True)
    note_ai = db.Column(db.Float)
    note_jury = db.Column(db.Float)
    note_final = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Filiere(db.Model):
    __tablename__ = "filieres"
    id = db.Column(db.Integer, primary_key=True)
    nom_filiere = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    candidatures = db.relationship("Candidat", backref="filiere_choisie", lazy=True)

class Eligibilite(db.Model):
    __tablename__ = "eligibilites"
    id = db.Column(db.Integer, primary_key=True)
    type_diplome_requis = db.Column(db.String(50), nullable=False)
    branche_source = db.Column(db.String(100), nullable=False)
    filiere_id = db.Column(db.Integer, db.ForeignKey("filieres.id"), nullable=False)

    __table_args__ = (
    db.UniqueConstraint(
        "type_diplome_requis",
        "branche_source",
        "filiere_id",
        name="unique_eligibilite"
    ),
)