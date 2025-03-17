import Module from "../models/modules.model.js";
import Examiner from "../models/examiner.model.js";

export const addModule = async (req, res) => {
    try {
      const { module_name, department, lecturer_in_charge } = req.body;
  
      if (!module_name || !department || !lecturer_in_charge) {
        return res.status(400).json({ message: "All fields are required" });
      }
  
      // Find the examiner using examiner_id instead of ObjectId
      const lecturer = await Examiner.findOne({ examiner_id: lecturer_in_charge });
      if (!lecturer) {
        return res.status(404).json({ message: "Lecturer not found" });
      }
  
      // Generate Unique Module Code for the Department
      const lastModule = await Module.findOne({ department }).sort({ module_code: -1 });
  
      let nextModuleNumber = 1; // Default to 1 if no previous module exists
      if (lastModule) {
        const lastNumber = parseInt(lastModule.module_code.slice(-3)); // Extract the number
        nextModuleNumber = lastNumber + 1; // Increment by 1
      }
  
      const module_code = `M${department.toUpperCase()}${String(nextModuleNumber).padStart(3, "0")}`;
  
      // Create and Save the Module
      const newModule = new Module({
        module_code,
        module_name,
        department,
        lecturer_in_charge: lecturer._id, // Store ObjectId
      });
  
      await newModule.save();
  
      res.status(201).json({ message: "Module added successfully", module: newModule });
    } catch (error) {
      console.error("Error adding module:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  // ✅ Get All Modules (Includes `module_name` and `examiner_id`)
  export const viewAllModules = async (req, res) => {
    try {
      const modules = await Module.find().populate("lecturer_in_charge", "examiner_id name");
      res.status(200).json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  // ✅ Update Module (Supports Updating `module_name` & Lecturer using `examiner_id`)
  export const updateModule = async (req, res) => {
    try {
      const { id } = req.params;
      const { module_name, department, lecturer_in_charge } = req.body;
      let updateData = { module_name, department };
  
      // If lecturer_in_charge is provided, find by examiner_id and store ObjectId
      if (lecturer_in_charge) {
        const lecturer = await Examiner.findOne({ examiner_id: lecturer_in_charge });
        if (!lecturer) {
          return res.status(404).json({ message: "Lecturer not found" });
        }
        updateData.lecturer_in_charge = lecturer._id;
      }
  
      const updatedModule = await Module.findByIdAndUpdate(id, updateData, { new: true });
      if (!updatedModule) {
        return res.status(404).json({ message: "Module not found" });
      }
  
      res.status(200).json({ message: "Module updated successfully", module: updatedModule });
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };
  
  // ✅ Delete Module
  export const deleteModule = async (req, res) => {
    try {
      const { id } = req.params;
      const deletedModule = await Module.findByIdAndDelete(id);
      if (!deletedModule) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.status(200).json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Server error", error });
    }
  };