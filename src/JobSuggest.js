import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { select } from '@nextui-org/react';
import Navbar from './Navbar';

const JobSuggestionsForm = () => {
  const [resume, setResume] = useState('');
  const [jobs, setJobs] = useState([]);
  const [userName, setUserName] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFeedback, setResumeFeedback] = useState('');
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

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

  const handleGenerateCoverLetter = async (jobDescription) => {
    try {
      const response = await axios.post('http://localhost:5000/generate_cover_letter', {
        resume_text: resume,
        job_description: jobDescription,
        username: userName,
      });
      setCoverLetter(response.data.cover_letter);
      setIsCoverLetterModalOpen(true);
    } catch (error) {
      console.error('Error generating cover letter:', error);
    }
  };

  const handleGenerateResumeFeedback = async (jobDescription) => {
    try {
      const response = await axios.post('http://localhost:5000/resume_feedback', {
        resume_text: resume,
        username: userName,
        job_description: jobDescription
      });
      setResumeFeedback(response.data.feedback);
      setIsFeedbackModalOpen(true);
    } catch (error) {
      console.error('Error generating resume feedback:', error);
    }
  };

  const handleDownloadCoverLetter = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cover_letter.txt';
    link.click();
  };

  const handleCloseModal = () => {
    setIsCoverLetterModalOpen(false);
    setIsFeedbackModalOpen(false);
  };

  return (
    <div>
      <Navbar />

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
                  <button
                    onClick={() => handleGenerateCoverLetter(job.description)}
                    className="mt-4 px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold transition-colors duration-200"
                  >
                    Write Cover Letter
                  </button>
                  <button
                    onClick={() => handleGenerateResumeFeedback(job.description)}
                    className="mt-4 ml-4 px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold transition-colors duration-200"
                  >
                    Resume Feedback
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isCoverLetterModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-btn" onClick={handleCloseModal}>X</button>
              <h3>Generated Cover Letter</h3>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows="10"
                style={{ width: '100%', marginBottom: '10px' }}
              />
              <div>
                <button onClick={handleDownloadCoverLetter}>Download Cover Letter</button>
                <button onClick={handleCloseModal}>Close</button>
              </div>
            </div>
          </div>
        )}

        {isFeedbackModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-btn" onClick={handleCloseModal}>X</button>
              <h3>Resume Feedback</h3>
              <textarea
                value={resumeFeedback}
                readOnly
                rows="10"
                style={{ width: '100%', marginBottom: '10px' }}
              />
              <button onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSuggestionsForm;
