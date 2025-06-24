from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField, SubmitField
from werkzeug.security import check_password_hash
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from .models import User

class Registration(FlaskForm):

    username = StringField('Your name', validators=[
        DataRequired(message="Enter your name."),
        Length(min=4, max=20, message='Username must have between 4 and 20 characters')
    ]
                           )

    email = EmailField('Email Address', validators=[
        DataRequired(message="Enter your email."),
        Email(message="This is not a valid email.")
    ]
                       )

    password = PasswordField('Password', validators=[
        DataRequired(message="Enter your password"),
        Length(min=8 ,message= "Password must have minimum 8 characters.")
    ]
                             )

    confirm_password = PasswordField('Confirm password', validators=[
        DataRequired('Confirm your password'),
        EqualTo('password', message= "Passwords doesn't match")
    ]
                                     )

    submit = SubmitField('Register')


    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('User already exists.')


    def validate_email(self, email):
        email = User.query.filter_by(email=email.data).first()
        if email:
            raise ValidationError('This email is already used.')


class LoginForm(FlaskForm):

    email = EmailField('Email Address', validators=[
        DataRequired(message="Enter your email"),
        Email(message="This is not a valid email.")
    ]
                       )

    password = PasswordField('Password', validators=[DataRequired(message="Enter your password")])

    submit = SubmitField('Login')


    def validate_password(self, password):

        email = User.query.filter_by(email= self.email.data).first()

        if email:
            if not check_password_hash(email.password, password=password.data):
                raise ValidationError('Invalid email or password')
        else:
            raise ValidationError('Invalid email or password')


class ResetPasswordForm(FlaskForm):

    password = PasswordField('New Password', validators=[
        DataRequired(message="Enter your password"),
        Length(min=8 ,message= "Password must have minimum 8 characters.")
    ]
                             )

    confirm_password = PasswordField('Confirm password', validators=[
        DataRequired('Confirm your password'),
        EqualTo('password', message= "Passwords doesn't match")
    ]
                                     )

    submit = SubmitField('Reset')


class RequestResetPasswordForm(FlaskForm):

    email = EmailField('Email Address', validators=[
        DataRequired(message="Enter your email"),
        Email('This is not a valid email')
    ]
                       )

    submit = SubmitField('Submit')
