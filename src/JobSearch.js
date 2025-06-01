import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CompanyAndIndustryForm = () => {
  const [companyTypes, setCompanyTypes] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [selectedCompanyType, setSelectedCompanyType] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/get_company_and_industry_data')
      .then((response) => {
        setCompanyTypes(response.data.company_types);
        setIndustries(response.data.industries);
      })
      .catch((error) => {
        console.error("Error fetching company types and industries:", error);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = {
      company_type: selectedCompanyType,
      industry: selectedIndustry,
    };

    try {
      const response = await axios.post('http://localhost:5000/submit_company_industry', data);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div>
      <h2>Company Type and Industry</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="companyType">Select Company Type</label>
          <select 
            id="companyType"
            value={selectedCompanyType}
            onChange={(e) => setSelectedCompanyType(e.target.value)}
          >
            <option value="">Select Company Type</option>
            <option value="all">All</option>
            {companyTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="industry">Select Industry</label>
          <select 
            id="industry"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
          >
            <option value="">Select Industry</option>
            <option value="all">All</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>{industry.name}</option>
            ))}
          </select>
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
  );
};

export default CompanyAndIndustryForm;
