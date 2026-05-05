import { getCloudant, DB_MESSAGES } from "../lib/db.js";
import { generateId } from "../lib/utils.js";

// Save a new message document to Cloudant
export async function createMessage({ senderId, receiverId, text, image }) {
  const cloudant = getCloudant();

  const doc = {
    _id: generateId(),
    type: "message",
    senderId,
    receiverId,
    text: text || "",
    image: image || "",
    createdAt: new Date().toISOString(),
  };

  await cloudant.postDocument({ db: DB_MESSAGES, document: doc });
  return sanitizeMessage(doc);
}

// Find messages between two users (both directions)
export async function findMessagesBetween(userIdA, userIdB) {
  const cloudant = getCloudant();

  const response = await cloudant.postFind({
    db: DB_MESSAGES,
    selector: {
      type: "message",
      $or: [
        { senderId: userIdA, receiverId: userIdB },
        { senderId: userIdB, receiverId: userIdA },
      ],
    },
    sort: [{ createdAt: "asc" }],
    limit: 500,
  });

  return response.result.docs.map(sanitizeMessage);
}

// Find all unique chat partner IDs for a user
export async function findChatPartnerIds(userId) {
  const cloudant = getCloudant();

  const response = await cloudant.postFind({
    db: DB_MESSAGES,
    selector: {
      type: "message",
      $or: [{ senderId: userId }, { receiverId: userId }],
    },
    fields: ["senderId", "receiverId"],
    limit: 5000,
  });

  const partnerIds = new Set();
  for (const doc of response.result.docs) {
    if (doc.senderId !== userId) partnerIds.add(doc.senderId);
    if (doc.receiverId !== userId) partnerIds.add(doc.receiverId);
  }

  return [...partnerIds];
}

// Strip internal Cloudant fields
function sanitizeMessage(doc) {
  return {
    _id: doc._id,
    senderId: doc.senderId,
    receiverId: doc.receiverId,
    text: doc.text || "",
    image: doc.image || "",
    createdAt: doc.createdAt,
  };
}
