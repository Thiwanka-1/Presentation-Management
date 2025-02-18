import express from "express";
import { 
    addPresentation,
    getAllPresentations,
    getPresentationById,
    updatePresentation,
    deletePresentation,
    smartSuggestSlot,

} from "../controllers/presentation.controller.js";

const router = express.Router();

router.post("/add", addPresentation);

router.get("/get-pres", getAllPresentations);

router.post("/smart-suggest-slot", smartSuggestSlot);

router.get("/get-pres/:id", getPresentationById);

router.put("/update-pres/:id", updatePresentation);

router.delete("/delete-pres/:id", deletePresentation);


export default router;
