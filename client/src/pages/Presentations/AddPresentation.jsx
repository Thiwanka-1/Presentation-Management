import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { CheckCircleIcon } from "lucide-react"; // Import the icon
import AvailabilityCheckerModal from "./AvailabilityCheckerModal";

const AddPresentation = () => {
  const departments = ["IT", "IM", "SE", "ISC"];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [venues, setVenues] = useState([]);
  
  const [formData, setFormData] = useState({
    title: "",
    students: [""],
    examiners: [],
    venue: "",
    department: "",
    numOfExaminers: "",
    date: "",
    duration: "",
    timeRange: { startTime: "", endTime: "" },
  });

  const [confirmationPopup, setConfirmationPopup] = useState(false);
  
  useEffect(() => {
    fetchVenues();
  }, []);
  
  const fetchVenues = async () => {
    try {
      const response = await axios.get("/api/venues/get-ven");
      setVenues(response.data);
    } catch (error) {
      console.error("Error fetching venues", error);
    }
  };

  const handleDepartmentChange = async (e) => {
    const department = e.target.value;
    setFormData({ ...formData, department });
    
    try {
      const [studentRes, examinerRes] = await Promise.all([
        axios.get(`/api/students/get-dept/${department}`),
        axios.get(`/api/examiners/get-dept/${department}`),
      ]);
      
      setStudents(studentRes.data || []);
      setExaminers(examinerRes.data || []);
      setFormData((prev) => ({
        ...prev,
        students: [""],
        examiners: [],
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      setStudents([]);
      setExaminers([]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSmartSuggest = async () => {
    const { students, numOfExaminers, duration, date } = formData;
  
    const studentIds = students.filter((student) => student);
    
    if (!studentIds.length || !numOfExaminers || !duration || !date) {
      alert("Please fill out all fields before using Smart Suggest.");
      return;
    }
  
    try {
      const response = await axios.post("/api/presentations/smart-suggest-slot", {
        studentIds,
        date,
        numExaminers: numOfExaminers,
        duration,
      });
  
      const { examiners, venue, timeRange } = response.data;
  
      // Set venue and examiner fields
      setFormData({
        ...formData,
        venue: venue._id, // Auto-fill venue
        examiners: examiners.slice(0, numOfExaminers).map(examiner => examiner._id), // Auto-fill examiner IDs
        timeRange,
      });
    } catch (error) {
      console.error("Error fetching smart suggestion", error);
      alert("Failed to get the smart suggestion. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/presentations/add", formData);
      setConfirmationPopup(true);
    } catch (error) {
      console.error("Error adding presentation", error);
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Add Presentation</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Title */}
        <div>
          <label>Presentation Title</label>
          <input
            type="text"
            name="title"
            placeholder="Enter title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Department */}
        <div>
          <label>Department</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleDepartmentChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Students */}
        <div>
  <label>Students</label>
  {formData.students.map((student, index) => (
    <div key={index} className="flex space-x-2 mb-2">
      <select
        value={student}
        onChange={(e) => {
          const newStudents = [...formData.students];
          newStudents[index] = e.target.value; // Store MongoDB `_id`
          setFormData({ ...formData, students: newStudents });
        }}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">Select Student</option>
        {students.map((s) => (
          <option key={s._id} value={s._id}>{s.student_id}</option> 
        ))}
      </select>

      {/* Remove Student Button */}
      {formData.students.length > 1 && (
        <button
          type="button"
          onClick={() => {
            const newStudents = formData.students.filter((_, i) => i !== index);
            setFormData({ ...formData, students: newStudents });
          }}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          −
        </button>
      )}
    </div>
  ))}

  {/* Add Student Button */}
  <button
    type="button"
    onClick={() => {
      setFormData({ ...formData, students: [...formData.students, ""] });
    }}
    className="px-3 py-1 bg-green-500 text-white rounded mt-2"
  >
    +
  </button>
</div>


        {/* Number of Examiners */}
        <div>
          <label>Number of Examiners</label>
          <input
            type="number"
            name="numOfExaminers"
            placeholder="Enter number of examiners"
            value={formData.numOfExaminers}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label>Duration (minutes)</label>
          <input
            type="number"
            name="duration"
            placeholder="Enter duration"
            value={formData.duration}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Smart Suggest Slot Button */}
        <button
          type="button"
          onClick={handleSmartSuggest}
          className="w-full p-3 bg-green-600 text-white rounded font-bold hover:bg-green-700"
        >
          Smart Suggest Slot
        </button>

        {/* Examiners */}
        <div>
  <label>Examiners</label>
  {formData.examiners.map((examiner, index) => (
    <div key={index} className="flex space-x-2 mb-2">
      <select
        value={examiner}
        onChange={(e) => {
          const newExaminers = [...formData.examiners];
          newExaminers[index] = e.target.value; // Store MongoDB `_id`
          setFormData({ ...formData, examiners: newExaminers });
        }}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">Select Examiner</option>
        {examiners.map((ex) => (
          <option key={ex._id} value={ex._id}>{ex.examiner_id}</option> 
        ))}
      </select>

      {/* Remove Examiner Button */}
      {formData.examiners.length > 1 && (
        <button
          type="button"
          onClick={() => {
            const newExaminers = formData.examiners.filter((_, i) => i !== index);
            setFormData({ ...formData, examiners: newExaminers });
          }}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          −
        </button>
      )}
    </div>
  ))}

  {/* Add Examiner Button */}
  {formData.examiners.length < Number(formData.numOfExaminers) && (
    <button
      type="button"
      onClick={() => {
        setFormData({ ...formData, examiners: [...formData.examiners, ""] });
      }}
      className="px-3 py-1 bg-green-500 text-white rounded mt-2"
    >
      +
    </button>
  )}
</div>

        {/* Venue */}
        <div>
          <label>Venue</label>
          <select
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Lecture Hall</option>
            {venues.map((venue) => (
              <option key={venue._id} value={venue._id}>{venue.venue_id}</option> 
            ))}
          </select>
        </div>

        {/* Time Slot */}
        <div>
  <label>Start Time</label>
  <input
    type="time"
    value={formData.timeRange.startTime}
    onChange={(e) =>
      setFormData({
        ...formData,
        timeRange: { ...formData.timeRange, startTime: e.target.value },
      })
    }
    className="w-full p-2 border rounded"
  />

  <label>End Time</label>
  <input
    type="time"
    value={formData.timeRange.endTime}
    onChange={(e) =>
      setFormData({
        ...formData,
        timeRange: { ...formData.timeRange, endTime: e.target.value },
      })
    }
    className="w-full p-2 border rounded"
  />
</div>


<div className="mt-4 flex justify-between items-center">
  {/* Check Availability Button */}
  <button
    type="button"
    className="p-3 bg-gray-500 text-white rounded font-bold hover:bg-gray-600 w-1/2 mr-2"
    onClick={() => setIsModalOpen(true)} // Opens the modal
  >
    Check Availability
  </button>

  {/* Add Presentation Button */}
  <button
    type="submit"
    className="p-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 w-1/2 ml-2"
  >
    Add Presentation
  </button>
</div>

<AvailabilityCheckerModal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)} 
/>

      </form>

      {/* Confirmation Popup */}
      <Modal
  isOpen={confirmationPopup}
  onRequestClose={() => setConfirmationPopup(false)}
  contentLabel="Confirmation"
  className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
>
  <div className="bg-white p-6 rounded shadow-lg text-center max-w-md w-full">
    {/* Success Icon */}
    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />

    {/* Confirmation Message */}
    <h2 className="text-xl font-bold mb-4">Presentation Added Successfully</h2>

    {/* Display Presentation Details with proper alignment */}
    <div className="text-gray-700 text-sm text-left space-y-2">
      <div className="flex justify-between">
        <span className="font-semibold">Date:</span>
        <span>{formData.date}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Venue:</span>
        <span>{venues.find(v => v._id === formData.venue)?.venue_id || "N/A"}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Start Time:</span>
        <span>{formData.timeRange.startTime}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">End Time:</span>
        <span>{formData.timeRange.endTime}</span>
      </div>
      <div>
        <span className="font-semibold">Students:</span>
        <ul className="list-disc list-inside">
          {formData.students.map((id) => (
            <li key={id}>{students.find(s => s._id === id)?.student_id || "N/A"}</li>
          ))}
        </ul>
      </div>
      <div>
        <span className="font-semibold">Examiners:</span>
        <ul className="list-disc list-inside">
          {formData.examiners.map((id) => (
            <li key={id}>{examiners.find(ex => ex._id === id)?.examiner_id || "N/A"}</li>
          ))}
        </ul>
      </div>
    </div>

    {/* Confirm Button */}
    <button
      onClick={() => {
        setConfirmationPopup(false);
        window.location.reload();
      }}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
    >
      Confirm
    </button>
  </div>
</Modal>

    </div>
  );
};

export default AddPresentation;
