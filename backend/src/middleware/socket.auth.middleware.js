import { findUserById } from "../models/User.js";

// Socket.IO authentication middleware using session cookies
// Instead of parsing JWT, we use the shared express-session middleware
export const createSocketAuthMiddleware = (sessionMiddleware) => {
  return (socket, next) => {
    // Run the express-session middleware on the socket handshake request
    sessionMiddleware(socket.request, {}, async () => {
      try {
        const session = socket.request.session;
        const passportUser = session?.passport?.user;

        if (!passportUser || !passportUser._id) {
          console.log("Socket connection rejected: No session found");
          return next(new Error("Unauthorized - No Session"));
        }

        // Look up the user from Cloudant to ensure they still exist
        const user = await findUserById(passportUser._id);
        if (!user) {
          console.log("Socket connection rejected: User not found");
          return next(new Error("User not found"));
        }

        // Attach user info to socket
        socket.user = user;
        socket.userId = user._id;

        console.log(`Socket authenticated for user: ${user.fullName} (${user._id})`);
        next();
      } catch (error) {
        console.log("Error in socket authentication:", error.message);
        next(new Error("Unauthorized - Authentication failed"));
      }
    });
  };
};
