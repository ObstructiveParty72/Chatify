import { CloudantV1 } from "@ibm-cloud/cloudant";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import { ENV } from "./env.js";

const DB_USERS = "chatify_users";
const DB_MESSAGES = "chatify_messages";
const DB_GROUPS = "chatify_groups";

let cloudant = null;

export const getCloudant = () => cloudant;
export { DB_USERS, DB_MESSAGES, DB_GROUPS };

export const connectDB = async () => {
  try {
    if (!ENV.CLOUDANT_URL || !ENV.CLOUDANT_APIKEY) {
      throw new Error("CLOUDANT_URL and CLOUDANT_APIKEY must be set");
    }

    cloudant = CloudantV1.newInstance({
      authenticator: new IamAuthenticator({ apikey: ENV.CLOUDANT_APIKEY }),
      serviceUrl: ENV.CLOUDANT_URL,
    });

    // Create databases if they don't exist
    for (const db of [DB_USERS, DB_MESSAGES, DB_GROUPS]) {
      try {
        await cloudant.putDatabase({ db });
        console.log(`Created database: ${db}`);
      } catch (error) {
        if (error.status === 412) {
          // Database already exists — that's fine
          console.log(`Database already exists: ${db}`);
        } else {
          throw error;
        }
      }
    }

    try {
      await cloudant.postIndex({
        db: DB_MESSAGES,
        index: { fields: ["type", "createdAt"] },
        name: "message-date-index",
        type: "json",
      });
    } catch (error) {
      if (error.status !== 409) console.warn("Index creation warning:", error.message);
    }

    try {
      await cloudant.postIndex({
        db: DB_MESSAGES,
        index: { fields: ["type", "senderId", "receiverId"] },
        name: "message-participants-index",
        type: "json",
      });
    } catch (error) {
      if (error.status !== 409) console.warn("Index creation warning:", error.message);
    }

    try {
      await cloudant.postIndex({
        db: DB_GROUPS,
        index: { fields: ["type", "members"] },
        name: "group-members-index",
        type: "json",
      });
    } catch (error) {
      if (error.status !== 409) console.warn("Index creation warning:", error.message);
    }

    try {
      await cloudant.postIndex({
        db: DB_USERS,
        index: { fields: ["email"] },
        name: "email-index",
        type: "json",
      });
    } catch (error) {
      if (error.status !== 409) console.warn("Index creation warning:", error.message);
    }

    console.log("IBM CLOUDANT CONNECTED:", ENV.CLOUDANT_URL);
  } catch (error) {
    console.error("Error connecting to IBM Cloudant:", error);
    process.exit(1);
  }
};
