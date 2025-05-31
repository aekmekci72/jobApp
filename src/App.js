import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h2>Welcome to JobApp</h2>
            <div>
                <button onClick={() => navigate('/login')}>
                    Log In
                </button>
                <button onClick={() => navigate('/signup')}>
                    Sign Up
                </button>
            </div>
        </div>
    );
};

export default Landing;
