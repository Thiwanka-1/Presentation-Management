import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInFailure, signInStart, signInSuccess } from '../redux/user/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import OAuth from '../components/OAuth';
import axios from 'axios'; // Ensure you have axios imported

export default function SignIn() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { loading, error } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
  
    try {
      dispatch(signInStart());
      const res = await axios.post('/api/auth/signin', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      const data = res.data;
  
      if (data.success === false) {
        dispatch(signInFailure(data));
        return;
      }
    
      //  Ensure role is used correctly
      const userRole = data.role || "user";
      dispatch(signInSuccess(data));
  
      if (userRole === 'admin') {
        navigate('/admin-profile');
      } else if (userRole === 'examiner') {
        navigate('/profile');
      } else if (userRole === 'student') {
        navigate('/student-profile');
      } else {
        console.error("Unknown role:", userRole);
      }
    } catch (error) {
      dispatch(signInFailure(error));
      console.error("Sign In Error:", error);
    }
  };
  
  

  return (
    <div className='p-3 max-w-lg mx-auto'>
      <h1 className='text-3xl text-center font-semibold my-7'>Sign In</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <input
          type='email'
          placeholder='Email'
          id='email'
          className='bg-slate-100 p-3 rounded-lg'
          onChange={handleChange}
        />
        {errors.email && <p className="text-red-500">{errors.email}</p>}
        <div className='relative'>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder='Password'
            id='password'
            className='bg-slate-100 p-3 rounded-lg w-full'
            onChange={handleChange}
          />
          {errors.password && <p className="text-red-500">{errors.password}</p>}
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute inset-y-0 right-3 flex items-center'
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          disabled={loading}
          className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80'
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>
      </form>
      <p className='text-red-700 mt-5'>
        {error ? error.message || 'Something went wrong!' : ''}
      </p>
    </div>
  );
}
