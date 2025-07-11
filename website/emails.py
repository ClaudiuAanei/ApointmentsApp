import os
import smtplib
import string
from random import choice, shuffle, randint
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText #
from dotenv import find_dotenv, load_dotenv

PATH = find_dotenv()
load_dotenv(PATH)


MY_EMAIL = os.getenv("MY_EMAIL")
PASSWORD = os.getenv("PASSWORD")


class UniqueCode:
    def __init__(self, length_range=(16, 24)):
        self.characters = string.ascii_letters + string.digits
        self.unique_code_length = length_range


    def generate(self):
        code_length = randint(*self.unique_code_length)
        code = [choice(self.characters) for _ in range(code_length)]
        shuffle(code)
        return "".join(code)


class Email:
    def __init__(self):
        self.unique_code = UniqueCode().generate()


    @staticmethod
    def send_email(email_to, subject, mail_content):

        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = MY_EMAIL
            msg['To'] = email_to if email_to else 'no_email_has_been_created@gmail.com'

            html = MIMEText(mail_content, 'html')
            msg.attach(html)

            with smtplib.SMTP("smtp.gmail.com", 587) as connection:
                connection.starttls()
                connection.login(user=MY_EMAIL, password=PASSWORD)
                connection.sendmail(msg['From'], msg['To'], msg.as_string())


        except smtplib.SMTPException as e:
            print(f"Error SMTP: {e}")

        except Exception as e:
            print(f"Error SMTP: {e}")


    def send_confirmation_email(self, filepath: str, user_email , user_id, *args: tuple):
        with open(f"{filepath}", mode= 'r', encoding= "UTF-8") as file:
            text = file.read()
            new_mail = text.replace("[URL_WEBSITE]",
                                    f"{os.getenv('CONFIRMATION_URL')}{self.unique_code}&id={user_id}")

            if args:
                for item in args:
                    new_mail = new_mail.replace(item[0], item[1])

        self.send_email(user_email, 'Confirmation Email',new_mail)


    def send_reset_password_email(self,file_path: str, selector, user_email, *args):
        with open(f"{file_path}", mode= 'r', encoding= "UTF-8") as file:
            text = file.read()
            new_mail = text.replace("[RESET_LINK]",
                                    f"{os.getenv('RESET_PASSWORD')}token={self.unique_code}&selector={selector}")
            if args:
                for item in args:
                    new_mail = new_mail.replace(item[0], item[1])



        self.send_email(user_email, 'Reset Password Email', new_mail)



if __name__ == '__main__':
    uc = UniqueCode()

