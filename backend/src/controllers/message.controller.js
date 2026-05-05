import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { createMessage, findMessagesBetween, findChatPartnerIds } from "../models/Message.js";
import { findAllUsersExcept, findUsersByIds, userExists, findUserByEmail } from "../models/User.js";
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
    const { id: userToChatId } = req.params;

    const messages = await findMessagesBetween(myId, userToChatId);

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
    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverFound = await userExists(receiverId);
    if (!receiverFound) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await createMessage({
      senderId,
      receiverId,
      text,
      image: imageUrl,
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

    res.status(200).json(chatPartners);
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
