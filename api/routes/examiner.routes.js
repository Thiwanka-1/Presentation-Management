import express from "express";
import { 
    addExaminer,
    getAllExaminers,
    getExaminerById,
    updateExaminer,
    deleteExaminer,

 } from "../controllers/examiner.controller.js";

const router = express.Router();

// Route to add an examiner
router.post("/add", addExaminer);

router.get("/get-ex", getAllExaminers);

router.get("/get-ex/:id", getExaminerById);

router.put("/update-ex/:id", updateExaminer);

router.delete("/delete-ex/:id", deleteExaminer);

export default router;
