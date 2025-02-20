import Presentation from "../models/presentation.model.js";
import Examiner from "../models/examiner.model.js";
import Venue from "../models/venue.model.js";
import Student from "../models/student.model.js";
import RescheduleRequest from "../models/reschedule.model.js";

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

export const checkAvailability = async (req, res) => {
  try {
    const { department, userRole, userIds, date, venue } = req.body;

    if (!department || !userRole || !userIds || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Define all possible time slots
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

    let availableSlots = [];

    // Check each time slot using isTimeSlotAvailable
    for (let slot of allTimeSlots) {
      const isAvailable = await isTimeSlotAvailable(
        date,
        slot.startTime,
        slot.endTime,
        userRole === "examiner" ? userIds : [],
        venue,
        userRole === "student" ? userIds : []
      );

      if (isAvailable) {
        availableSlots.push(slot);
      }
    }

    return res.status(200).json({ availableSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllPresentations = async (req, res, next) => {
  try {
    const presentations = await Presentation.find()
    .populate("students") // ✅ Ensure presenters are populated
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

// export const smartSuggestSlot = async (req, res) => {
//   try {
//     const { studentIds, date, numExaminers, duration } = req.body;
    
//     // Fetch students and determine department
//     const students = await Student.find({ _id: { $in: studentIds } });
//     if (students.length === 0) {
//       return res.status(400).json({ message: "No valid students found" });
//     }
//     const department = students[0].department;

//     // Find available examiners from the same department
//     const availableExaminers = await Examiner.find({
//       department,
//       _id: { $nin: await Presentation.distinct("examiners", { date }) },
//     }).limit(numExaminers);
    
//     if (availableExaminers.length < numExaminers) {
//       return res.status(400).json({ message: "Not enough available examiners" });
//     }

//     // Find available venues
//     const availableVenues = await Venue.find({
//       _id: { $nin: await Presentation.distinct("venue", { date }) },
//     }).limit(1);

//     if (availableVenues.length === 0) {
//       return res.status(400).json({ message: "No available venues" });
//     }

//     const venue = availableVenues[0];

//     // Find the best available time slot
//     const presentationsOnDate = await Presentation.find({ date });
//     let suggestedTime = findBestTimeSlot(presentationsOnDate, duration);

//     if (!suggestedTime) {
//       return res.status(400).json({ message: "No suitable time slots available" });
//     }

//     res.status(200).json({
//       examiners: availableExaminers,
//       venue,
//       department,
//       timeRange: suggestedTime,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };


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
      { startTime: "16:00", endTime: "17:00" }
    ];

    for (let venue of allVenues) {
      for (let slot of allTimeSlots) {
        // Check venue availability for this time slot
        const isVenueAvailable = await isTimeSlotAvailable(
          date,
          slot.startTime,
          slot.endTime,
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
            slot.startTime,
            slot.endTime,
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
            timeRange: slot,
          });
        }
      }
    }

    return res.status(400).json({ message: "No suitable time slots available" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};




const findBestTimeSlot = (presentations, duration) => {
  let availableSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  
  presentations.forEach(presentation => {
    let index = availableSlots.indexOf(presentation.timeRange.startTime);
    if (index !== -1) availableSlots.splice(index, 1);
  });

  return availableSlots.length > 0 ? { startTime: availableSlots[0], endTime: calculateEndTime(availableSlots[0], duration) } : null;
};

const calculateEndTime = (startTime, duration) => {
  let [hours, minutes] = startTime.split(":").map(Number);
  hours += Math.floor(duration / 60);
  minutes += duration % 60;
  if (minutes >= 60) {
    hours += 1;
    minutes -= 60;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const smartSuggestSlotForReschedule = async (req, res) => {
  try {
    const { presentationId } = req.body;

    // Find the presentation
    const presentation = await Presentation.findById(presentationId).populate("students").populate("examiners");
    if (!presentation) {
      return res.status(404).json({ message: "Presentation not found" });
    }

    const department = presentation.department;
    const duration = presentation.duration;
    const date = new Date(); // Start searching from today

    // Get available venue
    const availableVenues = await Venue.find({
      _id: { $nin: await Presentation.distinct("venue", { date }) },
    }).limit(1);

    if (availableVenues.length === 0) {
      return res.status(400).json({ message: "No available venues" });
    }

    const venue = availableVenues[0];

    // Find the best available time slot
    const presentationsOnDate = await Presentation.find({ date });
    let suggestedTime = findBestTimeSlot(presentationsOnDate, duration);

    if (!suggestedTime) {
      return res.status(400).json({ message: "No suitable time slots available" });
    }

    res.status(200).json({
      department,
      venue,
      timeRange: suggestedTime,
    });
  } catch (error) {
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
