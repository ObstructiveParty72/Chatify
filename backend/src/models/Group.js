import { getCloudant, DB_GROUPS } from "../lib/db.js";
import { generateId } from "../lib/utils.js";

export async function createGroup({ name, description, members, adminId, image }) {
  const cloudant = getCloudant();

  const doc = {
    _id: generateId(),
    type: "group",
    name,
    description: description || "",
    members: members || [adminId], // Ensure admin is a member
    adminId,
    image: image || "",
    createdAt: new Date().toISOString(),
  };

  await cloudant.postDocument({ db: DB_GROUPS, document: doc });
  return sanitizeGroup(doc);
}

export async function findGroupsByMember(userId) {
  const cloudant = getCloudant();

  const response = await cloudant.postFind({
    db: DB_GROUPS,
    selector: {
      type: "group",
      members: { "$elemMatch": { "$eq": userId } }
    },
    sort: [{ createdAt: "desc" }],
    limit: 100,
  });

  return response.result.docs.map(sanitizeGroup);
}

export async function findGroupById(groupId) {
  const cloudant = getCloudant();
  try {
    const response = await cloudant.getDocument({ db: DB_GROUPS, docId: groupId });
    return sanitizeGroup(response.result);
  } catch (error) {
    return null;
  }
}

export async function updateGroup(groupId, { name, description, image, members }) {
  const cloudant = getCloudant();
  
  const response = await cloudant.getDocument({ db: DB_GROUPS, docId: groupId });
  const doc = response.result;

  if (name) doc.name = name;
  if (description !== undefined) doc.description = description;
  if (image) doc.image = image;
  if (members) doc.members = members;
  
  doc.updatedAt = new Date().toISOString();

  await cloudant.postDocument({ db: DB_GROUPS, document: doc });
  return sanitizeGroup(doc);
}

function sanitizeGroup(doc) {
  return {
    _id: doc._id,
    name: doc.name,
    description: doc.description,
    members: doc.members,
    adminId: doc.adminId,
    image: doc.image,
    createdAt: doc.createdAt,
    isGroup: true // Helper flag for frontend
  };
}
