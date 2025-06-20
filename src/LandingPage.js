import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Landing = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName');

    return (
        <div>
            <Navbar />

            <div className="w-full flex justify-center mt-12 px-4">
                <div className="max-w-6xl w-full p-8 bg-[#fafafa] rounded-lg shadow-md font-sans text-center">
                    <h1 className="text-5xl font-bold mb-6 text-[#88b1b8]">
                        {userName ? `Welcome, ${userName}!` : 'Welcome to JobApp'}
                    </h1>

                    <p className="max-w-xl mx-auto text-[#3a5d61] text-lg leading-relaxed">
                        JobFit Pro is your personal assistant for crafting standout resumes and cover letters. Upload your resume, get instant feedback, and generate tailored cover letters to land your dream job faster and easier than ever before.
                    </p>

                    {!userName && (
                        <div className="flex justify-center gap-6 mt-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-3 bg-[#88b1b8] hover:bg-[#769aa0] text-white rounded-lg font-semibold shadow-md transition duration-200"
                            >
                                Log In
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="px-8 py-3 border-2 border-[#88b1b8] text-[#3a5d61] rounded-lg font-semibold hover:bg-[#88b1b8] hover:text-white transition duration-200"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Landing;
