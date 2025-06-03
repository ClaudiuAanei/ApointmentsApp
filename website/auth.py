from flask import Blueprint, render_template, request, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, current_user
from website import db
from .models import User

auth = Blueprint('auth', __name__)


@auth.route('/login', methods = ['GET','POST'])
def login():
    if request.method == "POST":
        email = request.form.get('email')
        password = request.form.get('password')

        user = db.session.execute(db.select(User).where(User.email == email)).scalar()
        if user:
            if check_password_hash(user.password, password= password):
                login_user(user)
                return redirect(url_for('views.home', logged_in=current_user.is_authenticated))
            else:
                print("Wrong Password!")
        else:
            print("No user with this name in our data base")

    return render_template('login.html')


@auth.route('/gmail-login')
def gmail_login():
    return 'For Later'


@auth.route('/register', methods= ['GET','POST'])
def register():
    if request.method == "POST":
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        result = db.session.execute(db.select(User).where(User.email == email))
        user = result.scalar()
        if user:
            return redirect(url_for('auth.login'))

        safe_password = generate_password_hash(password= password, method= "pbkdf2:sha256", salt_length= 8)

        new_user = User(
            email = email,
            username = username,
            password = safe_password,
            is_admin = False,
            confirmation_code = 'code',
            confirmation = False
        )

        db.session.add(new_user)
        db.session.commit()

        login_user(new_user)

        return redirect(url_for('views.home', logged_in = current_user.is_authenticated))
    return render_template('register.html', logged_in = current_user.is_authenticated)


@auth.route('/logout')
def logout():
    logout_user()
    return "Logout Page"