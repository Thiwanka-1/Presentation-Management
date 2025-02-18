import Examiner from "../models/examiner.model.js";
import User from "../models/user.model.js";
import bcryptjs from 'bcryptjs';

export const addExaminer = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    // Get the latest examiner ID
    const lastExaminer = await Examiner.findOne().sort({ examiner_id: -1 });
    let nextIdNumber = lastExaminer ? parseInt(lastExaminer.examiner_id.slice(-3)) + 1 : 1;
    const examiner_id = `EX${new Date().getFullYear()}${String(nextIdNumber).padStart(3, "0")}`;

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create Examiner
    const newExaminer = new Examiner({ examiner_id, name, email, password: hashedPassword, phone, department });
    await newExaminer.save();

    // Create User Profile
    const newUser = new User({ user_id: examiner_id, username: name, email, password: hashedPassword, role: "examiner" });
    await newUser.save();

    res.status(201).json({ message: "Examiner added successfully", examiner_id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllExaminers = async (req, res, next) => {
  try {
    const examiners = await Examiner.find();
    res.status(200).json(examiners);
  } catch (error) {
    next(error);
  }
};

// Get examiner by ID
export const getExaminerById = async (req, res, next) => {
  try {
    const examiner = await Examiner.findById(req.params.id);
    if (!examiner) return res.status(404).json({ message: "Examiner not found" });

    res.status(200).json(examiner);
  } catch (error) {
    next(error);
  }
};

export const updateExaminer = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExaminer = await Examiner.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedExaminer) {
      return res.status(404).json({ message: "Examiner not found" });
    }

    res.status(200).json(updatedExaminer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteExaminer = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the examiner
    const deletedExaminer = await Examiner.findByIdAndDelete(id);
    if (!deletedExaminer) {
      return res.status(404).json({ message: "Examiner not found" });
    }

    // Delete the associated user profile
    await User.findOneAndDelete({ email: deletedExaminer.email });

    res.status(200).json({ message: "Examiner and user profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};