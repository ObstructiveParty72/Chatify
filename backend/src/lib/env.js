import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,

  // IBM Cloudant
  CLOUDANT_URL: process.env.CLOUDANT_URL,
  CLOUDANT_APIKEY: process.env.CLOUDANT_APIKEY,

  // IBM App ID
  APP_ID_CLIENT_ID: process.env.APP_ID_CLIENT_ID,
  APP_ID_CLIENT_SECRET: process.env.APP_ID_CLIENT_SECRET,
  APP_ID_CALLBACK_URL: process.env.APP_ID_CALLBACK_URL,
  APP_ID_ISSUER: process.env.APP_ID_ISSUER,
  APP_ID_AUTHORIZATION_URL: process.env.APP_ID_AUTHORIZATION_URL,
  APP_ID_TOKEN_URL: process.env.APP_ID_TOKEN_URL,
  APP_ID_USERINFO_URL: process.env.APP_ID_USERINFO_URL,

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET,

  // Resend
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
