from sqlalchemy import Integer, String, ForeignKey, Boolean, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from website import db
from flask_login import UserMixin


class User(db.Model, UserMixin):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key = True)
    email: Mapped[str] = mapped_column(String, unique = True, nullable = False)
    username: Mapped[str] = mapped_column(String, nullable = False)
    password: Mapped[str] = mapped_column(String, nullable = False)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable = False)
    confirmation_code: Mapped[str] = mapped_column(String, nullable = False)
    confirmation: Mapped[bool] = mapped_column(Boolean, nullable = False)
    date_created: Mapped[str] = mapped_column(db.DateTime(timezone = True), default= func.now())

    def __init__(self, email: str, username: str, password: str, is_admin: bool, confirmation_code: str, confirmation: bool):
        self.email = email
        self.username = username
        self.password = password
        self.is_admin = is_admin
        self.confirmation_code = confirmation_code
        self.confirmation = confirmation