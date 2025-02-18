import Presentation from "../models/presentation.model.js";
import Examiner from "../models/examiner.model.js";
import Venue from "../models/venue.model.js";
import Student from "../models/student.model.js";

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

export const smartSuggestSlot = async (req, res) => {
  try {
    const { studentIds, date, numExaminers, duration } = req.body;
    
    // Fetch students and determine department
    const students = await Student.find({ student_id: { $in: studentIds } });
    if (students.length === 0) {
      return res.status(400).json({ message: "No valid students found" });
    }
    const department = students[0].department;

    // Find available examiners from the same department
    const availableExaminers = await Examiner.find({
      department,
      _id: { $nin: await Presentation.distinct("examiners", { date }) },
    }).limit(numExaminers);
    
    if (availableExaminers.length < numExaminers) {
      return res.status(400).json({ message: "Not enough available examiners" });
    }

    // Find available venues
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
      examiners: availableExaminers,
      venue,
      department,
      timeRange: suggestedTime,
    });
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