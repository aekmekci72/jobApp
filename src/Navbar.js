import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import jobappLogo from './assets/logo.png';


const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userName');
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md font-semibold transition-colors duration-200 ${
      isActive ? 'bg-[#6b8f94] text-white' : 'text-[#88b1b8] hover:bg-[#88b1b8] hover:text-white'
    }`;

  return (
    <nav className="bg-[#fafafa] shadow-md px-6 py-3 flex items-center justify-between font-sans max-w-6xl mx-auto rounded-md my-4">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/home')}>
      <div className="select-none">
      <img src={jobappLogo} alt="JobApp Logo" className="h-16 w-16" />
      </div>
      </div>

      <div className="flex space-x-4">
        <NavLink to="/resumeupload" className={navLinkClass}>
          Resume Upload
        </NavLink>
        <NavLink to="/jobsearch" className={navLinkClass}>
          Job Search
        </NavLink>
        <NavLink to="/jobsuggest" className={navLinkClass}>
          Suggested Jobs
        </NavLink>
      </div>

      <button
        onClick={handleLogout}
        className="ml-4 px-4 py-2 bg-[#88b1b8] hover:bg-[#6b8f94] text-white rounded-md font-semibold transition-colors duration-200"
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;
