import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate, createInvitationEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to Chatify!",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }

  console.log("Welcome Email sent successfully", data);
};

export const sendInvitationEmail = async (email, inviterName, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: `${inviterName} invited you to Chatify!`,
    html: createInvitationEmailTemplate(inviterName, clientURL),
  });

  if (error) {
    console.error("Error sending invitation email:", error);
    throw new Error("Failed to send invitation email");
  }

  console.log("Invitation Email sent successfully", data);
};
