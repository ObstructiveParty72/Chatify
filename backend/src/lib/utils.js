import crypto from "crypto";

// Generate a unique document ID
export const generateId = () => crypto.randomUUID();
