import Timetable from "../models/timetable.model.js";
import StudentGroup from "../models/groups.model.js";
import Module from "../models/modules.model.js";
import Examiner from "../models/examiner.model.js"; // Lecturer is from Examiner Management
import Venue from "../models/venue.model.js";

//  Add a new timetable (Full week schedule)
export const addTimetable = async (req, res) => {
    try {
      const { group_id, schedule } = req.body;
  
      console.log("Received Request Body:", req.body); // Debugging: Log request data
  
      // Validate Group ID
      const groupExists = await StudentGroup.findOne({ group_id });
      if (!groupExists) {
        console.log("Invalid Group ID:", group_id); // Debugging
        return res.status(400).json({ message: "Invalid Group ID. Group does not exist." });
      }
  
      // Validate Weekly Schedule (Each day's lectures)
      for (const day of schedule) {
        for (const lecture of day.lectures) {
          // Validate Module Code
          const moduleExists = await Module.findOne({ module_code: lecture.module_code });
          if (!moduleExists) {
            console.log("Invalid Module Code:", lecture.module_code); // Debugging
            return res.status(400).json({ message: `Invalid Module Code (${lecture.module_code}).` });
          }
  
          // Validate Lecturer ID
          const lecturerExists = await Examiner.findOne({ examiner_id: lecture.lecturer_id });
          if (!lecturerExists) {
            console.log("Invalid Lecturer ID:", lecture.lecturer_id); // Debugging
            return res.status(400).json({ message: `Invalid Lecturer ID (${lecture.lecturer_id}).` });
          }
  
          // Validate Venue ID
          const venueExists = await Venue.findOne({ venue_id: lecture.venue_id });
          if (!venueExists) {
            console.log("Invalid Venue ID:", lecture.venue_id); // Debugging
            return res.status(400).json({ message: `Invalid Venue ID (${lecture.venue_id}).` });
          }
        }
      }
  
      // Create a new Timetable
      const newTimetable = new Timetable({
        group_id,
        schedule,
      });
  
      await newTimetable.save();
      console.log("Timetable Created Successfully"); // Debugging
  
      res.status(201).json({ message: "Timetable created successfully!" });
  
    } catch (error) {
      console.error("Error while adding timetable:", error); // Log the full error
      res.status(500).json({ message: "Server error", error: error.message || error });
    }
  };
  
  
//  View all timetables
export const viewAllTimetables = async (req, res) => {
  try {
    const timetables = await Timetable.find();
    res.status(200).json(timetables);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// View timetable by Group ID
export const viewTimetableByGroupId = async (req, res) => {
  try {
    const { group_id } = req.params;
    const timetable = await Timetable.findOne({ group_id });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found for this group" });
    }

    res.status(200).json(timetable);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//  Update a timetable (Full week update)
export const updateTimetable = async (req, res) => {
    try {
      const { id } = req.params;
      const { group_id, schedule } = req.body;
  
      // Validate Group ID
      const groupExists = await StudentGroup.findOne({ group_id });
      if (!groupExists) {
        return res.status(400).json({ message: "Invalid Group ID. Group does not exist." });
      }
  
      // Validate Weekly Schedule (Each day's lectures)
      for (const day of schedule) {
        for (const lecture of day.lectures) {
          // Validate Module Code
          const moduleExists = await Module.findOne({ module_code: lecture.module_code });
          if (!moduleExists) {
            return res.status(400).json({ message: `Invalid Module Code (${lecture.module_code}).` });
          }
  
          // Validate Lecturer ID
          const lecturerExists = await Examiner.findOne({ examiner_id: lecture.lecturer_id });
          if (!lecturerExists) {
            return res.status(400).json({ message: `Invalid Lecturer ID (${lecture.lecturer_id}).` });
          }
  
          // Validate Venue ID
          const venueExists = await Venue.findOne({ venue_id: lecture.venue_id });
          if (!venueExists) {
            return res.status(400).json({ message: `Invalid Venue ID (${lecture.venue_id}).` });
          }
        }
      }
  
      const updatedTimetable = await Timetable.findByIdAndUpdate(id, req.body, { new: true });
      if (!updatedTimetable) {
        return res.status(404).json({ message: "Timetable not found!" });
      }
  
      res.status(200).json({ message: "Timetable updated successfully!", updatedTimetable });
  
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  

//  Delete a timetable
export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTimetable = await Timetable.findByIdAndDelete(id);

    if (!deletedTimetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.status(200).json({ message: "Timetable deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getTimetableForStudent = async (req, res) => {
    try {
      const { studentId } = req.params;
  
      // Find the student's group
      const studentGroup = await StudentGroup.findOne({ students: studentId });
      if (!studentGroup) {
        return res.status(404).json({ message: "Student is not assigned to any group." });
      }
  
      // Get the timetable for the group
      const timetable = await Timetable.findOne({ group_id: studentGroup.group_id });
      if (!timetable) {
        return res.status(404).json({ message: "No timetable found for this student group." });
      }
  
      res.status(200).json(timetable);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  export const getTimetableForExaminer = async (req, res) => {
    try {
        const { examinerId } = req.params;
    
        // Find all timetables that include the examiner's ID in any day's lectures
        const timetables = await Timetable.find({
          "schedule.lectures.lecturer_id": examinerId,
        });
    
        if (timetables.length === 0) {
          return res.status(404).json({ message: "No scheduled lectures found for this examiner." });
        }
    
        // Extract only the lectures relevant to this examiner
        const examinerSchedule = timetables.map((timetable) => {
          return {
            group_id: timetable.group_id,
            schedule: timetable.schedule.map((day) => ({
              day: day.day,
              lectures: day.lectures.filter((lecture) => lecture.lecturer_id === examinerId),
            })),
          };
        });
    
        res.status(200).json(examinerSchedule);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    };
  
  export const getTimetableForVenue = async (req, res) => {
    try {
        const { venueId } = req.params;
    
        // Find all timetables that include this venue in any day's lectures
        const timetables = await Timetable.find({
          "schedule.lectures.venue_id": venueId,
        });
    
        if (timetables.length === 0) {
          return res.status(404).json({ message: "No scheduled lectures found for this venue." });
        }
    
        // Extract only the lectures relevant to this venue
        const venueSchedule = timetables.map((timetable) => {
          return {
            group_id: timetable.group_id,
            schedule: timetable.schedule.map((day) => ({
              day: day.day,
              lectures: day.lectures.filter((lecture) => lecture.venue_id === venueId),
            })),
          };
        });
    
        res.status(200).json(venueSchedule);
      } catch (error) {
        res.status(500).json({ message: "Server error", error });
      }
    };