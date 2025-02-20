import express from "express";
import { 
    addPresentation,
    getAllPresentations,
    getPresentationById,
    updatePresentation,
    deletePresentation,
    smartSuggestSlot,
    smartSuggestSlotForReschedule,
    requestReschedule,
    approveOrRejectReschedule,
    getAllRequests,
    deleteRescheduleRequest,
    checkAvailability

} from "../controllers/presentation.controller.js";
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post("/add", addPresentation);

router.get("/get-pres", getAllPresentations);

router.post("/smart-suggest-slot", smartSuggestSlot);

router.post("/smart-suggest-slot-req", smartSuggestSlotForReschedule);

router.post("/reschedule",verifyToken, requestReschedule);

router.post("/req-approve", approveOrRejectReschedule);

router.get("/get-requests", getAllRequests);

router.post("/check-availability", checkAvailability);

router.delete("/delete-req/:id", deleteRescheduleRequest);

router.get("/get-pres/:id", getPresentationById);

router.put("/update-pres/:id", updatePresentation);

router.delete("/delete-pres/:id", deletePresentation);


export default router;
