import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function UpdateTimetable() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [modules, setModules] = useState([]);
  const [examiners, setExaminers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch data for dropdowns and existing timetable
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, moduleRes, examinerRes, venueRes, timetableRes] = await Promise.all([
          axios.get("/api/groups/all"),
          axios.get("/api/modules/all"),
          axios.get("/api/examiners/get-ex"),
          axios.get("/api/venues/get-ven"),
          axios.get(`/api/timetables/getid/${id}`), // ✅ Fetch existing timetable
        ]);

        setGroups(groupRes.data);
        setModules(moduleRes.data);
        setExaminers(examinerRes.data);
        setVenues(venueRes.data);

        // ✅ Pre-fill existing timetable data
        setSelectedGroup(timetableRes.data.group_id);
        setSchedule(timetableRes.data.schedule);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("Failed to load timetable data.");
      }
    };
    fetchData();
  }, [id]);

  // Handle adding a new lecture
  const addLecture = (dayIndex) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[dayIndex].lectures.push({
      start_time: "",
      end_time: "",
      module_code: "",
      lecturer_id: "",
      venue_id: "",
    });
    setSchedule(updatedSchedule);
  };

  // Handle removing a lecture
  const removeLecture = (dayIndex, lectureIndex) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[dayIndex].lectures.splice(lectureIndex, 1);
    setSchedule(updatedSchedule);
  };

  // Handle lecture input changes
  const handleLectureChange = (dayIndex, lectureIndex, field, value) => {
    const updatedSchedule = [...schedule];

    if (field === "start_time") {
      const startTime = value;
      const minTime = "08:00";
      const maxTime = "18:00";

      if (startTime < minTime || startTime > maxTime) {
        setErrors({ [`start_time_${dayIndex}_${lectureIndex}`]: "Start time must be between 08:00 and 18:00" });
        return;
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, [`start_time_${dayIndex}_${lectureIndex}`]: null }));
      }

      updatedSchedule[dayIndex].lectures[lectureIndex].end_time = "";
    }

    if (field === "end_time") {
      const endTime = value;
      const startTime = updatedSchedule[dayIndex].lectures[lectureIndex].start_time;
      const maxTime = "18:00";

      if (startTime && (endTime <= startTime || endTime > maxTime)) {
        setErrors({ [`end_time_${dayIndex}_${lectureIndex}`]: "End time must be after start time & before 18:00" });
        return;
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, [`end_time_${dayIndex}_${lectureIndex}`]: null }));
      }
    }

    updatedSchedule[dayIndex].lectures[lectureIndex][field] = value;
    setSchedule(updatedSchedule);
  };

  // Validate form before submitting
  const validateForm = () => {
    const newErrors = {};
    if (!selectedGroup) newErrors.group_id = "Group is required";

    schedule.forEach((day, dayIndex) => {
      day.lectures.forEach((lecture, lectureIndex) => {
        if (!lecture.start_time) newErrors[`start_time_${dayIndex}_${lectureIndex}`] = "Start time required";
        if (!lecture.end_time) newErrors[`end_time_${dayIndex}_${lectureIndex}`] = "End time required";
        if (!lecture.module_code) newErrors[`module_code_${dayIndex}_${lectureIndex}`] = "Module required";
        if (!lecture.lecturer_id) newErrors[`lecturer_id_${dayIndex}_${lectureIndex}`] = "Lecturer required";
        if (!lecture.venue_id) newErrors[`venue_id_${dayIndex}_${lectureIndex}`] = "Venue required";
      });
    });

    return newErrors;
  };

  // Submit updated data
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.put(`/api/timetables/update/${id}`, { group_id: selectedGroup, schedule });
      alert("Timetable updated successfully!");
      navigate("/view-timetables");
    } catch (error) {
      console.error("Error updating timetable:", error);
      setErrorMessage(error.response?.data?.message || "Failed to update timetable.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-5 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-2xl font-bold text-center mb-5">Update Timetable</h2>

      {errorMessage && <p className="text-red-600 text-center">{errorMessage}</p>}

      <div className="mb-4">
        <label className="block text-lg font-semibold mb-1">Select Group</label>
        <select className="w-full p-2 border rounded-lg" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
          <option value="">Select a Group</option>
          {groups.map((group) => (
            <option key={group.group_id} value={group.group_id}>
              {group.group_id} - {group.department}
            </option>
          ))}
        </select>
        {errors.group_id && <p className="text-red-500">{errors.group_id}</p>}
      </div>

      {schedule.map((day, dayIndex) => (
        <div key={day.day} className="mb-6">
          <h3 className="text-xl font-semibold">{day.day}</h3>

          {day.lectures.map((lecture, lectureIndex) => (
            <div key={lectureIndex} className="flex gap-2 items-center mb-3">
              <input type="time" className="p-2 border rounded-lg w-1/6" value={lecture.start_time} onChange={(e) => handleLectureChange(dayIndex, lectureIndex, "start_time", e.target.value)} />
              <input type="time" className="p-2 border rounded-lg w-1/6" value={lecture.end_time} onChange={(e) => handleLectureChange(dayIndex, lectureIndex, "end_time", e.target.value)} />
              {/* Module Dropdown */}
    <select 
      className="p-2 border rounded-lg w-1/4" 
      value={lecture.module_code} 
      onChange={(e) => handleLectureChange(dayIndex, lectureIndex, "module_code", e.target.value)}
    >
      <option value="">Module</option>
      {modules.map((mod) => (
        <option key={mod.module_code} value={mod.module_code}>{mod.module_code}</option>
      ))}
    </select>
              {/* Lecturer Dropdown */}
    <select 
      className="p-2 border rounded-lg w-1/4" 
      value={lecture.lecturer_id} 
      onChange={(e) => handleLectureChange(dayIndex, lectureIndex, "lecturer_id", e.target.value)}
    >
      <option value="">Lecturer</option>
      {examiners.map((exam) => (
        <option key={exam.examiner_id} value={exam.examiner_id}>{exam.examiner_id} - {exam.name}</option>
      ))}
    </select>

    {/* Venue Dropdown */}
    <select 
      className="p-2 border rounded-lg w-1/4" 
      value={lecture.venue_id} 
      onChange={(e) => handleLectureChange(dayIndex, lectureIndex, "venue_id", e.target.value)}
    >
      <option value="">Venue</option>
      {venues.map((venue) => (
        <option key={venue.venue_id} value={venue.venue_id}>{venue.venue_id}</option>
      ))}
    </select>
              <button className="text-red-600" onClick={() => removeLecture(dayIndex, lectureIndex)}>Remove</button>
            </div>
          ))}
          <button className="text-blue-600 mt-2" onClick={() => addLecture(dayIndex)}>+ Add Lecture</button>
        </div>
      ))}

      <button className="bg-blue-600 text-white p-3 rounded-lg w-full mt-5 hover:opacity-90" onClick={handleSubmit}>
        Update Timetable
      </button>
    </div>
  );
}
