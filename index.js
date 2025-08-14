const express = require("express");
const twilio = require("twilio");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint to serve Firebase config
app.get("/api/firebase-config", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  });
});

// Debug middleware to log requests
app.use((req, res, next) => {
  if (req.method === "POST") {
    console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);
  }
  next();
});

app.post("/api/send-sms", async (req, res) => {
  try {
    console.log("Processing SMS request...");

    // Log environment variables (securely)
    console.log("Environment check:", {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? "Set" : "Not set",
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? "Set" : "Not set",
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? "Set" : "Not set",
    });

    const { to, message } = req.body;

    if (!to || !message) {
      console.log("Missing required fields");
      return res.status(400).json({
        error: "Phone number and message are required",
      });
    }

    // Validate Twilio credentials
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.log("Missing Twilio credentials");
      return res.status(500).json({
        error: "Twilio credentials not properly configured",
      });
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    console.log("Sending message to:", to);

    const twilioMessage = await client.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log("Twilio response:", twilioMessage.sid);

    return res.status(200).json({
      success: true,
      messageId: twilioMessage.sid,
    });
  } catch (error) {
    console.error("Error in /api/send-sms:", error);
    return res.status(500).json({
      error: "Failed to send SMS",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
