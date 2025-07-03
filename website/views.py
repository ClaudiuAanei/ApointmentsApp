import json
from sqlalchemy import func
from flask import Blueprint, render_template, request, jsonify
from flask_login import current_user, login_required
from datetime import datetime, timedelta
from website import db
from website.models import Reservation, Employee, FullDay

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


        selected_date = datetime.strptime(date_str, '%Y-%m-%d')
        if selected_date.weekday() in {5, 6}:
            available_hours = []

        if not available_hours:
            pass # Aici vine

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
            db.select(Reservation).where(current_user.id == Reservation.client_id,
                                         datetime.now() <= Reservation.date)).first()

        if appointment:
            return jsonify({"status": "error", "message": "You already have an appointment"}), 400


        available_hours = check_available_hours(date_str, employee_id)
        print(available_hours)

        # Book appointment
        if time_slot in available_hours:
            new_appointment = Reservation(date=datetime_object,
                                          timeslot=time_slot,
                                          employee_id=int(employee_id),
                                          client_id=current_user.id
                                          )
            db.session.add(new_appointment)
            db.session.commit()
            if len(available_hours) <= 1:
                fullday = FullDay(employee_id=int(employee_id),
                                      date = datetime_object
                                      )
                db.session.add(fullday)
                db.session.commit()
                print(f'{date_str}, is full booked.')
        else:
            return jsonify({"status": "error", "message": "The time slot is not available."}), 400

        return jsonify({"status": "success", "message": "Appointment booked successfully!"}), 200


@views.route('/firstday-available', methods=['POST'])
@login_required
def first_day_available():
    # Data request
    data = request.get_json()
    employee_id = data.get('employee_id')
    # Check in database

    if not employee_id:
        return jsonify({"status": False, "message": "Employee ID is required."}), 400

    current_day = datetime.date(datetime.now())
    search_limit_days = 60

    full_booked = { datetime.strftime(fd.date, '%Y-%m-%d') for fd in db.session.execute(
        db.select(FullDay).where(
            FullDay.employee_id == employee_id,
            FullDay.date >= current_day)
    ).scalars().all()
                    }


    found_available_day = None
    print(full_booked)

    # Searching for available day
    for d in range(search_limit_days + 1):
        check_day = current_day + timedelta(days=d)


        if check_day.weekday() in {5, 6}: # will check if that day it is in weekend.
            continue

        elif str(check_day) not in full_booked:
            found_available_day = check_day
            break

    print(found_available_day)
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


def check_available_hours(date_str, employee_id):
    """Check if slots are available and are returned into a list"""
    today_booked = db.session.execute(
        db.select(Reservation).where(
            Reservation.employee_id == employee_id,
            func.date(Reservation.date) == date_str)
    ).scalars().all()

    try:
        with open('website/openhours.json', mode='r') as file:
            if date_str == str(datetime.date(datetime.now())):
                time_now = (datetime.now().hour + 3) * 60
                available_hours = [timeslot for timeslot, values in json.load(file).items() if values[0] > time_now]
            else:
                available_hours = [timeslot for timeslot in json.load(file)]

        for reservation in today_booked:
           if reservation.timeslot in available_hours:
               available_hours.remove(reservation.timeslot)

        return available_hours

    except FileNotFoundError:
        return []