import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_mail import Mail


db = SQLAlchemy()
DB_NAME = 'appointment_manager.db'
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'HierIwillprotectmywebsite'

    # Blue Prints Register
    from website.views import views
    from website.auth import auth

    app.register_blueprint(views, prefix= '/')
    app.register_blueprint(auth, prefix= '/')

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
