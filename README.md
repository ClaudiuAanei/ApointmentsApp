# Flask Appointment Booking System

This is a full-stack web application built with Python and Flask that allows users to book and manage appointments. It features a complete user authentication system (local and Google OAuth), an interactive calendar for scheduling, and a personal profile page for users to view their appointment history and manage their personal details.

---

## ✨ Key Features

* **User Authentication**:
    * Secure user registration with email confirmation.
    * Standard login with email and password.
    * Login/Register with Google (OAuth 2.0).
    * Secure password reset functionality via email.
    * CSRF protection on all forms.
* **Appointment Management**:
    * Select from a list of available employees.
    * Interactive calendar to pick a date.
    * Dynamically loads available time slots for the selected employee and date.
    * Real-time validation to prevent double-booking.
    * "Find First Day Available" feature for quick booking.
* **User Profile Dashboard**:
    * View upcoming and past appointments in separate tabs.
    * Ability to cancel upcoming appointments.
    * In-place editing for user details (First Name, Last Name, Email, Phone, Birthday) without a page reload.
    * Securely change your password with validation checks.
    * Upload and update a profile picture.
* **Responsive UI**:
    * Built with Bootstrap 5 for a mobile-first, responsive design.
    * Optimized views for both desktop and mobile devices.
    * Persistent Dark/Light theme toggle.

---

## 🛠️ Technologies Used

### Backend
* **Framework**: Flask
* **Database**: SQLAlchemy, Flask-Migrate (with SQLite as the default)
* **Authentication**: Flask-Login, Flask-Dance, Werkzeug (for password hashing)
* **Forms**: Flask-WTF
* **Email**: smtplib
* **Environment Variables**: python-dotenv

### Frontend
* **Styling**: Bootstrap 5, CSS3
* **JavaScript**: Vanilla JS (for DOM manipulation, API calls), jQuery (for validation)
* **Template Engine**: Jinja2
* **Icons**: Bootstrap Icons, Font Awesome

---

## 🚀 Setup and Installation

Follow these steps to get the project running on your local machine.

### 1. Prerequisites
* Python 3.8+
* `pip` and `venv`

### 2. Clone the Repository
```bash
git clone [https://github.com/your-username/your-repository-name.git](https://github.com/your-username/your-repository-name.git)
cd your-repository-name

3. Set Up Virtual Environment
Create and activate a virtual environment.

On Windows:

python -m venv venv
.\venv\Scripts\activate

On macOS/Linux:

python3 -m venv venv
source venv/bin/activate

4. Install Dependencies
Install all the required packages from requirements.txt.

pip install -r requirements.txt

(Note: If you don't have a requirements.txt file, you can create one by running pip freeze > requirements.txt after installing the packages mentioned in the imports.)

5. Environment Variables
Create a .env file in the root directory of the project. This file will hold your secret keys and configuration variables. You can copy the structure below.

Example .env

# Flask Secret Key (generate a new one)
SECRET_KEY='a_very_strong_and_random_secret_key'

# Database Configuration
DB_NAME='database.db'

# Google OAuth Credentials (from Google Cloud Console)
CLIENT_ID='your_google_client_id'
CLIENT_SECRET='your_google_client_secret'

# Email Configuration (for an App Password in Gmail)
MY_EMAIL='your-email@gmail.com'
PASSWORD='your_gmail_app_password'

# Application URLs (for email links)
CONFIRMATION_URL='[http://127.0.0.1:5000/confirm?code=](http://127.0.0.1:5000/confirm?code=)'
RESET_PASSWORD='[http://127.0.0.1:5000/reset-password](http://127.0.0.1:5000/reset-password)?'

How to get the credentials:

SECRET_KEY: Generate a random string. You can use python -c 'import secrets; print(secrets.token_hex())'.

CLIENT_ID & CLIENT_SECRET: Create a new project in the Google Cloud Console, enable the "Google People API", and create OAuth 2.0 credentials. Make sure to add http://127.0.0.1:5000/login/google/authorized to the authorized redirect URIs.

PASSWORD: If using Gmail, you'll need to generate an "App Password" from your Google Account settings, not your regular password.

6. Initialize the Database
Use Flask-Migrate to create and apply your database schema.

# Set the Flask app environment variable
# On Windows: set FLASK_APP=main.py 
# On macOS/Linux: export FLASK_APP=main.py 
# (or the name of the file where create_app() is called)

# Run the migrations
flask db init
flask db migrate -m "Initial migration."
flask db upgrade

7. Run the Application
flask run

The application will be available at http://127.0.0.1:5000.

📄 .gitignore
It's recommended to add the following to your .gitignore file to keep your repository clean:

# Virtual Environment
venv/
__pycache__/

# Environment files
.env

# Database file
*.db
instance/

# IDE files
.idea/
.vscode/
