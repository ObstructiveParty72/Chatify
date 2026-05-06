import cloudinary from "../lib/cloudinary.js";
import { createGroup, findGroupsByMember, findGroupById } from "../models/Group.js";
import { findMessagesByGroupId } from "../models/Message.js";

export const createNewGroup = async (req, res) => {
  try {
    const { name, description, members, image } = req.body;
    const adminId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Ensure admin is part of members
    const groupMembers = members || [];
    if (!groupMembers.includes(adminId)) {
      groupMembers.push(adminId);
    }

    const newGroup = await createGroup({
      name,
      description,
      members: groupMembers,
      adminId,
      image: imageUrl,
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error in createNewGroup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await findGroupsByMember(userId);
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await findMessagesByGroupId(groupId);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getGroupMessages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
