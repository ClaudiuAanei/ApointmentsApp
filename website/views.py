import json
import re
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from flask import Blueprint, render_template, request, jsonify
from flask_login import current_user, login_required
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from website import db
from website.models import Appointments, Employee, FullDay, User

views = Blueprint('views', __name__)

@views.route('/home')
@views.route('/')
def home():
    return render_template('index.html', logged_in = current_user.is_authenticated)


@views.route('/make-appointment')
@login_required
def appointments_manager():

    employees = db.session.execute(db.select(Employee)).scalars().all()
    print(current_user.email)

    return render_template(
        'appointment.html',
        employees=employees,
        logged_in=current_user.is_authenticated
    )


def check_available_hours(date_str, employee_id):
    """Check if slots are available and are returned into a list"""
    today_booked = db.session.execute(
        db.select(Appointments).where(
            Appointments.employee_id == employee_id,
            func.date(Appointments.date) == date_str)
    ).scalars().all()

    selected_date = datetime.strptime(date_str, '%Y-%m-%d')

    try:
        with open('website/openhours.json', mode='r') as file:
            if date_str == datetime.now().strftime('%Y-%m-%d'):
                time_now = (datetime.now().hour + 2) * 60
                available_hours = [timeslot for timeslot, values in json.load(file).items() if values[0] > time_now]
            else:
                available_hours = [timeslot for timeslot in json.load(file)]

        for appointment in today_booked:
           if appointment.timeslot in available_hours:
               available_hours.remove(appointment.timeslot)

        fullday_registered = db.session.execute(db.select(FullDay).where(
            employee_id == FullDay.employee_id,
            selected_date == FullDay.date
        )).first()


        if not available_hours and not fullday_registered:
            try:
                fullday = FullDay(employee_id=int(employee_id),
                                  date=datetime.strptime(date_str, '%Y-%m-%d')
                                  )
                db.session.add(fullday)
                db.session.commit()

            except IntegrityError:
                db.session.rollback()

            except Exception as e:
                print(f'[ERROR]: {e}')


        if selected_date.weekday() in {5, 6}:
            return []

        return available_hours

    except FileNotFoundError as e:
        print(f'Use admin folder to get available hours. {e}')
        return []


@views.route('/get_available_hours', methods=['POST'])
@login_required
def get_available_hours():
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        date_str = data.get('date')  # Ex: "2025-07-15"

        if not employee_id or not date_str:
            return jsonify({"error": "Missing employee_id or date"}), 400

        # Exemplu de logică simulată:
        print(f"Received request for employee {employee_id} on {date_str}")

        available_hours = check_available_hours(date_str, employee_id)

        return jsonify(available_hours)

    except Exception as e:
        print(f"Error on /get_available_hours: {e}")
        return jsonify({"error": "An internal error occurred"}), 500


@views.route('/book_appointment', methods=['POST'])
@login_required
def book_appointment():
        data = request.get_json()
        employee_id = data.get('employee_id')
        date_str = data.get('date')
        time_slot = data.get('time_slot')

        if not all([employee_id, date_str, time_slot]):
            return jsonify({"status": "error", "message": "Missing data"}), 400

        datetime_object = datetime.strptime(
            date_str +" "+ time_slot.split('-')[1].strip(),
            "%Y-%m-%d %H:%M"
        )

        appointment = db.session.execute(
            db.select(Appointments).where(current_user.id == Appointments.client_id,
                                         datetime.now() <= Appointments.date)).first()

        if appointment:
            return jsonify({"status": "error", "message": "You already have an appointment"}), 400


        available_hours = check_available_hours(date_str, employee_id)
        print(available_hours)

        # Book Appointments
        if time_slot in available_hours and datetime_object > datetime.now() + timedelta(hours=2):
            new_appointment = Appointments(date=datetime_object,
                                          timeslot=time_slot,
                                          employee_id=int(employee_id),
                                          client_id=current_user.id
                                          )
            db.session.add(new_appointment)
            db.session.commit()

        else:
            return jsonify({"status": "error", "message": "The time slot is not available."}), 400

        return jsonify({"status": "success", "message": "Appointment booked successfully!"}), 200


@views.route('/firstday-available', methods=['POST'])
@login_required
def first_day_available():
    # Data request
    data = request.get_json()
    employee_id = data.get('employee_id')


    if not employee_id:
        return jsonify({"status": False, "message": "Employee ID is required."}), 400

    current_day = datetime.date(datetime.now())
    search_limit_days = 60

    # Check in database
    full_booked = { datetime.strftime(fd.date, '%Y-%m-%d') for fd in db.session.execute(
        db.select(FullDay).where(
            FullDay.employee_id == employee_id,
            FullDay.date >= current_day)
    ).scalars().all()
                    }

    found_available_day = None

    # Searching for available day
    for d in range(search_limit_days + 1):
        check_day = current_day + timedelta(days=d)

        if check_day.weekday() in {5, 6}: # will check if that day it is in weekend.
            continue

        elif str(check_day) not in full_booked:
            found_available_day = check_day
            break

    # Return data if found available day
    if found_available_day:
        return jsonify({"status": True,
                        "message": "The first day available was found.",
                        "data": found_available_day.isoformat()
                        }
                       ), 200
    else:
        return jsonify({"status": False,
                        "message": "The first day available was not found.",
                        "data": None
                        }
                       ), 404


@views.route('/profile', methods=['GET','POST'])
@login_required
def profile():

    return render_template("profile.html",
                           logged_in=current_user.is_authenticated
                           )


def get_appointments_by_filter(filter_condition):
    """Funcție ajutătoare pentru a prelua programările."""
    data_appointments = db.session.execute(
        db.select(Appointments).where(
            Appointments.client_id == current_user.id,
            filter_condition
        )
    ).scalars().all()


    if not data_appointments:
        return None

    return [
        {
            "appointmentId": appointment.id,
            "employee": appointment.employee.name,
            "date": appointment.date.strftime('%d %B %Y'),
            "time": appointment.date.strftime('%H:%M'),
            "service": appointment.employee.profile,
            "status": appointment.status
        }
        for appointment in data_appointments
    ]


@views.route('/upcoming-appointments', methods=['GET'])
@login_required
def upcoming_appointments():
    current_day = datetime.now()
    appointments = get_appointments_by_filter(Appointments.date >= current_day)
    print(current_day)

    if appointments is None:
        return jsonify({"status": False, "message": "You have no appointments scheduled."})

    return jsonify(appointments)


@views.route('/cancel-appointment', methods=['POST'])
@login_required
def cancel_appointment():
    data = request.get_json()
    appointment_id = data.get('appointmentId')

    if not appointment_id:
        return jsonify({"status": False, "message": "Employee ID is required."}), 400

    appointment = db.session.scalars(
        db.select(Appointments).where(
            Appointments.client_id == current_user.id,
            Appointments.id == appointment_id
        )
    ).first()


    if not appointment:
        return jsonify({"status": False, "message": "Appointment not found or you don't have permission to cancel it."}), 404

    db.session.delete(appointment)
    db.session.commit()

    return jsonify({"status": True, "message": "Appointment cancelled successfully."})


@views.route('/previous-appointments', methods=['GET'])
@login_required
def previous_appointments():
    current_day = datetime.now()
    appointments = get_appointments_by_filter(Appointments.date < current_day)

    if appointments is None:
        return jsonify({"status": False, "message": "You have no previous appointments."})

    return jsonify(appointments)


@views.route('/user-data')
@login_required
def user_profile_details():
    user_details = db.session.query(User).filter_by(id=current_user.id).first()

    if user_details:
        user_data = {
            'id': user_details.id,
            'username': user_details.username,
            'first_name': user_details.first_name,
            'last_name': user_details.last_name,
            'email': user_details.email,
            'picture': user_details.picture,
            'phone': user_details.phone,
            'birthday': user_details.birthday.isoformat() if user_details.birthday else None, # Convert datetime to string
        }
        return jsonify(user_data), 200
    else:
        return jsonify({"message": "User not found"}), 404


@views.route('/edit-user-details', methods=['POST'])
@login_required
def update_profile():
    data = request.get_json()
    field_name = data.get('field')
    new_value = data.get('value')
    print(new_value)
    print(field_name)


    if not field_name or new_value is None:
        return jsonify({'success': False, 'message': 'Missing data.'}), 400


    user_to_update = User.query.filter_by(id=current_user.id).first()

    if not user_to_update:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    editable_columns = {'first_name','last_name','email','picture','phone','birthday'}

    if field_name == 'birthday':
        new_value = datetime.strptime(new_value, '%Y-%m-%d')

    elif field_name == 'phone':
        if len(new_value) != 12:
            return jsonify({'success': False, 'message': 'Your phone number is not valid.'}), 400

    elif field_name == 'email':
        email = User.query.filter_by(email=new_value).first()
        if email:
            return jsonify({'success': False, 'message': 'This email is already used.'}), 400

    elif field_name == 'password':
        password_pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,64}$"

        if re.fullmatch(password_pattern, new_value):
            new_password = generate_password_hash(
                        password=new_value,
                        method="pbkdf2:sha256",
                        salt_length=8
                    )
            user_to_update.password_hash = new_password
            db.session.commit()
            return jsonify({'success': True, 'message': 'Update successful'})


    if field_name in editable_columns:
        try:
            setattr(user_to_update, field_name, new_value)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Update successful'})
        except Exception as e:
            db.session.rollback()  # În caz de eroare (ex: email duplicat)
            return jsonify({'success': False, 'message': f'Error updating user: {str(e)}'}), 500
    else:
        return jsonify({'success': False, 'message': f'Invalid field: {field_name}'}), 400

