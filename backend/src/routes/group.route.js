import express from "express";
import { createNewGroup, getMyGroups, getGroupMessages } from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/create", createNewGroup);
router.get("/", getMyGroups);
router.get("/:groupId/messages", getGroupMessages);

export default router;
