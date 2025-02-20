import { useState } from "react";
import axios from "axios";
import { EyeIcon, EyeOffIcon, CheckCircleIcon } from "lucide-react";

const AddExaminer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
  });

  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);
  const [examinerId, setExaminerId] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" || name === "department") {
      if (!/^[a-zA-Z\s]*$/.test(value)) return;
    }

    if (name === "phone") {
      if (!/^\d{0,10}$/.test(value)) return;
    }

    if (name === "password") {
      if (value.length > 0 && value.length < 8) {
        setError("Password must be at least 8 characters.");
      } else {
        setError("");
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 10) return setError("Phone number must be at least 10 digits.");
    if (formData.password.length < 8) return setError("Password must be at least 8 characters.");

    try {
      const res = await axios.post("/api/examiners/add", formData, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setExaminerId(res.data.examiner_id);
      setSuccessPopup(true);
      setFormData({ name: "", email: "", password: "", phone: "", department: "" });
    } catch (error) {
      setError(error.response?.data?.message || "Error adding examiner.");
    }
  };

  const closePopup = () => {
    setSuccessPopup(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Add Examiner</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter name"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              onChange={handleChange}
              value={formData.name}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              onChange={handleChange}
              value={formData.email}
              required
            />
          </div>
          <div className="relative">
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                placeholder="Min 8 characters"
                className="w-full border rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-400"
                onChange={handleChange}
                value={formData.password}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                {passwordVisible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter phone number"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              onChange={handleChange}
              value={formData.phone}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Department</label>
            <input
              type="text"
              name="department"
              placeholder="Enter department"
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              onChange={handleChange}
              value={formData.department}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 text-lg font-semibold"
          >
            Add Examiner
          </button>
        </form>
      </div>

      {/* Success Popup */}
      {successPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg w-96">
            <CheckCircleIcon size={50} className="text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800">Examiner Added Successfully</h3>
            <p className="text-gray-600 mt-2">
              Examiner ID: <span className="font-bold text-gray-900">{examinerId}</span>
            </p>
            <button
              onClick={closePopup}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddExaminer;
