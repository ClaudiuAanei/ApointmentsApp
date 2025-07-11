from website import db, create_app
from website.models import User, Employee, Appointments
from datetime import datetime, timedelta, timezone
from werkzeug.security import generate_password_hash
import random
import string

app = create_app()

def generate_random_string(length=32):
    """Generates a random string of specified length using letters and digits."""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for i in range(length))

def populate_database():
    """Populates the database with sample user, employee, and appointment data."""
    with app.app_context():
        db.create_all()
        print("Tables created/checked.")

        # Check if the database is already populated to prevent duplicate entries
        if User.query.first() and Employee.query.first():
            print("Database already seems populated. Skipping new data.")
            return

        print("Populating database with sample data...")

        # --- Add Users ---
        # Note: The 'create_user' function handles password hashing and confirmation token generation.
        users_data = [
            # email, first_name, last_name, username, safe_password, confirmed (yes/no)
            ("test@test.com", "Name", "Same", "Same Name", "1234", "yes"),
            ("jane.smith@example.com", "Jane", "Smith", "jane_s", "securepass", "yes"),
            ("alice.jones@example.com", "Alice", "Jones", "alice_j", "mypassword", "no"),
            ("bob.williams@example.com", "Bob", "Williams", "bob_w", "testpass", "yes"),
        ]
        users = []
        for email, first_name, last_name, username, password, confirmed_status in users_data:
            # Generate a confirmation token for each user
            confirmation_token = generate_random_string()
            new_user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                username=username,
                picture=None, # You can set a default picture path here if needed
                password_hash=generate_password_hash(password=password, method="pbkdf2:sha256", salt_length=8),
                is_admin=False, # Set admin status as per your requirement
                confirmation_token=confirmation_token,
                confirmed=True if confirmed_status == 'yes' else False
            )
            db.session.add(new_user)
            users.append(new_user)
        db.session.commit()
        print(f"Added {len(users)} users.")

        # --- Add Employees ---
        employees_data = [
            ("Mihai Popescu", "Worker", "mihai.p@salon.com", "0720123456"),
            ("Andreea Vasilescu", "Worker", "andreea.v@salon.com", "0721654321"),
            ("Cristian Dumitrescu", "Worker", "cristi.d@salon.com", "0730987654"),
        ]
        employees = []
        for name, profile, mail, phone in employees_data:
            new_employee = Employee(name=name, profile=profile, mail=mail, phone=phone)
            db.session.add(new_employee)
            employees.append(new_employee)
        db.session.commit()
        print(f"Added {len(employees)} employees.")

        # --- Add Appointments ---
        if users and employees:
            # Example:
            # client (User object), employee (Employee object), date (datetime object), timeslot (string)
            appointments_data = [
                (users[0], employees[0], datetime.now(timezone.utc) - timedelta(days=2), "14:30 - 15:00"), # Past appointment
                (users[1], employees[1], datetime.now(timezone.utc) + timedelta(days=1), "10:00 - 10:30"), # Future appointment
                (users[2], employees[2], datetime.now(timezone.utc) + timedelta(days=1), "11:00 - 11:30"), # Future appointment
                (users[3], employees[0], datetime.now(timezone.utc) + timedelta(days=1), "16:30 - 17:00"), # Future appointment
            ]

            for user_obj, employee_obj, date_time, timeslot_str in appointments_data:
                new_appointment = Appointments(
                    date=date_time,
                    timeslot=timeslot_str,
                    status='Unconfirmed', # Default status
                    employee=employee_obj,
                    client=user_obj
                )
                db.session.add(new_appointment)
            db.session.commit()
            print(f"Added {len(appointments_data)} appointments.")
        else:
            print("Could not create appointments, missing users or employees.")

        print("Database population finished!")

if __name__ == "__main__":
    populate_database()