const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Otp = require("../models/Otp");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Profile = require("../models/Profile");

// Route 1: POST request for OTP verification
router.post(
  "/verifyotp",
  [
    body("phone", "Enter a valid phone number").isLength({ min: 10 }),
    body("otp", "Enter a valid OTP").isLength({ min: 4 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      console.log("Entered verifyotp");
      const { phone, otp } = req.body;
      const verifyOtp = await Otp.findOne({ phone });

      if (!verifyOtp) {
        return res.status(404).send("OTP has expired");
      }

      if (verifyOtp.otp === otp) {
        const shortUuid = `GN${uuidv4()}`;
        const oid = shortUuid.substr(0, 10);
        console.log(phone);
        const profile = await Profile.findOne({ phone });

        await Otp.findOneAndDelete({ phone });

        if (profile) {
          res.json({ message: "OTP verified", profile });
          console.log("OTP verified");
        } else {
          res.json({ message: "OTP verified", uid: oid });
          console.log("OTP verified");
        }
      } else {
        console.log("OTP not verified");
        return res.status(404).send("OTP not verified");
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Route 2: POST request for sending OTP
router.post(
  "/sendotp",
  [body("phone", "Enter a valid phone number").isLength({ min: 10 })],
  async (req, res) => {
    try {
      const { phone } = req.body;
      console.log(phone);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Send OTP via Fast2SMS using Axios
      const response = await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
          sender_id: "FSTSMS",
          message: `Your OTP is ${otp}. It is valid for 5 minutes. Do not share your OTP with anyone.`,
          language: "english",
          route: "p",
          numbers: phone,
        },
        {
          headers: {
            authorization: "eNMeFaVi5ymMEsDUwtGOEBm2tLGIwETZWNOj3c9p9jsw5ACMUeJt7p9YbTFS",
            "Content-Type": "application/json",
          },
        }
      );

      // response();

      console.log(response.data);

      // Save OTP to database
      const newOtp = new Otp({ phone, otp });
      await newOtp.save();

      res.json("OTP sent successfully");
    } catch (error) {
      console.error("Error sending OTP via Fast2SMS:", error.message);
      res.status(500).send("Error sending OTP");
    }
  }
);

module.exports = router;
