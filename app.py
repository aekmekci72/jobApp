from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS



app = Flask(__name__)
CORS(app)


if __name__ == '__main__':
    app.run(debug=True, port=5000)