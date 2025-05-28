from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from PyPDF2 import PdfReader
import requests
import json
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

cred = credentials.Certificate("serviceKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in .env")
@app.route('/filler', methods=['POST'])
def create_filler():
    data = request.get_json()
    if not data or 'filler_field' not in data:
        return jsonify({'error': 'Missing filler_field'}), 400

    doc_ref = db.collection('filler').add({
        'filler_field': data['filler_field']
    })

    return jsonify({'message': 'Filler created', 'id': doc_ref[1].id}), 201

@app.route('/parse', methods=['POST'])
def parse_file():
    uploaded_file = request.files.get('file')
    if not uploaded_file:
        return jsonify({'error': 'No file provided'}), 400

    filename = uploaded_file.filename.lower()
    text = ''

    try:
        if filename.endswith('.txt'):
            text = uploaded_file.read().decode('utf-8')
        elif filename.endswith('.pdf'):
            reader = PdfReader(uploaded_file)
            text = ''.join([page.extract_text() or '' for page in reader.pages])
        else:
            return jsonify({'error': 'Unsupported file type'}), 400


        username = "user"

        resume_data = {
            'username': username,
            'parsed_text': text,
            'timestamp': firestore.SERVER_TIMESTAMP
        }

        doc_ref = db.collection('resume').add(resume_data)
        return jsonify({
            'message': 'Resume parsed and saved successfully',
            'document_id': doc_ref[1].id,
            'text': text
        })


    except Exception as e:
        return jsonify({'error': f'Failed to parse file: {str(e)}'}), 500

@app.route('/score_resume', methods=['POST'])
def score_resume():
    uploaded_file = request.files.get('file')
    if not uploaded_file:
        return jsonify({'error': 'No file provided'}), 400

    filename = uploaded_file.filename.lower()
    resume_text = ''

    try:
        if filename.endswith('.txt'):
            resume_text = uploaded_file.read().decode('utf-8')
        elif filename.endswith('.pdf'):
            reader = PdfReader(uploaded_file)
            resume_text = ''.join([page.extract_text() or '' for page in reader.pages])
        else:
            return jsonify({'error': 'Unsupported file type'}), 400

        prompt = f"""Evaluate the quality of the following resume. Provide a score from 1 to 10 and give 3–5 bullet points with strengths and weaknesses.

{resume_text}
"""

        llama_response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "",
                "X-Title": "Resume Scorer App",
            },
            data=json.dumps({
                "model": "meta-llama/llama-4-scout:free",
                "messages": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": prompt}]
                    }
                ],
            })
        )

        result = llama_response.json()
        print(result)
        evaluation = result.get('choices', [{}])[0].get('message', {}).get('content', 'No evaluation received.')
        
        username = "user"

        resume_data = {
            'username': username,
            'parsed_text': resume_text,
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        doc_ref = db.collection('parsed_resumes').add(resume_data)


        return jsonify({
            'parsed_text': resume_text,
            'resume_score': evaluation
        })

    except Exception as e:
        return jsonify({'error': f'Failed to process resume: {str(e)}'}), 500

@app.route('/rewrite_bullets', methods=['POST'])
def highlight_resume_improvements():
    data = request.get_json()
    resume_text = data.get('resume_text', '')
    
    if not resume_text:
        return jsonify({'error': 'No resume text provided'}), 400

    prompt = f"""
Read the following resume text and identify any areas that could be improved. 
Highlight sections that are vague, use weak or passive verbs, lack quantifiable impact, or could be rewritten to better showcase skills and accomplishments. 
Do not rewrite the full resume—just list specific suggestions for improvements or mark weak areas with brief explanations.

Resume:
{resume_text}

Suggestions:
"""

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        data=json.dumps({
            "model": "meta-llama/llama-4-scout:free",
            "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
        })
    )

    result = response.json()
    output = result.get('choices', [{}])[0].get('message', {}).get('content', '')
    
    return jsonify({'highlighted_feedback': output})

@app.route('/generate_cover_letter', methods=['POST'])
def generate_cover_letter():
    data = request.get_json()
    resume_text = data.get('resume_text', '')
    job_description = data.get('job_description', '')

    if not resume_text:
        return jsonify({'error': 'Missing resume text'}), 400

    skills_prompt = f"""From the following resume text, extract the top 5–10 technical and soft skills in a comma-separated list:\n\n{resume_text}"""
    skill_response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        data=json.dumps({
            "model": "meta-llama/llama-4-scout:free",
            "messages": [{"role": "user", "content": [{"type": "text", "text": skills_prompt}]}]
        })
    )
    extracted_skills = skill_response.json().get('choices', [{}])[0].get('message', {}).get('content', '')

    if job_description.strip():
        prompt = f"""Using the resume and job description below, generate a professional cover letter:\n\nResume:\n{resume_text}\n\nJob Description:\n{job_description}\n\nTop Skills: {extracted_skills}"""
    else:
        prompt = f"""Generate a general professional cover letter using the following resume:\n\nResume:\n{resume_text}\n\nTop Skills: {extracted_skills}"""

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        },
        data=json.dumps({
            "model": "meta-llama/llama-4-scout:free",
            "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
        })
    )

    letter = response.json().get('choices', [{}])[0].get('message', {}).get('content', '')
    return jsonify({'cover_letter': letter})


if __name__ == '__main__':
    app.run(debug=True, port=5000)