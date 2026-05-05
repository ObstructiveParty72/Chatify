import { getCloudant, DB_USERS } from "../lib/db.js";
import { generateId } from "../lib/utils.js";

// Create or update a user document in Cloudant
export async function upsertUser({ id, email, fullName, profilePic }) {
  const cloudant = getCloudant();
  const now = new Date().toISOString();

  // Try to find existing user by their App ID subject
  let existingDoc = null;
  try {
    const response = await cloudant.getDocument({ db: DB_USERS, docId: id });
    existingDoc = response.result;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const doc = {
    _id: id,
    type: "user",
    email,
    fullName,
    profilePic: profilePic || existingDoc?.profilePic || "",
    createdAt: existingDoc?.createdAt || now,
    updatedAt: now,
  };

  if (existingDoc) {
    doc._rev = existingDoc._rev;
  }

  await cloudant.postDocument({ db: DB_USERS, document: doc });
  return sanitizeUser(doc);
}

// Find a user by document ID
export async function findUserById(userId) {
  const cloudant = getCloudant();

  try {
    const response = await cloudant.getDocument({ db: DB_USERS, docId: userId });
    if (response.result.type !== "user") return null;
    return sanitizeUser(response.result);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// Find a user by email
export async function findUserByEmail(email) {
  const cloudant = getCloudant();

  const response = await cloudant.postFind({
    db: DB_USERS,
    selector: { type: "user", email },
    limit: 1,
  });

  if (response.result.docs.length === 0) return null;
  return sanitizeUser(response.result.docs[0]);
}

// Check if a user exists by ID
export async function userExists(userId) {
  const user = await findUserById(userId);
  return user !== null;
}

// Find all users except the given one
export async function findAllUsersExcept(excludeUserId) {
  const cloudant = getCloudant();

  const response = await cloudant.postFind({
    db: DB_USERS,
    selector: { type: "user" },
    limit: 200,
  });

  return response.result.docs
    .filter((doc) => doc._id !== excludeUserId)
    .map(sanitizeUser);
}

// Find users by an array of IDs
export async function findUsersByIds(userIds) {
  if (!userIds.length) return [];

  const cloudant = getCloudant();

  const response = await cloudant.postAllDocs({
    db: DB_USERS,
    keys: userIds,
    includeDocs: true,
  });

  return response.result.rows
    .filter((row) => row.doc && row.doc.type === "user")
    .map((row) => sanitizeUser(row.doc));
}

// Update profile picture
export async function updateUserProfilePic(userId, profilePicUrl) {
  const cloudant = getCloudant();

  const response = await cloudant.getDocument({ db: DB_USERS, docId: userId });
  const doc = response.result;

  doc.profilePic = profilePicUrl;
  doc.updatedAt = new Date().toISOString();

  await cloudant.postDocument({ db: DB_USERS, document: doc });
  return sanitizeUser(doc);
}

// Strip internal Cloudant fields, return a clean user object
function sanitizeUser(doc) {
  return {
    _id: doc._id,
    email: doc.email,
    fullName: doc.fullName,
    profilePic: doc.profilePic || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
