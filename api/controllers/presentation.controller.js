import Presentation from "../models/presentation.model.js";
import Examiner from "../models/examiner.model.js";
import Venue from "../models/venue.model.js";
import Student from "../models/student.model.js";
import RescheduleRequest from "../models/reschedule.model.js";
import mongoose from "mongoose";

// Function to check if time slot is available
const isTimeSlotAvailable = async (date, startTime, endTime, examiners, venue, students) => {
  // Check for overlapping time slots for examiners
  const overlappingExaminer = await Presentation.findOne({
    date,
    examiners: { $in: examiners },
    $or: [
      { "timeRange.startTime": { $lt: endTime }, "timeRange.endTime": { $gt: startTime } },
      { "timeRange.startTime": { $gte: startTime, $lt: endTime } },
      { "timeRange.endTime": { $gt: startTime, $lte: endTime } }
    ]
  });

  // Check for overlapping time slots for venue
  const overlappingVenue = await Presentation.findOne({
    date,
    venue,
    $or: [
      { "timeRange.startTime": { $lt: endTime }, "timeRange.endTime": { $gt: startTime } },
      { "timeRange.startTime": { $gte: startTime, $lt: endTime } },
      { "timeRange.endTime": { $gt: startTime, $lte: endTime } }
    ]
  });

    // Check for overlapping time slots for presenters
  const overlappingStudent = await Presentation.findOne({
    date,
    students: { $in: students },
    $or: [
      { "timeRange.startTime": { $lt: endTime }, "timeRange.endTime": { $gt: startTime } },
      { "timeRange.startTime": { $gte: startTime, $lt: endTime } },
      { "timeRange.endTime": { $gt: startTime, $lte: endTime } }
    ]
  });

  return !overlappingExaminer && !overlappingVenue && !overlappingStudent;
};

// Add a new presentation
export const addPresentation = async (req, res, next) => {
  try {
    const { title, students, examiners, venue, department,numOfExaminers, date,duration, timeRange } = req.body;

    // Validate required fields
    if (!title || !students || !examiners || !venue || !department || !numOfExaminers || !date || !duration || !timeRange) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the time slot is available
    const available = await isTimeSlotAvailable(date, timeRange.startTime, timeRange.endTime, examiners, venue, students);
    if (!available) {
      return res.status(400).json({ message: "Selected time slot is not available" });
    }

    // Create new presentation
    const newPresentation = new Presentation({
      title,
      students,
      examiners,
      venue,
      department,
      numOfExaminers,
      date,
      duration,
      timeRange
    });

    await newPresentation.save();
    res.status(201).json({ message: "Presentation scheduled successfully", newPresentation });
  } catch (error) {
    next(error);
  }
};


export const checkAvailability = async (req, res, next) => {
  const { date, department, students, examiners, venue, duration } = req.body;

  try {
    // Fetch student, examiner, and venue object IDs from the database
    const studentIds = await Student.find({ student_id: { $in: students } }).select('_id');
    const examinerIds = await Examiner.find({ examiner_id: { $in: examiners } }).select('_id');
    const venueObj = await Venue.findOne({ venue_id: venue }).select('_id');

    // Check if all IDs are valid
    if (!studentIds || !examinerIds || !venueObj) {
      return res.status(400).json({ success: false, message: 'Invalid student/examiner/venue ID(s)' });
    }

    // Convert to ObjectId references
    const studentObjectIds = studentIds.map((student) => student._id);
    const examinerObjectIds = examinerIds.map((examiner) => examiner._id);
    const venueObjectId = venueObj._id;

    // Fetch presentations for the given date, department, and venue
    const presentations = await Presentation.find({
      date,
      department,
      venue: venueObjectId,
      $or: [
        { students: { $in: studentObjectIds } },
        { examiners: { $in: examinerObjectIds } }
      ]
    });

    // If no presentations exist for the selected day and department, the whole day is free
    if (presentations.length === 0) {
      return res.status(200).json([
        { timeSlot: "08:00 - 18:00", available: true },
      ]);
    }

    // Convert time range to minutes for easier comparison
    const convertToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const convertToTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    // Create an array to store unavailable time slots
    const unavailableSlots = presentations.map((presentation) => ({
      start: convertToMinutes(presentation.timeRange.startTime),
      end: convertToMinutes(presentation.timeRange.endTime),
    }));

    // Sort the unavailable slots by start time
    unavailableSlots.sort((a, b) => a.start - b.start);

    // Initialize an array to hold the available time slots
    const availableSlots = [];

    // Start the check for free time slots from 08:00 AM
    let previousEndTime = convertToMinutes("08:00"); // Start of the day (08:00 AM)

    // Iterate over the unavailable slots to find gaps
    for (let slot of unavailableSlots) {
      // If there's a gap between the previous end time and the current start time
      if (slot.start > previousEndTime) {
        const availableStart = previousEndTime;
        const availableEnd = slot.start;

        // Check if the time slot is large enough to accommodate the required duration
        if (availableEnd - availableStart >= duration) {
          availableSlots.push({
            timeSlot: `${convertToTime(availableStart)} - ${convertToTime(availableEnd)}`,
            available: true,
          });
        }
      }
      // Update the previous end time
      previousEndTime = Math.max(previousEndTime, slot.end);
    }

    // Check the final gap at the end of the day (until 18:00)
    if (previousEndTime < convertToMinutes("18:00")) {
      const availableStart = previousEndTime;
      const availableEnd = convertToMinutes("18:00");

      // Check if the time slot is large enough to accommodate the required duration
      if (availableEnd - availableStart >= duration) {
        availableSlots.push({
          timeSlot: `${convertToTime(availableStart)} - ${convertToTime(availableEnd)}`,
          available: true,
        });
      }
    }

    // Return the available time slots
    res.status(200).json(availableSlots);

  } catch (error) {
    console.error("Error: ", error);
    next(error); // Pass error to the error handling middleware
  }
};

export const getAllPresentations = async (req, res, next) => {
  try {
    const presentations = await Presentation.find()
    .populate("students") 
    .populate("examiners")
    .populate("venue");


    res.status(200).json(presentations);
  } catch (error) {
    next(error);
  }
};

// Get presentation by ID
export const getPresentationById = async (req, res, next) => {
  try {
    const presentation = await Presentation.findById(req.params.id)
      .populate("students")
      .populate("examiners")
      .populate("venue");

    if (!presentation) return res.status(404).json({ message: "Presentation not found" });

    res.status(200).json(presentation);
  } catch (error) {
    next(error);
  }
};

export const updatePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const {students, examiners, venue, date, timeRange } = req.body;

    // Validate time slot availability
    const available = await isTimeSlotAvailable(date, timeRange.startTime, timeRange.endTime, examiners, venue, students);

    if (!available) {
      return res.status(400).json({ message: "Selected time slot is not available" });
    }

    const updatedPresentation = await Presentation.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedPresentation) {
      return res.status(404).json({ message: "Presentation not found" });
    }

    res.status(200).json(updatedPresentation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deletePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPresentation = await Presentation.findByIdAndDelete(id);

    if (!deletedPresentation) {
      return res.status(404).json({ message: "Presentation not found" });
    }

    res.status(200).json({ message: "Presentation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const smartSuggestSlot = async (req, res) => {
  try {
    const { studentIds, date, numExaminers, duration } = req.body;

    // Fetch students and determine department
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length === 0) {
      return res.status(400).json({ message: "No valid students found" });
    }
    const department = students[0].department;

    // Get all examiners from the department
    const departmentExaminers = await Examiner.find({ department });

    if (departmentExaminers.length < numExaminers) {
      return res.status(400).json({ message: "Not enough examiners in this department" });
    }

    // Get all venues (DO NOT exclude venues just because they have a presentation that day)
    const allVenues = await Venue.find();

    if (allVenues.length === 0) {
      return res.status(400).json({ message: "No venues found" });
    }

    // Define possible time slots for the day
    const allTimeSlots = [
      { startTime: "08:00", endTime: "09:00" },
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "10:00", endTime: "11:00" },
      { startTime: "11:00", endTime: "12:00" },
      { startTime: "12:00", endTime: "13:00" },
      { startTime: "13:00", endTime: "14:00" },
      { startTime: "14:00", endTime: "15:00" },
      { startTime: "15:00", endTime: "16:00" },
      { startTime: "16:00", endTime: "17:00" }
    ];

    // Helper function to check if a time slot can accommodate the given duration
    const getAvailableTimeSlot = (startTime, duration) => {
      const [hours, minutes] = startTime.split(":").map(num => parseInt(num, 10));
      const startDate = new Date(0, 0, 0, hours, minutes);
      const endDate = new Date(startDate.getTime() + duration * 60000); // Adding duration (ms)

      const endHours = endDate.getHours();
      const endMinutes = endDate.getMinutes();

      return {
        startTime: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
        endTime: `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`
      };
    };

    for (let venue of allVenues) {
      for (let slot of allTimeSlots) {
        // Adjust the slot to match the required duration
        const adjustedSlot = getAvailableTimeSlot(slot.startTime, duration);

        // Check venue availability for the new time slot
        const isVenueAvailable = await isTimeSlotAvailable(
          date,
          adjustedSlot.startTime,
          adjustedSlot.endTime,
          [],
          venue._id,
          studentIds
        );

        if (!isVenueAvailable) continue; // Skip if venue is busy

        // Filter available examiners for this slot
        let availableExaminers = [];
        for (let examiner of departmentExaminers) {
          const isExaminerAvailable = await isTimeSlotAvailable(
            date,
            adjustedSlot.startTime,
            adjustedSlot.endTime,
            [examiner._id],
            venue._id,
            studentIds
          );

          if (isExaminerAvailable) {
            availableExaminers.push(examiner);
          }

          if (availableExaminers.length >= numExaminers) break; // Stop once we have enough examiners
        }

        // If enough examiners are found, return the best slot
        if (availableExaminers.length >= numExaminers) {
          return res.status(200).json({
            examiners: availableExaminers.slice(0, numExaminers),
            venue,
            department,
            timeRange: adjustedSlot,
          });
        }
      }
    }

    return res.status(400).json({ message: "No suitable time slots available" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const smartSuggestSlotForReschedule = async (req, res) => {
  try {
    const { presentationId } = req.body;

    // Find the presentation
    const presentation = await Presentation.findById(presentationId)
      .populate("students")
      .populate("examiners");

    if (!presentation) {
      return res.status(404).json({ message: "Presentation not found" });
    }

    const department = presentation.department;
    const duration = presentation.duration;
    const studentIds = presentation.students.map((s) => s._id);
    const examinerIds = presentation.examiners.map((e) => e._id);
    const date = new Date().toISOString().split("T")[0]; // Get today's date

    // Get all venues (without removing those that have a presentation)
    const allVenues = await Venue.find();

    if (allVenues.length === 0) {
      return res.status(400).json({ message: "No venues found" });
    }

    // Define possible time slots
    const allTimeSlots = [
      { startTime: "08:00", endTime: "09:00" },
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "10:00", endTime: "11:00" },
      { startTime: "11:00", endTime: "12:00" },
      { startTime: "12:00", endTime: "13:00" },
      { startTime: "13:00", endTime: "14:00" },
      { startTime: "14:00", endTime: "15:00" },
      { startTime: "15:00", endTime: "16:00" },
      { startTime: "16:00", endTime: "17:00" },
    ];

    for (let venue of allVenues) {
      for (let slot of allTimeSlots) {
        // Check venue, examiner, and student availability for this time slot
        const isAvailable = await isTimeSlotAvailable(
          date,
          slot.startTime,
          slot.endTime,
          examinerIds,
          venue._id,
          studentIds
        );

        if (isAvailable) {
          return res.status(200).json({
            department,
            venue,
            timeRange: slot,
          });
        }
      }
    }

    return res.status(400).json({ message: "No suitable time slots available" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};


export const requestReschedule = async (req, res) => {
  try {
    const { presentationId, date, timeRange, venue, reason } = req.body;

    // Ensure user is authenticated
    if (!req.user || !req.user._id || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized request: User not found." });
    }

    const userId = req.user._id;
    const userType = req.user.role; // "Student" or "Examiner"

    // Fetch the presentation
    const presentation = await Presentation.findById(presentationId);
    if (!presentation) return res.status(404).json({ message: "Presentation not found" });

    // Ensure required fields are provided
    if (!date || !timeRange || !venue) {
      return res.status(400).json({ message: "Date, time range, and venue are required." });
    }

    // Create a reschedule request
    const newRequest = new RescheduleRequest({
      presentation: presentationId,
      requestedBy: { userId, userType },
      requestedSlot: { date, timeRange, venue },
      reason,
      status: "Pending",
    });

    await newRequest.save();
    res.status(201).json({ message: "Reschedule request submitted successfully", newRequest });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const approveOrRejectReschedule = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    // Find the reschedule request
    const request = await RescheduleRequest.findById(requestId).populate("presentation");
    if (!request) return res.status(404).json({ message: "Reschedule request not found" });

    if (action === "Reject") {
      request.status = "Rejected";
      await request.save();
      return res.status(200).json({ message: "Reschedule request rejected successfully" });
    }

    const { date, timeRange, venue } = request.requestedSlot;
    const { examiners, students, duration } = request.presentation;

    const isAvailable = await isTimeSlotAvailable(date, timeRange.startTime, timeRange.endTime, examiners, venue, students);
    if (!isAvailable) {
      request.status = "Rejected";
      await request.save();
      return res.status(400).json({ message: "Time slot is not available. Request automatically rejected." });
    }

    await Presentation.findByIdAndUpdate(request.presentation._id, {
      date,
      timeRange,
      venue,
    });

    request.status = "Approved";
    await request.save();

    res.status(200).json({ message: "Reschedule request approved and presentation updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllRequests = async (req, res, next) => {
  try {
    const requests = await RescheduleRequest.find();
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

export const deleteRescheduleRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Find the request
    const request = await RescheduleRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Reschedule request not found" });
    }

    // Delete the request
    await RescheduleRequest.findByIdAndDelete(requestId);

    res.status(200).json({ message: "Reschedule request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const getPresentationsForExaminer = async (req, res) => {
  try {
    const examinerId = req.user.id; // Use the authenticated user's ID from the JWT token
    
    // Convert examinerId to ObjectId (if needed)
    const examinerObjectId = new mongoose.Types.ObjectId(examinerId);
    console.log("Fetching presentations for examiner with ObjectId:", examinerObjectId);

    // Fetch presentations for the examiner based on the examiner ObjectId
    const presentations = await Presentation.find({
      'examiners': examinerObjectId, // Querying by ObjectId reference
    });

    console.log("Found presentations for examiner:", presentations);

    if (presentations.length === 0) {
      return res.status(404).json({ message: "No presentations found for this examiner" });
    }

    res.json(presentations);
  } catch (error) {
    console.error("Error fetching presentations for examiner:", error);
    res.status(500).json({ message: "Server error" });
  }
};




// Controller to get presentations for students
export const getPresentationsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params; // Get the student's ID from params
    
    // Convert studentId to ObjectId (if needed)
    const studentObjectId = new mongoose.Types.ObjectId(studentId);

    console.log("Fetching presentations for student with ObjectId:", studentObjectId);

    // Fetch presentations for the student based on the student ObjectId
    const presentations = await Presentation.find({
      'students': studentObjectId, // Querying by ObjectId reference
    });

    // Log presentations fetched
    console.log("Found presentations for student:", presentations);

    if (presentations.length === 0) {
      return res.status(404).json({ message: "No presentations found for this student" });
    }

    res.json(presentations);
  } catch (error) {
    console.error("Error fetching presentations for student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserPresentations = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching presentations for User ID:", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch presentations and populate student and examiner data
    const userPresentations = await Presentation.find()
      .populate("students", "student_id")
      .populate("examiners", "examiner_id")
      .populate("venue", "venue_id");

    // Filter presentations manually
    const filteredPresentations = userPresentations.filter(presentation =>
      presentation.students.some(student => student.student_id === userId) ||
      presentation.examiners.some(examiner => examiner.examiner_id === userId)
    );

    console.log("Filtered Presentations:", filteredPresentations);

    if (filteredPresentations.length === 0) {
      return res.status(404).json({ message: "No presentations found for this user" });
    }

    return res.status(200).json(filteredPresentations);
  } catch (error) {
    console.error("Error fetching user presentations:", error);
    return next(error);
  }
};



