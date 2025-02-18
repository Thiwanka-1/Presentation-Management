import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";

export const addStudent = async (req, res) => {
  try {
    const { name, email, password, phone, department } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    // Get the latest student ID
    const lastStudent = await Student.findOne().sort({ student_id: -1 });
    let nextIdNumber = lastStudent ? parseInt(lastStudent.student_id.slice(-3)) + 1 : 1;
    const student_id = `ST${new Date().getFullYear()}${String(nextIdNumber).padStart(3, "0")}`;

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create Student
    const newStudent = new Student({ student_id, name, email, password: hashedPassword, phone, department });
    await newStudent.save();

    // Create User Profile
    const newUser = new User({ user_id: student_id, username: name, email, password: hashedPassword, role: "student" });
    await newUser.save();

    res.status(201).json({ message: "Student added successfully", student_id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
};

// Get student by ID
export const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedStudent = await Student.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the student
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Delete the associated user profile
    await User.findOneAndDelete({ email: deletedStudent.email });

    res.status(200).json({ message: "Student and user profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


