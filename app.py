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
from google.cloud.firestore_v1.base_query import FieldFilter
import time
import re 

load_dotenv()

app = Flask(__name__)
CORS(app)

cred = credentials.Certificate("serviceKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in .env")

CACHE_FILE = 'job_cache.json'
CACHE_TTL = 3600
COMPANY_INDUSTRY_CACHE_FILE = 'company_industry_cache.json'

def load_cache(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return json.load(file)
    return {}

def save_cache(file_path, cache_data):
    with open(file_path, 'w') as file:
        json.dump(cache_data, file)

def fetch_jobs_without_filter():
    job_api_url = "https://jobdataapi.com/api/jobs/"

    response = requests.get(job_api_url)
    
    if response.status_code == 200:
        jobs_data = response.json()
        
        cache = load_cache("job_cache.json")
        cache["unfiltered_jobs"] = {
            "data": jobs_data["results"],
            "timestamp": time.time()
        }
        save_cache(CACHE_FILE, cache) 
        return jobs_data
    else:
        print(f"Error: Unable to fetch jobs. Status code {response.status_code}")
        return None

fetch_jobs_without_filter()

def filter_jobs_from_cache(industry_id=None, company_type_id=None):
    cache = load_cache("job_cache.json")

    if "unfiltered_jobs" not in cache:
        print("No cached jobs available. Fetching unfiltered jobs...")
        return fetch_jobs_without_filter()
    
    cached_data = cache["unfiltered_jobs"]
    timestamp = cached_data["timestamp"]

    if time.time() - timestamp > CACHE_TTL:
        print("Cache expired, fetching new data...")
        del cache["unfiltered_jobs"]
        save_cache(CACHE_FILE, cache)  
        return fetch_jobs_without_filter()
    
    jobs = cached_data["data"]
    
    if industry_id:
        jobs = [job for job in jobs if job.get('industry', {}).get('id') == industry_id]
    
    if company_type_id:
        jobs = [job for job in jobs if job.get('company', {}).get('type_id') == company_type_id]
    
    return jobs

def fetch_jobs(industry_id=None, company_type_id=None):
    jobs = filter_jobs_from_cache(industry_id, company_type_id)
    
    if not jobs: 
        print("Fetching jobs...")
        return fetch_jobs_without_filter()
    
    return jobs


def fetch_company_and_industry_data():
    with app.app_context():
        try:
            company_types_response = requests.get('https://jobdataapi.com/api/companytypes/')
            industries_response = requests.get('https://jobdataapi.com/api/industries/')

            if company_types_response.status_code != 200 or industries_response.status_code != 200:
                return jsonify({'error': 'Failed to fetch data from external APIs'}), 500

            company_types = company_types_response.json()
            industries = industries_response.json()

            cache = load_cache(COMPANY_INDUSTRY_CACHE_FILE)
            cache["company_industry_data"] = {
                "company_types": company_types,
                "industries": industries,
                "timestamp": time.time()
            }
            save_cache(COMPANY_INDUSTRY_CACHE_FILE, cache)

            return {'company_types': company_types, 'industries': industries}
        
        except Exception as e:
            return jsonify({'error': f'Error fetching data: {str(e)}'}), 500

fetch_company_and_industry_data()

def get_cached_company_and_industry_data():
    cache = load_cache(COMPANY_INDUSTRY_CACHE_FILE)

    if "company_industry_data" not in cache:
        print("No cached company/industry data available. Fetching...")
        return fetch_company_and_industry_data()
    
    cached_data = cache["company_industry_data"]
    return cached_data

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


        username = request.form.get('username')
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

@app.route('/get_resume', methods=['GET'])
def get_resume():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username required'}), 400

    resumes = db.collection('parsed_resumes').where('username', '==', username).stream()

    sorted_resumes = sorted(resumes, key=lambda x: x.to_dict().get('timestamp', datetime.min), reverse=True)

    resume = sorted_resumes[0] if sorted_resumes else None
    if resume:
        return jsonify(resume.to_dict())
    else:
        return jsonify({'error': 'No resume found'}), 404


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
        
        username = request.form.get('username')
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

@app.route('/suggest_jobs', methods=['POST'])
def suggest_jobs():
    data = request.get_json()
    resume = data.get('resume', '')
    
    if not resume:
        return jsonify({'error': 'Resume is required'}), 400
     
    keywords = extract_keywords_from_resume(resume)
    print(keywords)
    if not keywords:
        return jsonify({'error': 'Failed to extract keywords from the resume'}), 500

    return fetch_jobs_by_keyword(keywords)


def extract_keywords_from_resume(resume_text):
    prompt = f"""From the following resume text, generate a list of relevant search terms (keywords) that could be used to search for jobs related to the skills and experiences described in the resume. 
    Please follow the format exactly. These should be keywords and skills that are typically associated with job roles based on the resume.

Resume Text: 
{resume_text}

Format:
Search Terms:
- search term 1
- search term 2
- search term 3
- ...

Please provide only the search terms in the specified format. Do not include job titles or any other information.
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
    content = result.get('choices', [{}])[0].get('message', {}).get('content', '')

    search_terms = []

    match = re.findall(r"- (.*)", content)
    for term in match:
        search_terms.append(term.strip())

    return search_terms


def fetch_jobs_by_keyword(keywords):
    cache = load_cache("job_cache.json")
    jobs = []

    if "unfiltered_jobs" in cache:
        jobs = cache["unfiltered_jobs"].get("data", [])
    else:
        return jsonify({"error": "No cached job data available."}), 503
 
    lower_keywords = [kw.lower() for kw in keywords]
    job_relevance_scores = []

    for job in jobs:
        match_count = 0
        
        job_title = job.get("title", "").lower()
        job_description = job.get("description", "").lower()
        
        match_count += sum(1 for kw in lower_keywords if kw in job_title)
        match_count += sum(1 for kw in lower_keywords if kw in job_description)
        
        if match_count > 0:
            job_relevance_scores.append((job, match_count))

    sorted_jobs = sorted(job_relevance_scores, key=lambda x: x[1], reverse=True)

    job_list = []
    for job, _ in sorted_jobs[:5]:
        company = job.get("company", {})
        job_info = {
            "title": job.get("title"),
            "company_name": company.get("name"),
            "company_website": company.get("website_url"),
            "location": job.get("location"),
            "description": job.get("description"),
            "apply_url": job.get("application_url")
        }
        job_list.append(job_info)

    return jsonify({"jobs": job_list})

@app.route('/submit_company_industry', methods=['POST'])
def submit_company_industry():
    data = request.get_json()
    company_type = data.get('company_type', '')
    industry = data.get('industry', '')
    
    if not company_type or not industry:
        return jsonify({'error': 'Company type and industry are required'}), 400
    return fetch_jobs_by_keyword(int(industry), int(company_type))


@app.route('/get_company_and_industry_data', methods=['GET'])
def get_company_and_industry_data():
    try:
        data = get_cached_company_and_industry_data()
        return jsonify(data)

    except Exception as e:
        return jsonify({'error': f'Error fetching data: {str(e)}'}), 500

def fetch_jobs_by_industry_and_type(industry_id, company_type_id, keywords=None):
    print(str(industry_id) + " "+ str(company_type_id))
    cache = load_cache("job_cache.json")
    jobs = []

    if "unfiltered_jobs" in cache:
        jobs = cache["unfiltered_jobs"].get("data", [])
    else:
        return jsonify({"error": "No cached job data available."}), 503
 
    keywords = ["software engineer", "tech"]

    if keywords:
        lower_keywords = [kw.lower() for kw in keywords]
        jobs = [
            job for job in jobs
            if any(kw in job.get("title", "").lower() for kw in lower_keywords) or
               any(kw in job.get("description", "").lower() for kw in lower_keywords)
        ]

    # if industry_id:
    #     jobs = [job for job in jobs if job.get('industry', {}).get('id') == industry_id]
    # if company_type_id:
    #     jobs = [job for job in jobs if job.get('types', {})[0].get('id') == company_type_id]

    job_list = []
    for job in jobs[:5]:
        company = job.get("company", {})
        print(company)
        job_info = {
            # "job_id": job.get("id"),
            "title": job.get("title"),
            "company_name": company.get("name"),
            # "company_logo": company.get("logo"),
            "company_website": company.get("website_url"),
            "location": job.get("location"),
            "description": job.get("description"),
            "apply_url": job.get("application_url") 
        }
        job_list.append(job_info)
    print(str(job_list).encode('ascii', 'ignore').decode('ascii'))

    return jsonify({"jobs": job_list})

    
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