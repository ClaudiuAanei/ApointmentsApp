import os
from datetime import datetime, timedelta, timezone
from dotenv import find_dotenv, load_dotenv
from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, logout_user, current_user
from flask_dance.contrib.google import make_google_blueprint, google
from website import db
from .forms import Registration, LoginForm, ResetPasswordForm, RequestResetPasswordForm
from website.models import User, ResetPassword, create_user
from .emails import Email, UniqueCode

uc = UniqueCode()

PATH = find_dotenv()
load_dotenv(PATH)

auth = Blueprint('auth', __name__)


google_bp = make_google_blueprint(
    client_id=os.getenv('CLIENT_ID'),
    client_secret=os.getenv('CLIENT_SECRET'),
    redirect_to="auth.gmail_login",
    scope=["https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"]
)

@auth.route('/login', methods = ['GET','POST'])
def login():
    form = LoginForm()
    fp_form = RequestResetPasswordForm() # forgot_password_form

    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data

        user = db.session.execute(db.select(User).where(User.email == email)).scalar()

        if user and check_password_hash(user.password_hash, password=password):
            login_user(user)
            return redirect(url_for('views.home', logged_in=current_user.is_authenticated))
        else:
            flash("Invalid email or password", 'danger')
            return redirect(url_for('views.login'))

    elif current_user.is_authenticated:
        return redirect(url_for('views.home', logged_in=current_user.is_authenticated))

    return render_template('login.html', form=form, fp_form=fp_form)


@auth.route('/login/gmail')
def gmail_login():
    if not google.authorized:
        return redirect(url_for("google.login") + "?prompt=consent+select_account")

    resp = google.get("/oauth2/v2/userinfo")
    assert resp.ok, resp.text
    user_info = resp.json()

    result = db.session.execute(db.select(User).where(User.email == user_info['email']))
    user = result.scalar()

    # if user does not exist in database will create the account
    if not user:
        email = Email()
        new_user = create_user(user_info['email'],
                               user_info['given_name'],
                               user_info['family_name'],
                               user_info['name'],
                               uc.generate(),
                               email.unique_code,
                               user_info['picture'],
                               confirmed= 'yes')
        email.send_confirmation_email(
            'website/templates/emails/confirmed.html',
            new_user.email,
            new_user.id,
        ("[COMPANY NAME]", "CompanyName"),
                ('[WEBSITENAME]', 'website.country'),
                ('[USERNAME]', new_user.username),
                ('[STREET]', 'StreetName'),
                ('[CITY]', 'CityName'),
                ('[COUNTRY]','CountryName')
        )

        login_user(new_user)
    elif user:
        login_user(user)

    return render_template('manager/auth_closer.html')


@auth.route('/register', methods= ['GET','POST'])
def register():
    form = Registration()

    if form.validate_on_submit():
        first_name = form.first_name.data
        last_name = form.last_name.data
        user_email = form.email.data
        password = form.password.data


        # Create user
        email = Email()
        username = first_name + " " + last_name
        new_user = create_user(user_email, first_name, last_name, username, password, email.unique_code)
        email.send_confirmation_email( 'website/templates/emails/confirmation.html',
                                  new_user.email ,
                                  new_user.id,
                                 ("[COMPANY NAME]", "CompanyName"),
                                       ('[WEBSITENAME]', 'website.country'),
                                       ('[USERNAME]', new_user.username),
                                       ('[STREET]', 'StreetName'),
                                       ('[CITY]', 'CityName'),
                                       ('[COUNTRY]', 'CountryName')
                                       )

        login_user(new_user)

        return redirect(url_for('views.home', logged_in=current_user.is_authenticated))

    elif current_user.is_authenticated:
        return redirect(url_for('views.home', logged_in=current_user.is_authenticated))


    return render_template('register.html',form=form ,logged_in=current_user.is_authenticated)


@auth.route('/confirm', methods= ['GET'])
def confirmation_account():
    token = request.args.get('code')
    user_id = request.args.get('id')
    user = db.session.execute(db.select(User).where(User.id == int(user_id))).scalar()

    valid_token = user.token_expiration.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc)

    if user.confirmed:
        flash('Your account is already confirmed.')

    elif (user and user.confirmation_token == token) and valid_token:
        user.confirmed = True
        flash('Your account was successfuly confirmed.')
        db.session.commit()
        login_user(user)

    else:
        flash('This link is not available anymore.')


    return redirect(url_for('views.home'))


@auth.route('/logout')
def logout():
    session.clear()
    logout_user()
    return redirect(url_for("views.home"))


@auth.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        fp_form = RequestResetPasswordForm()

        user_email = fp_form.email.data
        user = db.session.execute(db.select(User).where(User.email == user_email)).scalar()

        unique_selector = uc.generate()

        email = Email()

        hashed_token = generate_password_hash(
                        password=email.unique_code,
                        method="pbkdf2:sha256",
                        salt_length=8
                    )


        email.send_reset_password_email("website/templates/emails/reset_password.html",
                                        unique_selector,
                                        user.email if user else None,
                                        ('[USERNAME]', user.username if user else '[USERNAME]'),
                                        ('[EXPIRATION_MINUTES]', '15'),
                                        ('[CURRENT_YEAR]', str(datetime.now().year))
                                        )

        if fp_form.validate_on_submit():

            if user:
                reset_request = ResetPassword(
                    user_id=user.id,
                    selector=unique_selector,
                    token= hashed_token,
                    token_expire_at=datetime.now(timezone.utc) + timedelta(minutes=15)
                )

                db.session.add(reset_request)
                db.session.commit()

            try:
                fifteen_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=15)
                db.session.query(ResetPassword).filter(ResetPassword.token_expire_at < fifteen_minutes_ago).delete()
                db.session.commit()
            except Exception as e:
                db.session.rollback()

            return jsonify({
                "status": "success",
                "message": "If registered, a reset link has been sent to your email."
            }), 200

        else:
            if fp_form.errors:
                first_error = next(iter(fp_form.errors.values()))[0]
                return jsonify({"status": "error", "message": first_error}), 400

    return jsonify({"status": "error", "message": "Method not allowed."}), 405


@auth.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    form = ResetPasswordForm()

    selector = request.form.get('selector') or request.args.get('selector')
    token = request.form.get('token') or request.args.get('token')

    if not selector or not token:
        flash('The link to reset password is invalid or corupt.', 'error')
        return redirect(url_for('views.home'))


    reset_request = db.session.query(ResetPassword).filter(
        ResetPassword.selector == selector,
        ResetPassword.token_expire_at > datetime.now(timezone.utc)
    ).first()

    if not reset_request or not check_password_hash(reset_request.token, token):
        flash('The link to reset password is invalid or expired', 'error')
        return redirect(url_for('views.home'))


    if form.validate_on_submit():
        password = form.password.data

        user_to_update = db.session.get(User, reset_request.user_id)

        if user_to_update:
            new_password = generate_password_hash(password, method="pbkdf2:sha256", salt_length=8)
            user_to_update.password_hash = new_password
            db.session.delete(reset_request)
            db.session.commit()
            flash('The password was changed successfully.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('The user was not found.', 'error')
            return redirect(url_for('views.home'))


    return render_template('manager/change_password.html',form=form, selector=selector, token=token)


# Json
@auth.route('/check_first_name', methods=['POST'])
def check_first_name():
    username = request.form.get('first_name')

    if not username:
        return jsonify({'exists': False, 'error': 'First name is missing.'}), 200

    return jsonify({'exists': False}), 200


@auth.route('/check_last_name', methods=['POST'])
def check_last_name():
    username = request.form.get('last_name')

    if not username:
        return jsonify({'exists': False, 'error': 'Last name is missing.'}), 200

    return jsonify({'exists': False}), 200


@auth.route('/check_email', methods=['POST'])
def check_email():
    email = request.form.get('email')

    if not email:
        return jsonify({'exists': False, 'error': 'Email is missing.'}), 400 # <-- Modificat la 200 OK

    user = User.query.filter_by(email=email).first()

    if user:
        return jsonify({'exists': True}), 400

    return jsonify({'exists': False}), 200

