import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './config/firebaseSetup';
import axios from 'axios';

const Signup = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            // Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log(user);

            // Call the local API to create user
            await axios.post('http://localhost:5000/create_user', {
                email: email,
                username: username
            });

            navigate("/login");
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode, errorMessage);
            if (errorCode === 'auth/weak-password') {
                setErrorMessage('Password should be at least 6 characters.');
            } else {
                setErrorMessage(errorMessage);
            }
        }
    };

    return (
        <div>
            <div>
                <h2>Create your account</h2>
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
                            autoComplete="new-password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                        Sign up
                    </button>
                </div>
            </form>
            <div>
                <p>
                    Already have an account?{' '}
                    <NavLink to="/login">
                        Sign in
                    </NavLink>
                </p>
            </div>
        </div>
    );
};

export default Signup;
