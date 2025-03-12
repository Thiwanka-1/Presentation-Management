import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";

const AvailabilityCheckerModal = ({ isOpen, onClose }) => {
  const [students, setStudents] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [availabilityResults, setAvailabilityResults] = useState([]);
  const [duration, setDuration] = useState(""); // New state for duration

  const [formData, setFormData] = useState({
    students: [], // Store actual student objects
    examiners: [], // Store actual examiner objects
  });

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await axios.get("/api/venues/get-ven");
        setVenues(response.data);
      } catch (error) {
        console.error("Error fetching venues", error);
      }
    };

    fetchVenues();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedDepartment) {
        try {
          const [studentsResponse, examinersResponse] = await Promise.all([
            axios.get(`/api/students/get-dept/${selectedDepartment}`),
            axios.get(`/api/examiners/get-dept/${selectedDepartment}`)
          ]);
          setStudents(studentsResponse.data);
          setExaminers(examinersResponse.data);
        } catch (error) {
          console.error("Error fetching students or examiners:", error);
        }
      }
    };

    fetchData();
  }, [selectedDepartment]);

  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    setSelectedDepartment(department);
  };

  const handleCheckAvailability = async () => {
  // Extract student and examiner IDs (use correct properties for your data)
  const studentIds = formData.students.map(student => student.student_id); // Use student_id property
  const examinerIds = formData.examiners.map(examiner => examiner.examiner_id); // Use examiner_id property

  try {
    const response = await axios.post('/api/presentations/check-availability', {
      department: selectedDepartment,
      date,
      students: studentIds,  // Pass student IDs
      examiners: examinerIds,  // Pass examiner IDs
      venue,
      duration: duration || 60,
    });


    // Directly set availability in the state based on the raw data
    setAvailabilityResults(response.data);  // Just set the raw data to the state first

    // Check if the state is updated correctly
  } catch (error) {
    console.error("Error checking availability:", error);
  }
};

const handleClose = () => {
    // Reset all state values when the modal is closed
    setSelectedDepartment("");
    setDate("");
    setVenue("");
    setFormData({ students: [], examiners: [] });
    setAvailabilityResults([]);
    setDuration("");
    onClose(); // Close the modal
  };
  
  

  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const year = dateObj.getFullYear();

    const suffix = day === 1 || day === 21 || day === 31 ? 'st' :
                   day === 2 || day === 22 ? 'nd' :
                   day === 3 || day === 23 ? 'rd' : 'th';

    return `${day}${suffix} ${month}, ${year}`;
  };

  return (
    <Modal 
  isOpen={isOpen} 
  onRequestClose={onClose} 
  contentLabel="Check Availability"
  className="fixed inset-0 flex justify-center items-center p-4"
  overlayClassName="fixed inset-0 bg-gray-800 bg-opacity-50"
>
  <div className="bg-white p-6 w-full max-w-lg max-h-[80vh] overflow-auto rounded-lg shadow-lg">
    <h3 className="text-xl font-bold mb-4">Check Availability</h3>

        <div className="mb-4">
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
          <select
            id="department"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Department</option>
            <option value="IT">IT</option>
            <option value="IM">IM</option>
            <option value="SE">SE</option>
            <option value="ISC">ISC</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="venue" className="block text-sm font-medium text-gray-700">Venue</label>
          <select
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a venue</option>
            {venues.length > 0 ? (
              venues.map((venue) => (
                <option key={venue._id} value={venue.venue_id}>
                  {venue.venue_id}
                </option>
              ))
            ) : (
              <option value="">No venues available</option>
            )}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
          />
          {date && (
            <p className="mt-2 text-sm text-gray-600">{formatDate(date)}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
            min="1"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="students" className="block text-sm font-medium text-gray-700">Students</label>
          {formData.students.map((student, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <select
                value={student._id}
                onChange={(e) => {
                  const updatedStudents = [...formData.students];
                  updatedStudents[index] = students.find(s => s._id === e.target.value);
                  setFormData({ ...formData, students: updatedStudents });
                }}
                className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.student_id}
                  </option>
                ))}
              </select>
              {formData.students.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updatedStudents = formData.students.filter((_, i) => i !== index);
                    setFormData({ ...formData, students: updatedStudents });
                  }}
                  className="text-red-600"
                >
                  −
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, students: [...formData.students, ""] })}
            className="text-blue-600"
          >
            + Add Student
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="examiners" className="block text-sm font-medium text-gray-700">Examiners</label>
          {formData.examiners.map((examiner, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <select
                value={examiner._id}
                onChange={(e) => {
                  const updatedExaminers = [...formData.examiners];
                  updatedExaminers[index] = examiners.find(exam => exam._id === e.target.value);
                  setFormData({ ...formData, examiners: updatedExaminers });
                }}
                className="block w-full mt-1 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select an examiner</option>
                {examiners.map((examiner) => (
                  <option key={examiner._id} value={examiner._id}>
                    {examiner.examiner_id}
                  </option>
                ))}
              </select>
              {formData.examiners.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const updatedExaminers = formData.examiners.filter((_, i) => i !== index);
                    setFormData({ ...formData, examiners: updatedExaminers });
                  }}
                  className="text-red-600"
                >
                  −
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, examiners: [...formData.examiners, ""] })}
            className="text-blue-600"
          >
            + Add Examiner
          </button>
        </div>

        {/* Check Availability Button */}
        <div className="flex justify-between items-center">
  <button
    onClick={handleCheckAvailability}
    className="bg-blue-600 text-white p-3 rounded mb-4"
  >
    Check Availability
  </button>

  <button
    onClick={handleClose}
    className="bg-gray-600 text-white p-3 rounded mb-4 min-w-40"
  >
    Close
  </button>
</div>


        {/* Display results */}
        <div>
          {availabilityResults.length > 0 ? (
            availabilityResults.map((result, index) => (
              <div key={index} className="border p-3 mb-3 rounded-md">
                <p className="font-bold">Time Slot: {result.timeSlot}</p>
                <p>Available: {result.available ? 'Yes' : 'No'}</p>
              </div>
            ))
          ) : (
            <p>No available slots found.</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AvailabilityCheckerModal;
