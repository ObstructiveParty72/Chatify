import express from "express";
import { createNewGroup, getMyGroups, getGroupMessages, updateExistingGroup } from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.post("/create", createNewGroup);
router.get("/", getMyGroups);
router.get("/:groupId/messages", getGroupMessages);
router.put("/:groupId", updateExistingGroup);

export default router;
