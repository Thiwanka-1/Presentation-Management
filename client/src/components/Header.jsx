import { Link } from "react-router-dom";
import { useSelector } from 'react-redux';
import logo from "./logo2.png";
import { useEffect, useRef } from 'react';

export default function Header() {
  const { currentUser } = useSelector((state) => state.user);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //  Ensure role-based profile redirection
  const getProfileLink = () => {
    if (!currentUser) return '/sign-in';
    if (currentUser.role === 'admin') return '/admin-profile';
    if (currentUser.role === 'examiner') return '/profile';
    if (currentUser.role === 'student') return '/student-profile';
    return '/profile'; // Default fallback
  };

  return (
    <div className="bg-slate-200">
      <div className="flex justify-between items-center max-w-full mx-auto py-2 px-9">
        {/* Left Section: Logo */}
        <div className="flex items-center space-x-1">
          <Link to='/'>
            <img src={logo} alt="Appointment Logo" className="h-14 mt-2" />
          </Link>
        </div>

        {/* Right Section: Navigation Links */}
        <ul className='flex gap-3 items-center'>
          {currentUser ? (
            <>
              {currentUser.role === 'admin' ? (
                <>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/admin-pres-view">View Presentations</Link></li>
                  <li><Link to="/reschedule-req">View Requests</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/user-req">View Requests</Link></li>
                </>
              )}

              {/* Profile Picture & Role-based Navigation */}
              <li>
                <Link to={getProfileLink()}>
                  <img
                    src={currentUser.profilePicture}
                    alt='profile'
                    className='h-8 w-8 rounded-full object-cover'
                  />
                </Link>
              </li>
            </>
          ) : (
            <li><Link to='/sign-in'>Sign In</Link></li>
          )}
        </ul>
      </div>
    </div>
  );
}
