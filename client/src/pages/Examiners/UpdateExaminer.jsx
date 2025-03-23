import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function UpdateExaminer() {
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

  // Fetch examiner data on mount
  useEffect(() => {
    const fetchExaminer = async () => {
      try {
        const res = await axios.get(`/api/examiners/get-ex/${id}`);
        setFormData({ ...res.data, password: "" }); // Don't prefill password
      } catch (error) {
        console.error("Error fetching examiner data", error);
      }
    };
    fetchExaminer();
  }, [id]);

  // Field validations
  const validate = () => {
    const tempErrors = {};
    if (!/^[a-zA-Z. ]+$/.test(formData.name)) tempErrors.name = "Only letters and '.' allowed";
    if (!/^[0-9]{10,}$/.test(formData.phone)) tempErrors.phone = "Must be at least 10 digits";
    if (!/\S+@\S+\.\S+/.test(formData.email)) tempErrors.email = "Invalid email format";
    if (formData.password && formData.password.length < 6) tempErrors.password = "Password must be at least 6 characters";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.put(`/api/examiners/update-ex/${id}`, formData);
      alert("Examiner updated successfully!");
      navigate("/admin-ex-view");
    } catch (error) {
      console.error("Error updating examiner", error);
      alert("Update failed. Please check the inputs and try again.");
    }
  };

  // Input change handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <h2 className="text-3xl font-bold text-center mb-8 text-blue-700">Update Examiner</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Examiner Name</label>
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
          <label className="block text-gray-700 font-semibold mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            pattern="[0-9]*"
            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-400"
            required
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Department Dropdown */}
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
        </div>

        {/* Password (Optional) */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">New Password (Optional)</label>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold transition duration-300"
        >
          Update Examiner
        </button>
      </form>
    </div>
  );
}
