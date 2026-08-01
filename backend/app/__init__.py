from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.update(
        MAX_CONTENT_LENGTH=50 * 1024 * 1024,
        UPLOAD_FOLDER='backend/uploads',
        OUTPUT_FOLDER='backend/output',
        SECRET_KEY='docuforge-dev-secret',
    )
    CORS(app, resources={r"/*": {"origins": "*"}})

    from backend.app.routes import api_bp, pdf_bp, conversion_bp, extraction_bp, editor_bp
    app.register_blueprint(api_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(conversion_bp)
    app.register_blueprint(extraction_bp)
    app.register_blueprint(editor_bp)

    return app
