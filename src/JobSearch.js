import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

const CompanyAndIndustryForm = () => {
  const [companyTypes, setCompanyTypes] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [selectedCompanyType, setSelectedCompanyType] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [jobs, setJobs] = useState([]);
  const [resume, setResume] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');

  const userName = localStorage.getItem('userName');

  useEffect(() => {
    if (userName) {
      loadExistingResume();
    }
    axios.get('http://localhost:5000/get_company_and_industry_data')
      .then((response) => {
        setCompanyTypes(response.data.company_types);
        setIndustries(response.data.industries);
      })
      .catch((error) => {
        console.error("Error fetching company types and industries:", error);
      });
  }, [userName]);

  const loadExistingResume = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get_resume', {
        params: { username: userName },
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

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = { keywords };

    try {
      const response = await axios.post('http://localhost:5000/submit_company_industry', data);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div>
      <Navbar />

      <div>
        <h2>Job Search by Keywords</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="keywordInput">Add Keyword</label>
            <input
              type="text"
              id="keywordInput"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
            <button type="button" onClick={handleAddKeyword}>Add</button>
          </div>
          <div>
            <h3>Keywords</h3>
            {keywords.length > 0 && (
              <ul>
                {keywords.map((keyword, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                    {keyword}
                    <button type="button" onClick={() => handleRemoveKeyword(keyword)}>✖</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button type="submit">
            Submit
          </button>
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
    </div>
  );
};

export default CompanyAndIndustryForm;
