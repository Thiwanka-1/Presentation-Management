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

  // Fetch existing examiner data
  useEffect(() => {
    const fetchExaminer = async () => {
      try {
        const res = await axios.get(`/api/examiners/get-ex/${id}`);
        setFormData(res.data);
      } catch (error) {
        console.error("Error fetching examiner data", error);
      }
    };
    fetchExaminer();
  }, [id]);

  // Validation rules
  const validate = () => {
    let tempErrors = {};
    if (!/^[a-zA-Z. ]+$/.test(formData.name)) tempErrors.name = "Only letters and '.' allowed";
    if (!/^[0-9]{10,}$/.test(formData.phone)) tempErrors.phone = "Must be at least 10 digits";
    if (!formData.email.includes("@")) tempErrors.email = "Invalid email format";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.put(`/api/examiners/update-ex/${id}`, formData);
      alert("Examiner updated successfully!");
      navigate("/admin-ex-view"); // Redirect after success
    } catch (error) {
      console.error("Error updating examiner", error);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-md mt-10">
      <h2 className="text-2xl font-semibold text-center mb-5">Update Examiner</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Examiner Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input
            type="number"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
        </div>
        
        <div>
  <label className="block text-sm font-medium">Department</label>
  <select
    name="department"
    value={formData.department}
    onChange={handleChange}
    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
    required
  >
    <option value="" disabled>Select Department</option>
    <option value="IM">IM</option>
    <option value="IT">IT</option>
    <option value="ISC">ISC</option>
    <option value="SE">SE</option>
  </select>
</div>

        
        <div>
          <label className="block text-sm font-medium">New Password (Optional)</label>
          <input
            type="password"
            name="password"
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
        >
          Update Examiner
        </button>
      </form>
    </div>
  );
}
