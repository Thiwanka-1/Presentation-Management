import { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import autoTable from "jspdf-autotable"; // Ensure autoTable is correctly imported

const ViewModules = () => {
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get("/api/modules/all");
      setModules(response.data);
      setFilteredModules(response.data);
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search function
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = modules.filter(
      (module) =>
        module.module_code.toLowerCase().includes(term) ||
        module.module_name.toLowerCase().includes(term) ||
        module.department.toLowerCase().includes(term)
    );

    setFilteredModules(filtered);
  };

  // Handle delete function with confirmation
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this module?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`/api/modules/delete/${id}`);
      setModules(modules.filter((module) => module._id !== id));
      setFilteredModules(filteredModules.filter((module) => module._id !== id));
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  };

  // Generate PDF Report
  const handlePDFGeneration = () => {
    if (filteredModules.length === 0) {
      alert("No data available to generate a report.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Modules Report", 10, 10);

    const headers = ["Module Code", "Module Name", "Department", "Lecturer"];
    const rows = filteredModules.map((module) => [
      module.module_code,
      module.module_name,
      module.department,
      module.lecturer_in_charge.name || "N/A",
    ]);

    autoTable(doc,{
      head: [headers],
      body: rows,
      startY: 20,
      theme: "grid",
    });

    doc.save("modules_report.pdf");
  };

  if (loading) return <div className="text-center text-lg font-semibold">Loading...</div>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Modules</h1>

        {/* Search & Report Buttons */}
        <div className="flex flex-wrap justify-between items-center mb-4">
          <input
            type="text"
            className="p-2 border rounded-md w-full sm:w-auto"
            placeholder="Search by Module Code, Name, or Department"
            value={searchTerm}
            onChange={handleSearch}
          />
          <button
            onClick={handlePDFGeneration}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md sm:ml-4 mt-2 sm:mt-0"
          >
            Generate Report (PDF)
          </button>
        </div>

        {/* Modules Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg p-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Module Code</th>
                <th className="border border-gray-300 px-4 py-2">Module Name</th>
                <th className="border border-gray-300 px-4 py-2">Department</th>
                <th className="border border-gray-300 px-4 py-2">Lecturer</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.length > 0 ? (
                filteredModules.map((module) => (
                  <tr key={module._id} className="text-center bg-white hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{module.module_code}</td>
                    <td className="border border-gray-300 px-4 py-2">{module.module_name}</td>
                    <td className="border border-gray-300 px-4 py-2">{module.department}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {module.lecturer_in_charge.name || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() => navigate(`/update-module/${module._id}`)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md mr-2"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDelete(module._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center px-4 py-2 border-b">
                    No modules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewModules;
