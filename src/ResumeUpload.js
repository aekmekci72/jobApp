import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

const ResumeUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedText, setParsedText] = useState('');
  const [resumeScore, setResumeScore] = useState('');
  const [fillerId, setFillerId] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [topSkills, setTopSkills] = useState('');
  const [rewrittenBullets, setRewrittenBullets] = useState('');
  const [editingFields, setEditingFields] = useState({
    parsedText: false,
    coverLetter: false,
    rewrittenBullets: false,
  });
  const userName = localStorage.getItem('userName');

  useEffect(() => {
    if (userName) {
      loadExistingResume();
    }
  }, [userName]);

  const loadExistingResume = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_resume', {
        params: { username: userName },
      });
      if (response.data.parsed_text) {
        setParsedText(response.data.parsed_text);
        getResumeScore(response.data.parsed_text);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error fetching resume:', error);
      }
    }
  };

  const getResumeScore = async (resumeText) => {
    try {
      const fileBlob = new Blob([resumeText], { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', fileBlob, 'resume.txt');
      formData.append('username', userName);

      const response = await axios.post('http://localhost:5000/score_resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResumeScore(response.data.resume_score);
    } catch (error) {
      console.error('Error scoring resume text:', error);
    }
  };


  const handleGenerateCoverLetter = async () => {
    try {
      console.log(userName);
      const response = await axios.post('http://localhost:5000/generate_cover_letter', {
        resume_text: parsedText,
        job_description: jobDescription,
        username: userName,
      });
      setCoverLetter(response.data.cover_letter);
    } catch (err) {
      console.error('Cover letter error:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cover_letter.txt';
    link.click();
  };

  const handleRewriteBullets = async () => {
    try {
      const response = await axios.post('http://localhost:5000/rewrite_bullets', {
        resume_text: parsedText,
      });
      setRewrittenBullets(response.data.highlighted_feedback);
    } catch (err) {
      console.error('Rewrite bullets error:', err);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setParsedText('');
    setResumeScore('');
  };

  const handleUploadFile = async () => {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('username', userName);

    try {
      const response = await axios.post('http://localhost:5000/score_resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setParsedText(response.data.parsed_text);
      setResumeScore(response.data.resume_score);
    } catch (error) {
      console.error('Error scoring resume:', error);
    }
  };

  const toggleEdit = (field) => {
    setEditingFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl w-full mx-auto my-8 p-8 bg-[#fafafa] rounded-lg shadow-md font-sans">

        {/* Upload Section */}
        <div className="mb-8">
          <label className="block font-semibold mb-2 text-[#88b1b8]">Upload Resume</label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="block mb-3"
          />
          <button
            onClick={handleUploadFile}
            disabled={!selectedFile}
            className={`ml-2 px-4 py-2 rounded-md font-semibold transition-colors duration-200
            ${selectedFile ? 'bg-[#88b1b8] hover:bg-[#6b8f94] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          >
            Upload & Score
          </button>
        </div>

        {/* Parsed Text */}
        {parsedText && (
          <div className="mb-8">
            <label className="block font-semibold mb-2 text-[#88b1b8] flex items-center justify-between">
              Parsed Text
              <button
                onClick={() => toggleEdit('parsedText')}
                className="text-[#88b1b8] hover:text-[#6b8f94] transition-colors"
                aria-label="Edit Parsed Text"
                title="Edit Parsed Text"
              >
                🖉
              </button>
            </label>
            {editingFields.parsedText ? (
              <textarea
                value={parsedText}
                onChange={(e) => setParsedText(e.target.value)}
                className="w-full min-h-[150px] p-4 rounded-md border border-gray-300 bg-gray-100 font-mono whitespace-pre-wrap"
              />
            ) : (
              <pre className="w-full min-h-[150px] p-4 rounded-md border border-gray-300 bg-gray-100 font-mono whitespace-pre-wrap">
                {parsedText}
              </pre>
            )}
          </div>
        )}

        {/* Resume Score */}
        {resumeScore && (
          <div className="mb-8">
            <label className="block font-semibold mb-2 text-[#88b1b8]">Resume Score</label>
            <pre className="w-full p-4 rounded-md border border-green-400 bg-green-100 font-mono whitespace-pre-wrap">
              {resumeScore}
            </pre>
          </div>
        )}

        {/* Filler ID */}
        {fillerId && (
          <p className="italic mb-8">Filler created with ID: {fillerId}</p>
        )}

        {/* Job Description */}
        <div className="mb-8">
          <label className="block font-semibold mb-2 text-[#88b1b8]">Job Description</label>
          <textarea
            rows={5}
            placeholder="Paste job description here"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full min-h-[120px] p-4 rounded-md border border-gray-300 bg-gray-100 font-mono"
          />
          <button
            onClick={handleGenerateCoverLetter}
            disabled={!parsedText}
            className={`mt-4 px-4 py-2 rounded-md font-semibold transition-colors duration-200
            ${parsedText ? 'bg-[#88b1b8] hover:bg-[#6b8f94] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          >
            Generate Cover Letter
          </button>
        </div>

        {/* Cover Letter */}
        {coverLetter && (
          <div className="mb-8">
            <label className="block font-semibold mb-2 text-[#88b1b8] flex items-center justify-between">
              Generated Cover Letter
              <button
                onClick={() => toggleEdit('coverLetter')}
                className="text-[#88b1b8] hover:text-[#6b8f94] transition-colors"
                aria-label="Edit Cover Letter"
                title="Edit Cover Letter"
              >
                🖉
              </button>
            </label>
            <div className="flex gap-4 mb-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold transition-colors duration-200"
              >
                Download
              </button>
            </div>
            {editingFields.coverLetter ? (
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full min-h-[150px] p-4 rounded-md border border-gray-300 bg-[#fff0f5] font-mono whitespace-pre-wrap"
              />
            ) : (
              <pre className="w-full min-h-[150px] p-4 rounded-md border border-gray-300 bg-[#fff0f5] font-mono whitespace-pre-wrap">
                {coverLetter}
              </pre>
            )}
          </div>
        )}

        {/* Targeted Resume Improvements */}
        <div className="mb-8">
          <label className="block font-semibold mb-2 text-[#88b1b8]">Targeted Resume Improvements</label>
          <button
            onClick={handleRewriteBullets}
            disabled={!parsedText}
            className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200
            ${parsedText ? 'bg-[#88b1b8] hover:bg-[#6b8f94] text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          >
            Get Feedback
          </button>
        </div>

        {/* Rewritten Bullets */}
        {rewrittenBullets && (
          <div className="mb-8">
            <label className="block font-semibold mb-2 text-[#88b1b8]">
              Rewritten Bullet Points
            </label>
            <pre className="w-full min-h-[150px] p-4 rounded-md border border-gray-300 bg-[#f9fbe7] font-mono whitespace-pre-wrap">
              {rewrittenBullets}
            </pre>
          </div>
        )}


      </div>
    </div>
  );
};

export default ResumeUpload;
