from datetime import timedelta, datetime, timezone
from sqlalchemy import Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from website import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key = True)
    email: Mapped[str] = mapped_column(String, unique = True, nullable = False)
    username: Mapped[str] = mapped_column(String, nullable = False)
    password_hash: Mapped[str] = mapped_column(String, nullable = False)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable = False)
    confirmation_token: Mapped[str] = mapped_column(String, nullable = False)
    token_expiration: Mapped[str] = mapped_column(db.DateTime(timezone = True), default=datetime.now(timezone.utc) + timedelta(days= 1))
    confirmed: Mapped[bool] = mapped_column(Boolean, nullable = False)
    created_at: Mapped[str] = mapped_column(db.DateTime(timezone = True), default=datetime.now(timezone.utc))

    reset_tokens: Mapped[list["ResetPassword"]] = relationship("ResetPassword", back_populates="user")


    def __init__(self, email: str, username: str, password_hash: str, is_admin: bool, confirmation_token: str, confirmed: bool):
        self.email = email
        self.username = username
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


def create_user(email, username, safe_password, confirmation_token, confirmed= 'no'):
    new_user = User(
        email=email,
        username=username,
        password_hash=generate_password_hash(password= safe_password, method= "pbkdf2:sha256", salt_length= 8),
        is_admin=False,
        confirmation_token=confirmation_token,
        confirmed=True if confirmed == 'yes' else False
    )

    db.session.add(new_user)
    db.session.commit()

    return new_user