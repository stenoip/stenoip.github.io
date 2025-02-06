from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import imaplib
import email

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mailsteno.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key'
db = SQLAlchemy(app)
CORS(app)
login_manager = LoginManager()
login_manager.init_app(app)

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    email = f"{data['username']}@semail.com"
    password = generate_password_hash(data['password'])
    new_user = User(username=username, email=email, password_hash=password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        login_user(user)
        return jsonify({'message': 'Login successful!'}), 200
    return jsonify({'message': 'Invalid credentials!'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful!'}), 200

@app.route('/send_email', methods=['POST'])
def send_email():
    if not current_user.is_authenticated:
        return jsonify({'message': 'User not authenticated!'}), 401
    data = request.get_json()
    recipient = data['recipient']
    subject = data['subject']
    body = data['body']
    
    sender_email = current_user.email
    sender_password = data['password']  # Use a secure method to store and retrieve email password

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = recipient
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP('smtp.yourmailserver.com', 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            text = msg.as_string()
            server.sendmail(sender_email, recipient, text)
        return jsonify({'message': 'Email sent successfully!'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/inbox', methods=['POST'])
def inbox():
    if not current_user.is_authenticated:
        return jsonify({'message': 'User not authenticated!'}), 401
    data = request.get_json()
    email_password = data['password']

    try:
        mail = imaplib.IMAP4_SSL('imap.yourmailserver.com')
        mail.login(current_user.email, email_password)
        mail.select('inbox')

        result, data = mail.search(None, 'ALL')
        mail_ids = data[0]
        id_list = mail_ids.split()

        emails = []
        for i in id_list:
            result, message_data = mail.fetch(i, '(RFC822)')
            raw_email = message_data[0][1].decode('utf-8')
            msg = email.message_from_string(raw_email)

            email_data = {
                'sender': msg['from'],
                'subject': msg['subject'],
                'body': msg.get_payload(decode=True).decode('utf-8'),
                'timestamp': msg['date']
            }
            emails.append(email_data)
        
        mail.logout()
        return jsonify(emails), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
