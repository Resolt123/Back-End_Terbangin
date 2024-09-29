const express = require("express");
const router = express.Router();
const otpController = require("../../controllers/otp");
const linkController = require("../../controllers/link");

router.post("/generate-otp-email", otpController.generateOTPEmail);
// router.post("/generate-otp-sms", otpController.generateOTPSMS);
router.post("/verify-otp", otpController.verifyOTP);
router.post("/generate-link", linkController.generateLink);
router.get("/verify-link", linkController.verifyLink);
router.patch("/update-password", linkController.updatePassword);

module.exports = router;
