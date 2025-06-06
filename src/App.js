import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#e6f1f3] flex flex-col items-center justify-center px-6 space-y-10">
            <h2 className="text-4xl font-extrabold text-[#3a5d61] font-poppins">
                Welcome to JobFit Pro
            </h2>
            <div className="flex gap-6">
                <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 bg-[#88b1b8] hover:bg-[#769aa0] text-white rounded-lg font-semibold shadow-md transition duration-200 font-poppins"
                >
                    Log In
                </button>
                <button
                    onClick={() => navigate('/signup')}
                    className="px-8 py-3 border-2 border-[#88b1b8] text-[#3a5d61] rounded-lg font-semibold hover:bg-[#88b1b8] hover:text-white transition duration-200 font-poppins"
                >
                    Sign Up
                </button>
            </div>
        </div>
    );
};

export default Landing;
