// MainApp.js
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Login from './Login';
import Signup from './Signup';


import { AuthProvider } from './AuthContext';
import reportWebVitals from './reportWebVitals';
import PrivateRoute from './PrivateRoute';

function MainApp() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
