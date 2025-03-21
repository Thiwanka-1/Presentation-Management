import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/solid";
import AvailabilityCheckerModal from "./AvailabilityCheckerModal";

const UpdatePresentation = () => {
  const { id } = useParams(); // Get presentation ID from URL
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [students, setStudents] = useState([]); // All possible students (each with _id, student_id, name)
  const [selectedStudents, setSelectedStudents] = useState([]); // Array of student objects
  const [examiners, setExaminers] = useState([]); // All possible examiners (each with _id, examiner_id, name)
  const [selectedExaminers, setSelectedExaminers] = useState([]); // Array of examiner objects
  const [venues, setVenues] = useState([]); // All possible venues (each with _id, venue_id)
  const [venue, setVenue] = useState(""); // Store the venue's _id
  const [date, setDate] = useState("");
  const [timeRange, setTimeRange] = useState({ startTime: "", endTime: "" });
  const [duration, setDuration] = useState("");
  const [numOfExaminers, setNumOfExaminers] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  const departmentOptions = ["IT", "IM", "ISC", "SE"];

  // Fetch the existing presentation details
  useEffect(() => {
    const fetchPresentationDetails = async () => {
      try {
        const response = await axios.get(`/api/presentations/get-pres/${id}`);
        const pres = response.data;

        setTitle(pres.title);
        setDepartment(pres.department);
        setVenue(pres.venue._id); // <-- Store the venue's _id
        setDate(pres.date);
        setDuration(pres.duration);
        setNumOfExaminers(pres.numOfExaminers);
        setTimeRange({
          startTime: pres.timeRange.startTime,
          endTime: pres.timeRange.endTime
        });

        // Convert each student to { _id, student_id, name }
        const mappedStudents = pres.students.map((student) => ({
          _id: student._id,
          student_id: student.student_id,
          name: student.name
        }));
        setSelectedStudents(mappedStudents);

        // Convert each examiner to { _id, examiner_id, name }
        const mappedExaminers = pres.examiners.map((examiner) => ({
          _id: examiner._id,
          examiner_id: examiner.examiner_id,
          name: examiner.name
        }));
        setSelectedExaminers(mappedExaminers);
      } catch (error) {
        setError("Failed to fetch presentation details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPresentationDetails();
  }, [id]);

  // Fetch students, examiners, and venues based on the selected department
  useEffect(() => {
    if (department) {
      // Fetch all students for this department
      axios
        .get(`/api/students/get-dept/${department}`)
        .then((res) => {
          // Each student => { _id, student_id, name, department }
          setStudents(res.data || []);
        })
        .catch(() => setStudents([]));

      // Fetch all examiners for this department
      axios
        .get(`/api/examiners/get-dept/${department}`)
        .then((res) => {
          // Each examiner => { _id, examiner_id, name, department }
          setExaminers(res.data || []);
        })
        .catch(() => setExaminers([]));

      // Fetch all venues
      axios
        .get("/api/venues/get-ven")
        .then((res) => {
          // Each venue => { _id, venue_id, capacity, ... }
          setVenues(res.data || []);
        })
        .catch(() => setVenues([]));
    }
  }, [department]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Convert selected students and examiners to array of _id
    const studentIds = selectedStudents.map((s) => s._id);
    const examinerIds = selectedExaminers.map((ex) => ex._id);

    // Validation
    if (
      !title ||
      !department ||
      !venue ||
      !date ||
      !duration ||
      !timeRange.startTime ||
      !timeRange.endTime ||
      studentIds.length === 0 ||
      examinerIds.length === 0
    ) {
      setError("All fields are required.");
      return;
    }

    if (examinerIds.length !== parseInt(numOfExaminers)) {
      setError(`Number of examiners must match the specified count (${numOfExaminers}).`);
      return;
    }

    try {
      await axios.put(
        `/api/presentations/update-pres/${id}`,
        {
          title,
          department,
          venue, // This is the venue's _id
          date,
          duration: parseInt(duration),
          numOfExaminers: parseInt(numOfExaminers),
          timeRange: {
            startTime: timeRange.startTime,
            endTime: timeRange.endTime
          },
          // Pass array of ObjectIds
          students: studentIds,
          examiners: examinerIds
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setSuccessMessage("Presentation updated successfully!");
      setTimeout(() => navigate("/admin-pres-view"), 2000);
    } catch (err) {
      console.error("Update Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to update presentation.");
    }
  };

  if (loading) return <div className="text-center text-lg font-semibold">Loading...</div>;

  return (
    <div className="p-6 min-h-screen flex justify-center bg-gray-50">
      <div className="max-w-lg w-full bg-white p-8 shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Update Presentation</h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {successMessage && <p className="text-green-600 text-sm mb-4">{successMessage}</p>}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Presentation Title</label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Department Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Department</label>
            <select
              className="w-full p-2 border rounded-md"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Select a department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Venue Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Venue</label>
            <select
              className="w-full p-2 border rounded-md"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            >
              <option value="">Select a venue</option>
              {venues.map((ven) => (
                <option key={ven._id} value={ven._id}>
                  {ven.venue_id}
                </option>
              ))}
            </select>
          </div>

          {/* Date, Time Range */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Start Time</label>
              <input
                type="time"
                className="w-full p-2 border rounded-md"
                value={timeRange.startTime}
                onChange={(e) => setTimeRange({ ...timeRange, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">End Time</label>
              <input
                type="time"
                className="w-full p-2 border rounded-md"
                value={timeRange.endTime}
                onChange={(e) => setTimeRange({ ...timeRange, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Duration & Number of Examiners */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Duration (minutes)</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Number of Examiners</label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={numOfExaminers}
              onChange={(e) => setNumOfExaminers(e.target.value)}
            />
          </div>

          {/* Students Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Students</label>
            {selectedStudents.map((student, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                  className="w-full p-2 border rounded-md"
                  value={student?._id || ""}
                  onChange={(e) => {
                    const updatedStudents = [...selectedStudents];
                    updatedStudents[index] = students.find((s) => s._id === e.target.value);
                    setSelectedStudents(updatedStudents);
                  }}
                >
                  <option value="">Select a student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.student_id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedStudents(selectedStudents.filter((_, i) => i !== index))}
                >
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSelectedStudents([...selectedStudents, {}])}
              className="text-blue-600 flex items-center"
            >
              <PlusCircleIcon className="w-5 h-5 mr-1" /> Add Student
            </button>
          </div>

          {/* Examiners Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Examiners</label>
            {selectedExaminers.map((examiner, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                  className="w-full p-2 border rounded-md"
                  value={examiner?._id || ""}
                  onChange={(e) => {
                    const updatedExaminers = [...selectedExaminers];
                    updatedExaminers[index] = examiners.find((exam) => exam._id === e.target.value);
                    setSelectedExaminers(updatedExaminers);
                  }}
                >
                  <option value="">Select an examiner</option>
                  {examiners.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.name} ({exam.examiner_id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedExaminers(selectedExaminers.filter((_, i) => i !== index))}
                >
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </div>
            ))}
            {selectedExaminers.length < numOfExaminers && (
              <button
                type="button"
                onClick={() => setSelectedExaminers([...selectedExaminers, {}])}
                className="text-blue-600 flex items-center"
              >
                <PlusCircleIcon className="w-5 h-5 mr-1" /> Add Examiner
              </button>
            )}
          </div>

          {/* Submit & Availability Buttons */}
          <div className="flex justify-between items-center">
            <button type="submit" className="bg-blue-600 text-white p-3 rounded">
              Update Presentation
            </button>
            <button
              type="button"
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="bg-gray-600 text-white p-3 rounded"
            >
              Check Availability
            </button>
          </div>
        </form>
      </div>

      <AvailabilityCheckerModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
      />
    </div>
  );
};

export default UpdatePresentation;
