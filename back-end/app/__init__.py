from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app(config_class="config.Config"):
    app = Flask(__name__)

    CORS(
        app,
        resources={r"/api/*": {"origins": "http://localhost:5173"}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    app.config.from_object(config_class)

    project_root = os.path.abspath(os.path.join(app.root_path, ".."))  # back-end
    app.config["UPLOAD_FOLDER"] = os.path.join(project_root, "uploads")
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app.auth.routes import auth_bp
    from app.candidate.routes import candidate_bp
    from app.admin.routes import admin_bp
    from app.evaluateur.routes import evaluateur_bp
    from app.routes.upload_routes import uploads_bp
    

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(candidate_bp, url_prefix="/api/candidate")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(evaluateur_bp, url_prefix="/api/evaluateur")
    app.register_blueprint(uploads_bp)

    return app