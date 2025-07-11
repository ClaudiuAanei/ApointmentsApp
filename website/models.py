from datetime import timedelta, datetime, timezone
from sqlalchemy import Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from website import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key = True)
    username: Mapped[str] = mapped_column(String, nullable = False)
    first_name: Mapped[str] = mapped_column(String(40), nullable=False)
    last_name: Mapped[str] = mapped_column(String(40), nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    picture: Mapped[str] = mapped_column(String, nullable= True)
    phone: Mapped[str] = mapped_column(String(15), nullable=True)
    birthday: Mapped[str] = mapped_column(db.DateTime(timezone = True), default=datetime(2000,1,1))
    confirmation_token: Mapped[str] = mapped_column(String, nullable = False)
    token_expiration: Mapped[str] = mapped_column(db.DateTime(timezone = True), default=datetime.now(timezone.utc) + timedelta(days= 1))
    confirmed: Mapped[bool] = mapped_column(Boolean, nullable = False)
    created_at: Mapped[str] = mapped_column(db.DateTime(timezone = True), default=datetime.now(timezone.utc))
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable = False)

    reset_tokens: Mapped[list["ResetPassword"]] = relationship("ResetPassword", back_populates="user")

    appointments: Mapped[list["Appointments"]] = relationship("Appointments", back_populates="client")


    def __init__(self, email: str,
                 first_name: str, last_name: str, username: str, picture,
                 password_hash: str, is_admin: bool,
                 confirmation_token: str, confirmed: bool
                 ):
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.username = username
        self.picture = picture
        self.password_hash = password_hash
        self.is_admin = is_admin
        self.confirmation_token = confirmation_token
        self.confirmed = confirmed


class ResetPassword(db.Model):
    __tablename__ = 'resetpassword'
    id: Mapped[int] = mapped_column(Integer, primary_key = True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)
    selector: Mapped[str] = mapped_column(String, unique= True, nullable= False)
    token: Mapped[str] = mapped_column(String, nullable=False)

    token_expire_at: Mapped[str] = mapped_column(db.DateTime(timezone = True), nullable= False)

    user: Mapped["User"] = relationship("User", back_populates="reset_tokens")


class Employee(db.Model):
    __tablename__ = 'employees'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    profile: Mapped[str] = mapped_column(String, nullable=True)
    mail: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)


    appointments: Mapped[list["Appointments"]] = relationship("Appointments", back_populates="employee")

    fullday: Mapped[list["FullDay"]] = relationship("FullDay", back_populates="employee")


class Appointments(db.Model):
    __tablename__ = 'appointments'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[str] = mapped_column(db.DateTime(timezone= True), nullable=False)
    timeslot: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default='Unconfirmed', nullable=False)

    # Foreign key to Employee
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey('employees.id'), nullable=False)

    # Foreign key to User (client)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey('users.id'), nullable=False)


    employee: Mapped["Employee"] = relationship("Employee", back_populates="appointments")

    client: Mapped["User"] = relationship("User", back_populates="appointments")


class FullDay(db.Model):
    __tablename__ = 'fullday'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey('employees.id'), nullable=False)
    date: Mapped[str] = mapped_column(db.DateTime(timezone=True), nullable= False)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="fullday")


def create_user(
        email: str, first_name: str, last_name: str, username: str,
        safe_password: str, confirmation_token: str,
        picture="", confirmed= 'no'
    ):
    new_user = User(
        email=email,
        first_name= first_name,
        last_name= last_name,
        username=username,
        picture=picture if picture else None,
        password_hash=generate_password_hash(password= safe_password, method= "pbkdf2:sha256", salt_length= 8),
        is_admin=False,
        confirmation_token=confirmation_token,
        confirmed=True if confirmed == 'yes' else False
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user