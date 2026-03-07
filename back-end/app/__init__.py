import logging
import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_class="config.Config"):
    app = Flask(__name__)
    app.config.from_object(config_class)

    _configure_logging(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["ALLOWED_ORIGINS"]}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    upload_folder = os.path.join(
        os.path.abspath(os.path.join(app.root_path, "..")), "uploads"
    )
    app.config["UPLOAD_FOLDER"] = upload_folder
    os.makedirs(upload_folder, exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app.auth.routes import auth_bp
    from app.candidate.routes import candidate_bp
    from app.admin.routes import admin_bp
    from app.evaluateur.routes import evaluateur_bp
    from app.routes.upload_routes import uploads_bp
    from app.routes.contact_routes import contact_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(candidate_bp, url_prefix="/api/candidate")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(evaluateur_bp, url_prefix="/api/evaluateur")
    app.register_blueprint(uploads_bp)
    app.register_blueprint(contact_bp)

    return app


def _configure_logging(app: Flask) -> None:
    level = getattr(logging, app.config.get("LOGGING_LEVEL", "INFO"), logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    app.logger.setLevel(level)
