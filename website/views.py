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
    return render_template(
        'appointment.html',
        employees=employees,
        logged_in=current_user.is_authenticated
    )


def check_available_hours(date_str, employee_id):
    """
    Checks for available appointment slots for a given employee and date.

    Args:
        date_str (str): The date to check in 'YYYY-MM-DD' format.
        employee_id (int): The ID of the employee.

    Returns:
        list: A list of available timeslot strings. Returns an empty list if the
              day is a weekend, fully booked, or an error occurs.
    """
    # Get all appointments already booked for the employee on the selected date.
    today_booked = db.session.execute(
        db.select(Appointments).where(
            Appointments.employee_id == employee_id,
            func.date(Appointments.date) == date_str)
    ).scalars().all()

    selected_date = datetime.strptime(date_str, '%Y-%m-%d')

    try:
        # Load the standard business hours from a JSON file.
        with open('website/openhours.json', mode='r') as file:
            opening_hours = json.load(file)

            # The appointment is only created if the timeslot is available AND
            # it meets the 2-hour advance booking requirement.
            if date_str == datetime.now().strftime('%Y-%m-%d'):
                time_now_in_minutes = (datetime.now().hour + 2) * 60
                available_hours = [
                    timeslot for timeslot, values in opening_hours.items()
                    if values[0] > time_now_in_minutes
                ]
            else:
                available_hours = list(opening_hours.keys())

        # Remove timeslots that are already booked.
        for appointment in today_booked:
           if appointment.timeslot in available_hours:
               available_hours.remove(appointment.timeslot)

        # Check if the day has been manually marked as fully booked.
        fullday_registered = db.session.execute(db.select(FullDay).where(
            employee_id == FullDay.employee_id,
            selected_date == FullDay.date
        )).first()

        # If all standard slots are booked and the day isn't already marked,
        # create a FullDay entry to optimize future lookups.
        if not available_hours and not fullday_registered:
            try:
                fullday = FullDay(
                    employee_id=int(employee_id),
                    date=datetime.strptime(date_str, '%Y-%m-%d')
                )
                db.session.add(fullday)
                db.session.commit()
            except IntegrityError:
                # This can happen in a race condition; rollback is safe.
                db.session.rollback()
            except Exception as e:
                print(f'[ERROR] Could not create FullDay entry: {e}')

        # Appointments cannot be made on weekends (Saturday=5, Sunday=6).
        if selected_date.weekday() in {5, 6}:
            return []

        return available_hours

    except FileNotFoundError as e:
        print(f'Could not find openhours.json. {e}')
        return []


@views.route('/get_available_hours', methods=['POST'])
@login_required
def get_available_hours():
    """API endpoint to fetch available hours for a selected employee and date."""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        date_str = data.get('date')

        if not employee_id or not date_str:
            return jsonify({"error": "Missing employee_id or date"}), 400

        available_hours = check_available_hours(date_str, employee_id)
        return jsonify(available_hours)

    except Exception as e:
        print(f"Error on /get_available_hours: {e}")
        return jsonify({"error": "An internal error occurred"}), 500


@views.route('/book_appointment', methods=['POST'])
@login_required
def book_appointment():
    """API endpoint to book a new appointment."""
    data = request.get_json()
    employee_id = data.get('employee_id')
    date_str = data.get('date')
    time_slot = data.get('time_slot')

    if not all([employee_id, date_str, time_slot]):
        return jsonify({"status": "error", "message": "Missing data"}), 400

    # Create a full datetime object from the date and the end time of the slot.
    datetime_object = datetime.strptime(
        date_str + " " + time_slot.split('-')[1].strip(),
        "%Y-%m-%d %H:%M"
    )

    # Check if the user already has an active (future) appointment.
    existing_appointment = db.session.execute(
        db.select(Appointments).where(
            current_user.id == Appointments.client_id,
            datetime.now() <= Appointments.date)
    ).first()

    if existing_appointment:
        return jsonify({"status": "error", "message": "You already have an appointment"}), 400

    # Re-check available hours to prevent booking a slot that was just taken.
    available_hours = check_available_hours(date_str, employee_id)

    # Business rule: an appointment can only be booked if it's at least 2 hours in the future.
    can_book_in_advance = datetime_object > datetime.now() + timedelta(hours=2)

    if time_slot in available_hours and can_book_in_advance:
        new_appointment = Appointments(
            date=datetime_object,
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
    """
    API endpoint to find the first available day for an employee within a
    60-day search limit.
    """
    data = request.get_json()
    employee_id = data.get('employee_id')

    if not employee_id:
        return jsonify({"status": False, "message": "Employee ID is required."}), 400

    current_day = datetime.date(datetime.now())
    search_limit_days = 60

    # Fetch all future days marked as fully booked for this employee to minimize DB queries.
    full_booked_days = {
        datetime.strftime(fd.date, '%Y-%m-%d') for fd in db.session.execute(
            db.select(FullDay).where(
                FullDay.employee_id == employee_id,
                FullDay.date >= current_day
            )
        ).scalars().all()
    }

    found_available_day = None

    # Iterate from today up to the search limit.
    for d in range(search_limit_days + 1):
        check_day = current_day + timedelta(days=d)

        # Skip weekends.
        if check_day.weekday() in {5, 6}:
            continue

        # If the day is not in our set of fully booked days, we assume it's available.
        if str(check_day) not in full_booked_days:
            found_available_day = check_day
            break

    if found_available_day:
        return jsonify({
            "status": True,
            "message": "The first day available was found.",
            "data": found_available_day.isoformat()
        }), 200
    else:
        return jsonify({
            "status": False,
            "message": "The first day available was not found in the next 60 days.",
            "data": None
        }), 404


@views.route('/profile', methods=['GET','POST'])
@login_required
def profile():
    return render_template(
        "profile.html",
        logged_in=current_user.is_authenticated
    )


def get_appointments_by_filter(filter_condition):
    """
    Helper function to retrieve and format appointments for the current user
    based on a given filter condition.

    Args:
        filter_condition: A SQLAlchemy filter condition (e.g., Appointments.date >= now).

    Returns:
        A list of appointment dictionaries or None if no appointments are found.
    """
    appointments = db.session.execute(
        db.select(Appointments).where(
            Appointments.client_id == current_user.id,
            filter_condition
        )
    ).scalars().all()

    if not appointments:
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
        for appointment in appointments
    ]


@views.route('/upcoming-appointments', methods=['GET'])
@login_required
def upcoming_appointments():
    """API endpoint to get all future appointments for the current user."""
    current_day = datetime.now()
    appointments = get_appointments_by_filter(Appointments.date >= current_day)
    if appointments is None:
        return jsonify({"status": False, "message": "You have no appointments scheduled."})
    return jsonify(appointments)


@views.route('/cancel-appointment', methods=['POST'])
@login_required
def cancel_appointment():
    """API endpoint to cancel a specific appointment."""
    data = request.get_json()
    appointment_id = data.get('appointmentId')

    if not appointment_id:
        return jsonify({"status": False, "message": "Appointment ID is required."}), 400

    # Find the appointment to ensure it exists and belongs to the current user.
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
    """API endpoint to get all past appointments for the current user."""
    current_day = datetime.now()
    appointments = get_appointments_by_filter(Appointments.date < current_day)
    if appointments is None:
        return jsonify({"status": False, "message": "You have no previous appointments."})
    return jsonify(appointments)


@views.route('/user-data')
@login_required
def user_profile_details():
    """API endpoint to retrieve the current user's profile details."""
    user = User.query.filter_by(id=current_user.id).first()
    if user:
        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'picture': user.picture,
            'phone': user.phone,
            'birthday': user.birthday.isoformat() if user.birthday else None,
        }
        return jsonify(user_data), 200
    else:
        return jsonify({"message": "User not found"}), 404


@views.route('/edit-user-details', methods=['POST'])
@login_required
def update_profile():
    """API endpoint to update a specific field of the user's profile."""
    data = request.get_json()
    field_name = data.get('field')
    new_value = data.get('value')

    if not field_name or new_value is None:
        return jsonify({'success': False, 'message': 'Missing data.'}), 400

    user_to_update = User.query.filter_by(id=current_user.id).first()
    if not user_to_update:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    # A whitelist of columns that are allowed to be edited.
    editable_columns = {'first_name', 'last_name', 'email', 'picture', 'phone', 'birthday'}

    # --- Field-specific validation ---
    if field_name == 'birthday':
        new_value = datetime.strptime(new_value, '%Y-%m-%d')
    elif field_name == 'phone':
        if len(new_value) != 12: # Example validation
            return jsonify({'success': False, 'message': 'Your phone number is not valid.'}), 400
    elif field_name == 'email':
        email = User.query.filter_by(email=new_value).first()
        if email:
            return jsonify({'success': False, 'message': 'This email is already used.'}), 400
    elif field_name == 'password':
        # Use regex to enforce a strong password policy.
        password_pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,64}$"
        if re.fullmatch(password_pattern, new_value):
            new_password = generate_password_hash(
                password=new_value,
                method="pbkdf2:sha256",
                salt_length=8
            )
            user_to_update.password_hash = new_password
            db.session.commit()
            return jsonify({'success': True, 'message': 'Password updated successfully'})
        else:
            return jsonify({'success': False, 'message': 'Password is not strong enough.'}), 400

    # --- General update logic ---
    if field_name in editable_columns:
        try:
            # Use setattr to dynamically set the attribute on the user object.
            setattr(user_to_update, field_name, new_value)
            db.session.commit()
            return jsonify({'success': True, 'message': 'Update successful'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f'Error updating user: {str(e)}'}), 500
    else:
        return jsonify({'success': False, 'message': f'Invalid field: {field_name}'}), 400