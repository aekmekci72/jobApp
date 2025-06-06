import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';

const JobSuggestionsForm = () => {
  const [resume, setResume] = useState('');
  const [jobs, setJobs] = useState([]);
  const [userName, setUserName] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFeedback, setResumeFeedback] = useState('');
  const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [direction, setDirection] = useState(0);

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
        params: { username },
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
      setCurrentJobIndex(0);
    } catch (error) {
      console.error('Error fetching job suggestions:', error);
    }
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
        job_description: jobDescription,
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
    setIsJobDescriptionModalOpen(false);
  };

const swipeLeft = () => {
  if (currentJobIndex < jobs.length - 1) {
    setDirection(1);
    setCurrentJobIndex((prev) => prev + 1);
  }
};

const swipeRight = () => {
  if (currentJobIndex > 0) {
    setDirection(-1);
    setCurrentJobIndex((prev) => prev - 1);
  }
};

  const currentJob = jobs[currentJobIndex];

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      <div className="max-w-5xl mx-auto my-10 p-8 bg-[#fcfcfc] shadow-md rounded-lg font-sans">
        <h2 className="text-2xl font-bold mb-4">Job Suggestions Based on Your Resume</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="resume" className="block font-semibold mb-1">Your Resume</label>
            <textarea
              id="resume"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              rows="8"
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="Paste your resume text here..."
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold">
            Get Job Suggestions
          </button>
        </form>

        {currentJob && (
          <div className="mt-8 relative">
<AnimatePresence mode="wait">
  <motion.div
    key={currentJobIndex}
    initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
    transition={{ duration: 0.4 }}
    className="p-8 bg-white rounded-xl shadow-md border border-gray-200"
  >
                <h4 className="text-xl font-bold mb-1">{currentJob.title}</h4>
                <p className="mb-1"><strong>Company:</strong> {currentJob.company_name}</p>
                <p className="mb-1"><strong>Location:</strong> {currentJob.location}</p>
                <button
                  onClick={() => setIsJobDescriptionModalOpen(true)}
                  className="text-[#88b1b8] underline text-sm mb-2"
                >
                  View Full Description
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleGenerateCoverLetter(currentJob.description)}
                    className="px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold"
                  >
                    Write Cover Letter
                  </button>
                  <button
                    onClick={() => handleGenerateResumeFeedback(currentJob.description)}
                    className="px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold"
                  >
                    Resume Feedback
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-between mt-4">
              <button onClick={swipeRight} disabled={currentJobIndex === 0} className="text-sm text-gray-600 hover:text-black">← Previous</button>
              <button onClick={swipeLeft} disabled={currentJobIndex === jobs.length - 1} className="text-sm text-gray-600 hover:text-black">Next →</button>
            </div>
          </div>
        )}

{isJobDescriptionModalOpen && currentJob && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center px-4">
    <div className="bg-white max-w-2xl w-full p-6 rounded-lg shadow-lg overflow-y-auto max-h-[80vh] relative">
      <button
        onClick={handleCloseModal}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg font-bold"
        aria-label="Close modal"
      >
        &times;
      </button>
      <h4 className="text-xl font-bold text-[#294e52] mb-4">{currentJob.title}</h4>
      <div
        className="job-description prose prose-sm sm:prose lg:prose-lg max-w-none text-[#294e52] mt-4 space-y-4 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: currentJob.description }}
      ></div>
      <p className="mt-4">
        <a
          href={currentJob.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#88b1b8] hover:underline"
        >
          Apply Here
        </a>
        {currentJob.company_website && (
          <>
            {' | '}
            <a
              href={currentJob.company_website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#88b1b8] hover:underline"
            >
              Company Website
            </a>
          </>
        )}
      </p>
    </div>
  </div>
)}

{isCoverLetterModalOpen && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center px-4">
    <div className="bg-white max-w-2xl w-full p-6 rounded-lg shadow-lg overflow-y-auto max-h-[80vh] relative">
      <button
        onClick={handleCloseModal}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg font-bold"
        aria-label="Close modal"
      >
        &times;
      </button>
      <h4 className="text-xl font-bold text-[#294e52] mb-4">Generated Cover Letter</h4>
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        rows={10}
        className="w-full mb-4 p-2 border border-gray-300 rounded resize-y focus:outline-none focus:ring-2 focus:ring-[#88b1b8]"
      />
      <div className="flex gap-4">
        <button
          onClick={handleDownloadCoverLetter}
          className="px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold transition"
        >
          Download Cover Letter
        </button>
      </div>
    </div>
  </div>
)}
{isFeedbackModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-xl w-[90%] max-h-[70vh] p-6 flex flex-col relative">
      <button
        onClick={handleCloseModal}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg font-bold"
        aria-label="Close modal"
      >
        ×
      </button>
      <h3 className="text-xl font-semibold mb-4">Resume Feedback</h3>
      <textarea
        value={resumeFeedback}
        readOnly
        rows={10}
        className="w-full mb-4 resize-none overflow-y-auto text-gray-700 p-3 border border-gray-300 rounded-md flex-grow"
      />
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default JobSuggestionsForm;