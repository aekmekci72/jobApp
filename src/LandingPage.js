import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Landing = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName');

    return (
        <div>
            <Navbar />

            <div className="min-h-screen bg-[#e6f1f3] flex flex-col items-center justify-center px-6 space-y-10 font-poppins">
                <h1 className="text-5xl font-extrabold text-[#3a5d61]">
                    {userName ? `Welcome, ${userName}!` : 'Welcome to JobApp'}
                </h1>

                <p className="max-w-xl text-center text-[#3a5d61] text-lg leading-relaxed">
                    JobApp is your personal assistant for crafting standout resumes and cover letters. Upload your resume, get instant feedback, and generate tailored cover letters to land your dream job faster and easier than ever before.
                </p>

                {!userName && (
                    <div className="flex gap-6">
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
    );
};

export default Landing;
