# Flask Appointment Booking System

"I am still actively working on this project and I'm focused on turning it into a real product."

This is a full-stack web application built with Python and Flask that allows users to book and manage appointments. 
It features a complete user authentication system (local and Google OAuth), an interactive calendar for scheduling, 
and a personal profile page for users to view their appointment history and manage their personal details.

---

✨ Key Features

User Authentication:
    * Secure user registration with email confirmation.
    * Standard login with email and password.
    * Login/Register with Google (OAuth 2.0).
    * Secure password reset functionality via email.
    * CSRF protection on all forms.
Appointment Management:
    * Select from a list of available employees.
    * Interactive calendar to pick a date.
    * Dynamically loads available time slots for the selected employee and date.
    * Real-time validation to prevent double-booking.
    * "Find First Day Available" feature for quick booking.
User Profile Dashboard:
    * View upcoming and past appointments in separate tabs.
    * Ability to cancel upcoming appointments.
    * In-place editing for user details (First Name, Last Name, Email, Phone, Birthday) without a page reload.
    * Securely change your password with validation checks.
    * Upload and update a profile picture.
Responsive UI:
    * Built with Bootstrap 5 for a mobile-first, responsive design.
    * Optimized views for both desktop and mobile devices.
    * Persistent Dark/Light theme toggle.

---

🛠️ Technologies Used

### Backend
Framework: Flask
Database: SQLAlchemy, Flask-Migrate (with SQLite as the default)
Authentication: Flask-Login, Flask-Dance, Werkzeug (for password hashing)
Forms: Flask-WTF
Email: smtplib
Environment Variables: python-dotenv

### Frontend ( i use my imagination and gemini )
Styling**: Bootstrap 5, CSS3
JavaScript**: Vanilla JS (for DOM manipulation, API calls), jQuery (for validation)
Template Engine**: Jinja2
Icons**: Bootstrap Icons, Font Awesome

---

🚀 Setup and Installation

Follow these steps to get the project running on your local machine.
Python 3.8 +

1. Set Up Virtual Environment
Create and activate a virtual environment.

2. Install Dependencies
Install all the required packages from requirements.txt.

3. Environment Variables
Create a .env file in the root directory of the project. This file will hold your secret keys and configuration variables. You can copy the structure below.
# Flask Secret Key
SECRET_KEY='a_very_strong_and_random_secret_key'
# Database Configuration
DB_NAME='database.db'

# Google OAuth Credentials (from Google Cloud Console)
CLIENT_ID='your_google_client_id'
CLIENT_SECRET='your_google_client_secret'

# Email Configuration (for an App Password in Gmail)
MY_EMAIL='your.email@gmail.com'
PASSWORD='your gmail app password'

# Application URLs (for email links)
CONFIRMATION_URL="http://localhost:5000/confirm?code="
RESET_PASSWORD="http://localhost:5000/reset-password?"

4. Initialize the Database
Use Flask-Migrate to create and apply your database schema.

5. Run the Application
flask run

The application will be available at http://localhost:5000.
