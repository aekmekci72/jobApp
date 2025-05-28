import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config/firebaseSetup';
import { useAuth } from './AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            login(user.accessToken);
            localStorage.setItem('userName', email);
            navigate("/");
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            if (errorCode === 'auth/invalid-credential') {
                setErrorMessage('Invalid credentials. Please try again.');
            } else {
                setErrorMessage(errorMessage);
            }
        }
    };

    return (
        <div>
            <div>
                <h2>Log in to your account</h2>
            </div>
            <form onSubmit={onSubmit}>
                <input type="hidden" name="remember" defaultValue="true" />
                <div>
                    <div>
                        <label htmlFor="email-address">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {errorMessage && (
                    <div>
                        {errorMessage}
                    </div>
                )}

                <div>
                    <button type="submit">
                        Log in
                    </button>
                </div>
            </form>
            <div>
                <p>
                    Don't have an account?{' '}
                    <NavLink to="/signup">
                        Sign up
                    </NavLink>
                </p>
            </div>
        </div>
    );
};

export default Login;
