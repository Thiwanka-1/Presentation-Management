import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function UpdateStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch existing student data
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await axios.get(`/api/students/get-std/${id}`);
        // Pre-fill form, but leave password blank
        setFormData({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          department: res.data.department || "",
          password: "", // do not expose existing password
        });
      } catch (error) {
        console.error("Error fetching student data", error);
      }
    };
    fetchStudent();
  }, [id]);

  // Validate inputs
  const validate = () => {
    const tempErrors = {};

    // Name: only letters and spaces
    if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      tempErrors.name = "Name can only contain letters and spaces.";
    }

    // Email: basic pattern
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Invalid email format.";
    }

    // Phone: exactly 10 digits
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      tempErrors.phone = "Phone must be exactly 10 digits.";
    }

    // Department: required
    if (!formData.department) {
      tempErrors.department = "Please select a department.";
    }

    // Password: optional, but if provided => min length 6
    if (formData.password && formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await axios.put(`/api/students/update-std/${id}`, formData);
      alert("Student updated successfully!");
      navigate("/admin-students-view"); // Adjust your redirect route
    } catch (error) {
      console.error("Error updating student", error);
      alert("Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">
        Update Student
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            required
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            required
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            required
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Department */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            required
          >
            <option value="" disabled>Select Department</option>
            <option value="IM">IM</option>
            <option value="IT">IT</option>
            <option value="ISC">ISC</option>
            <option value="SE">SE</option>
          </select>
          {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
        </div>

        {/* Password (Optional) */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            New Password (Optional)
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400 pr-10"
              placeholder="Leave blank to keep existing password"
            />
            <span
              className="absolute top-3 right-3 text-gray-600 cursor-pointer text-sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </span>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition duration-300"
        >
          {loading ? "Updating..." : "Update Student"}
        </button>
      </form>
    </div>
  );
}
