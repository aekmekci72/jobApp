import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config/firebaseSetup';
import { useAuth } from './AuthContext';

const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            login(user.accessToken);
            localStorage.setItem('userName', email);

            navigate("/resumeupload");
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            if (errorCode === 'auth/weak-password') {
                setErrorMessage('Password should be at least 6 characters.');
            } else {
                setErrorMessage(errorMessage);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#e6f1f3] flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 space-y-6">
                <div>
                    <h2 className="text-center text-2xl font-bold text-[#3a5d61]">
                        Create your account
                    </h2>
                </div>
                <form onSubmit={onSubmit} className="space-y-5">
                    <input type="hidden" name="remember" defaultValue="true" />

                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-[#3a5d61]">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            placeholder="Your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-[#88b1b8] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#88b1b8]"
                        />
                    </div>

                    <div>
                        <label htmlFor="email-address" className="block text-sm font-medium text-[#3a5d61]">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-[#88b1b8] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#88b1b8]"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#3a5d61]">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full px-4 py-2 border border-[#88b1b8] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#88b1b8]"
                        />
                    </div>

                    {errorMessage && (
                        <div className="text-sm text-red-600 font-medium">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-[#88b1b8] hover:bg-[#769aa0] text-white font-semibold rounded-lg shadow-md transition duration-200"
                        >
                            Sign up
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm text-[#3a5d61]">
                    Already have an account?{' '}
                    <NavLink to="/login" className="text-[#88b1b8] hover:underline font-medium">
                        Sign in
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default Signup;
