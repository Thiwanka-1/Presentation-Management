import { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";

const AdminViewPresentations = () => {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState([]);
  const [filteredPresentations, setFilteredPresentations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [presentationToDelete, setPresentationToDelete] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  // Fetch presentations from the backend
  useEffect(() => {
    const fetchPresentations = async () => {
      try {
        const response = await axios.get("/api/presentations/get-pres");
        setPresentations(response.data);
        setFilteredPresentations(response.data);
      } catch (error) {
        console.error("Error fetching presentations:", error);
      }
    };

    fetchPresentations();
  }, []);

  // Update the current time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/presentations/delete-pres/${presentationToDelete}`);
      setPresentations(presentations.filter((p) => p._id !== presentationToDelete));
      setFilteredPresentations(filteredPresentations.filter((p) => p._id !== presentationToDelete));
      setDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting presentation:", error);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
  
    const filtered = presentations.filter((presentation) =>
      presentation.students.some((student) =>
        student.student_id.includes(term)
      ) ||
      presentation.examiners.some((examiner) =>
        examiner.examiner_id.includes(term)
      ) ||
      presentation.department.toLowerCase().includes(term.toLowerCase()) ||
      (presentation.venue && presentation.venue.venue_id.toLowerCase().includes(term.toLowerCase())) // Add venue filtering for location
    );
  
    setFilteredPresentations(filtered);
  };
  

  const handleFilterDate = (e) => {
    const selectedDate = e.target.value;
    setFilterDate(selectedDate);
  
    // If the selected date is empty (cleared), show all presentations
    if (!selectedDate) {
      setFilteredPresentations(presentations); // Reset to all presentations
    } else {
      const filteredByDate = presentations.filter((presentation) =>
        presentation.date === selectedDate
      );
      setFilteredPresentations(filteredByDate);
    }
  };
  

  const handlePDFGeneration = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("AutoSched Presentation Report", 10, 10);

    // Create a table of presentations
    const headers = ["Title", "Date", "Department", "Time Range", "Duration", "Examiners", "Students", "Venue"]; // Add 'Venue' here
    const rows = filteredPresentations.map((presentation) => [
        presentation.title,
        presentation.date,
        presentation.department,
        `${presentation.timeRange.startTime} - ${presentation.timeRange.endTime}`,
        `${presentation.duration} mins`,
        presentation.examiners.map((examiner) => examiner.examiner_id).join(", "),
        presentation.students.map((student) => student.student_id).join(", "),
        presentation.venue?.venue_id || "No Venue", // Access location or show fallback text if venue is unavailable
      ]);
      
    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      theme: 'grid',
    });

    doc.save("all_presentations_report.pdf");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="absolute right-6 text-xl font-semibold text-gray-800">
          <div>{currentTime}</div>
        </div>
        <h1 className="text-3xl font-bold mb-6 text-center">Presentation List</h1>

        {/* Search and Filter */}
        <div className="mb-4 flex flex-wrap justify-between items-center">
          <input
            type="text"
            className="p-2 border rounded mb-2 sm:mr-4 sm:mb-0 w-full sm:w-auto"
            placeholder="Search by Student ID, Examiner ID, or Department"
            value={searchTerm}
            onChange={handleSearch}
          />
          <input
            type="date"
            className="p-2 border rounded w-full sm:w-auto"
            value={filterDate}
            onChange={handleFilterDate}
          />
          <button
            onClick={handlePDFGeneration}
            className="bg-blue-600 text-white p-2 rounded ml-4 mt-2 sm:mt-0"
          >
            Generate Report (PDF)
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto shadow-xl sm:rounded-lg mt-6">
          <table className="min-w-full table-auto bg-white rounded-lg shadow-lg">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-medium">Title</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Department</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Time Range</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Venue</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Students</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Examiners</th>
                <th className="px-10 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPresentations.map((presentation) => (
                <tr key={presentation._id} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-4 text-sm">{presentation.title}</td>
                  <td className="px-6 py-4 text-sm">{presentation.date}</td>
                  <td className="px-6 py-4 text-sm">{presentation.department}</td>
                  <td className="px-6 py-4 text-sm">{`${presentation.timeRange.startTime} - ${presentation.timeRange.endTime}`}</td>
                  <td className="px-6 py-4 text-sm">{presentation.duration} mins</td>
                  <td className="px-6 py-4 text-sm">{presentation.venue?.venue_id}</td>

                  <td className="px-6 py-4 text-sm">
                    {presentation.students.map((student, index) => (
                        <div key={index}>{student.student_id}</div>
                    ))}
                    </td>

                  <td className="px-6 py-4 text-sm">
                    {presentation.examiners.map((examiner, index) => (
                      <div key={index}>{examiner.examiner_id}</div>
                    ))}
                  </td>
                  <td className="px-3 py-4 text-sm flex space-x-2">
                   
                    <button
                      onClick={() => navigate(`/presentation-update/${presentation._id}`)}
                      className="bg-blue-500 text-white py-1 px-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setPresentationToDelete(presentation._id);
                        setDeleteConfirmation(true);
                      }}
                      className="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation */}
        {deleteConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
              <p>Are you sure you want to delete this presentation?</p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setDeleteConfirmation(false)}
                  className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white py-2 px-4 rounded-lg ml-4 hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminViewPresentations;
