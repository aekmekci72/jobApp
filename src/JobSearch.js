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
  const [selectedJob, setSelectedJob] = useState(null);

  const userName = localStorage.getItem('userName');

  useEffect(() => {
    if (userName) {
      loadExistingResume();
    }
    axios
      .get('http://localhost:5000/get_company_and_industry_data')
      .then((response) => {
        setCompanyTypes(response.data.company_types);
        setIndustries(response.data.industries);
      })
      .catch((error) => {
        console.error('Error fetching company types and industries:', error);
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

  const handleViewDetails = (job) => {
    setSelectedJob(job);
  };

  const closeModal = () => {
    setSelectedJob(null);
  };

  return (
    <div>
      <Navbar />

      <div className="max-w-5xl mx-auto my-10 p-8 bg-[#fcfcfc] shadow-md rounded-lg font-sans">
        <h2 className="text-2xl font-bold mb-6 text-[#88b1b8]">Job Search by Keywords</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="keywordInput" className="block text-[#88b1b8] font-semibold mb-2">
              Add Keyword
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="keywordInput"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#88b1b8]"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white font-semibold rounded-md transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {keywords.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#88b1b8] mb-2">Keywords</h3>
              <ul className="flex flex-wrap gap-2">
                {keywords.map((keyword, idx) => (
                  <li
                    key={idx}
                    className="bg-[#e6f2f3] text-[#294e52] px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="text-sm text-[#6b8f94] hover:text-red-500"
                    >
                      ✖
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            type="submit"
            className={`px-6 py-2 rounded-md font-semibold transition-colors duration-200 ${
              keywords.length > 0
                ? 'bg-[#88b1b8] hover:bg-[#6b8f94] text-white'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
            disabled={keywords.length === 0}
          >
            Submit
          </button>
        </form>

        {jobs.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-[#88b1b8] mb-4">Job Results</h3>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, idx) => (
                <li
                  key={idx}
                  className="border border-gray-200 rounded-md p-6 bg-[#f9fafa] shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-lg font-bold text-[#294e52] mb-2">{job.title}</h4>
                    <p className="text-sm text-[#294e52] mb-1"><strong>Company:</strong> {job.company_name}</p>
                    <p className="text-sm text-[#294e52] mb-2"><strong>Location:</strong> {job.location}</p>
                  </div>
                  <button
                    onClick={() => handleViewDetails(job)}
                    className="mt-auto text-sm text-white bg-[#88b1b8] hover:bg-[#6b8f94] px-4 py-2 rounded-md font-semibold transition-colors"
                  >
                    View Details
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal for Job Description */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center px-4">
            <div className="bg-white max-w-2xl w-full p-6 rounded-lg shadow-lg overflow-y-auto max-h-[80vh] relative">
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg font-bold"
              >
                &times;
              </button>
              <h4 className="text-xl font-bold text-[#294e52] mb-4">{selectedJob.title}</h4>
              <p className="mb-2"><strong>Company:</strong> {selectedJob.company_name}</p>
              <p className="mb-2"><strong>Location:</strong> {selectedJob.location}</p>
              <div
                className="job-description prose prose-sm sm:prose lg:prose-lg max-w-none text-[#294e52] mt-4 space-y-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedJob.description }}
              ></div>
              <p className="mt-4">
                <a
                  href={selectedJob.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#88b1b8] hover:underline"
                >
                  Apply Here
                </a>
                {selectedJob.company_website && (
                  <>
                    {' | '}
                    <a
                      href={selectedJob.company_website}
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
      </div>
    </div>
  );
};

export default CompanyAndIndustryForm;
