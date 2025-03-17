import express from "express";
import {
  addModule,
  viewAllModules,
  updateModule,
  deleteModule
} from "../controllers/modules.controller.js";

const router = express.Router();

// Add a new module
router.post("/add", addModule);

// Get all modules
router.get("/all", viewAllModules);

// Update module
router.put("/update/:id", updateModule);

// Delete module
router.delete("/delete/:id", deleteModule);

export default router;
