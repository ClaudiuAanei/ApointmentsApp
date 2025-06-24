import os
from dotenv import find_dotenv, load_dotenv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_wtf import CSRFProtect

PATH = find_dotenv()
load_dotenv(PATH)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

db = SQLAlchemy()
DB_NAME = os.getenv('DB_NAME')

migrate = Migrate()
csrf = CSRFProtect()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    csrf.init_app(app)

    # Blue Prints Register

    from website.views import views
    from website.auth import auth, google_bp

    app.register_blueprint(views, prefix= '/')
    app.register_blueprint(auth, prefix= '/')
    app.register_blueprint(google_bp, url_prefix="/login")

    # Data Base

    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_NAME}'
    db.init_app(app)
    migrate.init_app(app, db) # Helpfully Tool To Modify DataBase

    from .models import User
    create_database(app)

    # Login Manager

    login_manager = LoginManager()
    login_manager.login_view = "auth.login"
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return db.get_or_404(User, user_id)


    return app


def create_database(app):
    if not os.path.exists(DB_NAME):
        with app.app_context():
            db.create_all()
