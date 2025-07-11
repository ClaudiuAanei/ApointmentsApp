from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, EmailField, SubmitField
from werkzeug.security import check_password_hash
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from website.models import User

class Registration(FlaskForm):

    first_name = StringField('First Name', validators=[
        DataRequired(message="Enter your first name."),
        Length(min=2, max=20, message='First name must have between 2 and 20 characters')
    ]
                           )

    last_name = StringField('Last Name', validators=[
        DataRequired(message="Enter your last name."),
        Length(min=2, max=20, message='Username must have between 2 and 20 characters')
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


    def validate_email(self, email):
        email = User.query.filter_by(email=email.data).first()
        if email:
            raise ValidationError('This email is already used.')


    def validate_password(self, password_field):

        password_value = password_field.data

        if not any(c.isupper() for c in password_value):
            raise ValidationError('Password must contain at least one uppercase letter.')

        if not any(c.islower() for c in password_value):
            raise ValidationError("Password must contain at least one lowercase letter.")

        if not any(c.isdigit() for c in password_value):
            raise ValidationError("Password must contain at least one digit.")

        special_chars = "!@#$%^&*()_+{}[]:;<>,.?~\\-"
        if not any(c in special_chars for c in password_value):
            raise ValidationError("Password must contain at least one special character.")



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
            if not check_password_hash(email.password_hash, password=password.data):
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
