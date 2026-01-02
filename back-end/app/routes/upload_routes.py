import os
from flask import Blueprint, current_app, send_from_directory, abort

uploads_bp = Blueprint("uploads", __name__)

@uploads_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    base = current_app.config["UPLOAD_FOLDER"]

    full_path = os.path.join(base, filename)

    if not os.path.exists(full_path):
        abort(404)

    return send_from_directory(base, filename, mimetype="application/pdf")
