from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore


app = Flask(__name__)
CORS(app)

cred = credentials.Certificate("serviceKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


@app.route('/filler', methods=['POST'])
def create_filler():
    data = request.get_json()
    if not data or 'filler_field' not in data:
        return jsonify({'error': 'Missing filler_field'}), 400

    doc_ref = db.collection('filler').add({
        'filler_field': data['filler_field']
    })

    return jsonify({'message': 'Filler created', 'id': doc_ref[1].id}), 201


if __name__ == '__main__':
    app.run(debug=True, port=5000)