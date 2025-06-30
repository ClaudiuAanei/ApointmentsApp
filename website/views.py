from flask import Blueprint, render_template
from flask_login import current_user, login_required

views = Blueprint('views', __name__)

@views.route('/home')
@views.route('/')
def home():
    return render_template('index.html', logged_in = current_user.is_authenticated)


@views.route('/make-appointment')
@login_required
def appointments_manager():
    return render_template('appointment.html', logged_in = current_user.is_authenticated)

