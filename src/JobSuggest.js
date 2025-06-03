import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobSuggestionsForm = () => {
  const [resume, setResume] = useState('');
  const [jobs, setJobs] = useState([]);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
      loadExistingResume(storedUserName);
    }
  }, []);
  
  const loadExistingResume = async (username) => {
    try {
      const response = await axios.get('http://localhost:5000/get_resume', {
        params: { username }
      });
      if (response.data.parsed_text) {
        setResume(response.data.parsed_text);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching resume:', error);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resume) {
      alert('Please upload or provide a resume.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/suggest_jobs', { resume });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching job suggestions:', error);
    }
  };
  
  const handleResumeChange = (e) => {
    setResume(e.target.value);
  };

  return (
    <div>
      <h2>Job Suggestions Based on Your Resume</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="resume">Your Resume</label>
          <textarea 
            id="resume"
            value={resume}
            onChange={handleResumeChange}
            rows="10"
            placeholder="Paste your resume text here..."
            style={{ width: '100%', marginBottom: '10px' }}
          />
        </div>
        
        <button type="submit">Get Job Suggestions</button>
      </form>

      {jobs.length > 0 && (
        <div>
          <h3>Job Results</h3>
          <ul>
            {jobs.map((job, idx) => (
              <li key={idx} style={{ marginBottom: '1em', border: '1px solid #eee', padding: '1em' }}>
                <h4>{job.title}</h4>
                <p><strong>Company:</strong> {job.company_name}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Description:</strong> {job.description}</p>
                <p>
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer">Apply Here</a>
                  {job.company_website && (
                    <>
                      {' | '}
                      <a href={job.company_website} target="_blank" rel="noopener noreferrer">Company Website</a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

export default JobSuggestionsForm;
