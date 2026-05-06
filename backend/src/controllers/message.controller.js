import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { createMessage, findMessagesBetween, findChatPartnerIds, findMessagesByGroupId } from "../models/Message.js";
import { findAllUsersExcept, findUsersByIds, userExists, findUserByEmail } from "../models/User.js";
import { findGroupById, findGroupsByMember } from "../models/Group.js";
import { sendInvitationEmail } from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await findAllUsersExcept(loggedInUserId);

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: chatId } = req.params;

    // Check if chatId is a group or user
    // First try group
    const group = await findGroupById(chatId);
    if (group) {
      const messages = await findMessagesByGroupId(chatId);
      return res.status(200).json(messages);
    }

    const messages = await findMessagesBetween(myId, chatId);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    let imageUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Check if receiver is a group
    const group = await findGroupById(receiverId);
    
    if (group) {
      // Group message
      const newMessage = await createMessage({
        senderId,
        receiverId, // Using groupId as receiverId
        text,
        image: imageUrl,
        senderName: req.user.fullName,
        senderPic: req.user.profilePic,
      });

      // Broadcast to all members
      group.members.forEach((memberId) => {
        // Don't send back to sender if you want, or do. 
        // Usually, socket.io emits to all in room. 
        // Here we use userSocketMap.
        const receiverSocketId = getReceiverSocketId(memberId);
        if (receiverSocketId && memberId !== senderId) {
          io.to(receiverSocketId).emit("newMessage", newMessage);
        }
      });

      return res.status(201).json(newMessage);
    }

    // One-to-one message logic
    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverFound = await userExists(receiverId);
    if (!receiverFound) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    const newMessage = await createMessage({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      senderName: req.user.fullName,
      senderPic: req.user.profilePic,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const partnerIds = await findChatPartnerIds(loggedInUserId);
    const chatPartners = await findUsersByIds(partnerIds);
    
    const myGroups = await findGroupsByMember(loggedInUserId);

    // Combine users and groups
    const allChats = [...chatPartners, ...myGroups];

    res.status(200).json(allChats);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const searchContactByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await findUserByEmail(email);
    if (!user) {
      // Send invitation email
      try {
        await sendInvitationEmail(email, req.user.fullName, ENV.CLIENT_URL);
        return res.status(200).json({ 
          message: "User not found. An invitation email has been sent!",
          isInvited: true 
        });
      } catch (error) {
        return res.status(404).json({ message: "User not found and invitation failed" });
      }
    }

    if (user._id === req.user._id) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in searchContactByEmail:", error);
    res.status(500).json({ message: "Server error" });
  }
};
