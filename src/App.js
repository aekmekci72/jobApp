import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedText, setParsedText] = useState('');
  const [resumeScore, setResumeScore] = useState('');
  const [fillerId, setFillerId] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [topSkills, setTopSkills] = useState('');
  const [rewrittenBullets, setRewrittenBullets] = useState('');
  const [bulletInput, setBulletInput] = useState('');

  useEffect(() => {
    const createFiller = async () => {
      try {
        const response = await axios.post('http://localhost:5000/filler', {
          filler_field: 'dummy value'
        });
        setFillerId(response.data.id);
        console.log('Filler created:', response.data);
      } catch (error) {
        console.error('Error creating filler:', error);
      }
    };

    createFiller();
  }, []);

const handleGenerateCoverLetter = async () => {
  try {
    const response = await axios.post('http://localhost:5000/generate_cover_letter', {
      resume_text: parsedText,
      job_description: jobDescription
    });
    setCoverLetter(response.data.cover_letter);
  } catch (err) {
    console.error('Cover letter error:', err);
  }
};

const handleExtractSkills = async () => {
  try {
    const response = await axios.post('http://localhost:5000/extract_top_skills', {
      resume_text: parsedText
    });
    setTopSkills(response.data.top_skills);
  } catch (err) {
    console.error('Skills error:', err);
  }
};

const handleRewriteBullets = async () => {
  try {
    const response = await axios.post('http://localhost:5000/rewrite_bullets', {
      resume_text: parsedText
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

    try {
      const response = await axios.post('http://localhost:5000/score_resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setParsedText(response.data.parsed_text);
      setResumeScore(response.data.resume_score);
    } catch (error) {
      console.error('Error scoring resume:', error);
    }
  };

return (
  <div>
    <input type="file" accept=".pdf,.txt" onChange={handleFileChange} />
    <button onClick={handleUploadFile} disabled={!selectedFile}>
      Upload File & Score
    </button>

    {parsedText && (
      <>
        <h3>Parsed Text</h3>
        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f4f4f4', padding: '1em' }}>
          {parsedText}
        </pre>
      </>
    )}

    {resumeScore && (
      <>
        <h3>Resume Score</h3>
        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#e6ffe6', padding: '1em' }}>
          {resumeScore}
        </pre>
      </>
    )}

    {fillerId && <p style={{ fontStyle: 'italic' }}>Filler created with ID: {fillerId}</p>}

    {/* Job Description Input */}
    <h3>Job Description</h3>
    <textarea
      rows={5}
      cols={60}
      placeholder="Paste job description here"
      value={jobDescription}
      onChange={(e) => setJobDescription(e.target.value)}
      style={{ marginBottom: '1em' }}
    />

    <button
      onClick={handleGenerateCoverLetter}
      disabled={!parsedText}
      style={{ marginBottom: '1em' }}
    >
      Generate Cover Letter
    </button>

    {/* Cover Letter Output */}
    {coverLetter && (
      <>
        <h3>Generated Cover Letter</h3>
        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#fff0f5', padding: '1em' }}>
          {coverLetter}
        </pre>
      </>
    )}

    {/* Rewrite Bullets Input */}
    <h3>Targeted Improvements</h3>
    <textarea
      rows={6}
      cols={60}
      placeholder="Enter bullet points (one per line)"
      value={bulletInput}
      onChange={(e) => setBulletInput(e.target.value)}
      style={{ marginBottom: '1em' }}
    />
    <button
      onClick={handleRewriteBullets}
      disabled={!parsedText}
      style={{ marginBottom: '1em' }}
    >
      Get Feedback
    </button>

    {/* Rewritten Bullets Output */}
    {rewrittenBullets && (
      <>
        <h3>Rewritten Bullet Points</h3>
        <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9fbe7', padding: '1em' }}>
          {rewrittenBullets}
        </pre>
      </>
    )}
  </div>
);
}
export default App;