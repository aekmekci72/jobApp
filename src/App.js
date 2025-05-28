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
  const [editingFields, setEditingFields] = useState({ parsedText: false, coverLetter: false, rewrittenBullets: false });

  useEffect(() => {
    const createFiller = async () => {
      try {
        const response = await axios.post('http://localhost:5000/filler', {
          filler_field: 'dummy value'
        });
        setFillerId(response.data.id);
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

  const toggleEdit = (field) => {
    setEditingFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const containerStyle = {
    maxWidth: '800px',
    margin: '2rem auto',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fafafa',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
  };

  const sectionStyle = {
    marginBottom: '2rem'
  };

  const labelStyle = {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    display: 'block'
  };

  const editableBox = {
    whiteSpace: 'pre-wrap',
    padding: '1em',
    borderRadius: '6px',
    backgroundColor: '#f0f0f0',
    minHeight: '150px',
    border: '1px solid #ccc',
    width: '100%',
    fontFamily: 'inherit'
  };

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <label style={labelStyle}>Upload Resume</label>
        <input type="file" accept=".pdf,.txt" onChange={handleFileChange} />
        <button onClick={handleUploadFile} disabled={!selectedFile} style={{ marginLeft: '1rem' }}>
          Upload & Score
        </button>
      </div>

      {parsedText && (
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Parsed Text <button onClick={() => toggleEdit('parsedText')}>🖉</button>
          </label>
          {editingFields.parsedText ? (
            <textarea
              value={parsedText}
              onChange={(e) => setParsedText(e.target.value)}
              style={editableBox}
            />
          ) : (
            <pre style={editableBox}>{parsedText}</pre>
          )}
        </div>
      )}

      {resumeScore && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Resume Score</label>
          <pre style={{ ...editableBox, backgroundColor: '#eaffea' }}>{resumeScore}</pre>
        </div>
      )}

      {fillerId && (
        <p style={{ fontStyle: 'italic' }}>Filler created with ID: {fillerId}</p>
      )}

      <div style={sectionStyle}>
        <label style={labelStyle}>Job Description</label>
        <textarea
          rows={5}
          placeholder="Paste job description here"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          style={{ ...editableBox, minHeight: '120px' }}
        />
        <button onClick={handleGenerateCoverLetter} disabled={!parsedText} style={{ marginTop: '1rem' }}>
          Generate Cover Letter
        </button>
      </div>

      {coverLetter && (
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Generated Cover Letter <button onClick={() => toggleEdit('coverLetter')}>🖉</button>
          </label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            <button onClick={handleDownload}>📥 Download</button>
          </div>
          {editingFields.coverLetter ? (
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              style={editableBox}
            />
          ) : (
            <pre style={{ ...editableBox, backgroundColor: '#fff0f5' }}>{coverLetter}</pre>
          )}
        </div>
      )}

      <div style={sectionStyle}>
        <label style={labelStyle}>Targeted Resume Improvements</label>
        <button onClick={handleRewriteBullets} disabled={!parsedText}>
          Get Feedback
        </button>
      </div>

      {rewrittenBullets && (
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Rewritten Bullet Points <button onClick={() => toggleEdit('rewrittenBullets')}>🖉</button>
          </label>
          {editingFields.rewrittenBullets ? (
            <textarea
              value={rewrittenBullets}
              onChange={(e) => setRewrittenBullets(e.target.value)}
              style={editableBox}
            />
          ) : (
            <pre style={{ ...editableBox, backgroundColor: '#f9fbe7' }}>{rewrittenBullets}</pre>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
