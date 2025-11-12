import redis from "../conf/redis.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";
import User from "../models/Users.js";
import {
  createMailOptions,
  otpEmailTemplate,
  transporter,
} from "../conf/mail.conf.js";
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Generate Tokens
export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, name: user.name, year: user.year },
    JWT_SECRET,
    { expiresIn: "30m" }
  );

  const refreshToken = jwt.sign({ id: user._id }, REFRESH_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

// Refresh Tokens
export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: "Token required" });

  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.refreshTokens.includes(token))
      return res.status(403).json({ message: "Invalid refresh token" });

    // Replace old token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);

    const newTokens = generateTokens(user);
    user.refreshTokens.push(newTokens.refreshToken);
    await user.save();

    return res.status(200).json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (err) {
    console.error("refreshToken error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// EMAIL

const sendOtpEmail = async (email, otp) => {
  const html = otpEmailTemplate(otp);
  const mailOptions = createMailOptions(email, html);
  await transporter.sendMail(mailOptions);
};

// USER HELPERS
export const checkUserExists = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  return user;
};

// SEND OTP
export const sendOtp = async (user, type = "signup") => {
  try {
    const { name, email, password, year } = user;

    if (
      (type === "signup" && (!email || !name || !year || !password)) ||
      (type === "reset" && !email)
    ) {
      return { success: false, status: 400, message: "All fields required" };
    }

    const exists = await checkUserExists(email);
    if (type === "signup" && exists)
      return {
        success: false,
        status: 409,
        message: "Email already registered",
      };
    if (type === "reset" && !exists)
      return { success: false, status: 404, message: "User not found" };

    let otp = await redis.get(`otp:${email}`);
    if (!otp) {
      otp = otpGenerator.generate(6, {
        digits: true,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });
      await redis.setex(`otp:${email}`, 300, otp); // 5 min expiry
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      const tempData =
        type === "signup"
          ? { name, email, password: hashedPassword, year }
          : { email, password: hashedPassword };

      await redis.setex(`tempUser:${email}`, 300, JSON.stringify(tempData));
    }

    await sendOtpEmail(email, otp);
    return { success: true, status: 200, message: "OTP sent to email" };
  } catch (err) {
    console.error("sendOtp error:", err);
    return { success: false, status: 500, message: "Failed to send OTP" };
  }
};

//RESEND OTP
export const resendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res
        .status(400)
        .json({ success: false, message: "Email and type required" });
    }

    // Check user existence based on type
    const exists = await checkUserExists(email);
    if (type === "signup" && exists) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }
    if (type === "reset" && !exists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Call existing sendOtp function
    const result = await sendOtp({ email }, type);

    return res.status(result.status).json(result);
  } catch (err) {
    console.error("resendOtp error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to resend OTP" });
  }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    if (type === "signup") {
      const tempUserData = await redis.get(`tempUser:${email}`);
      if (!tempUserData)
        return res.status(400).json({ message: "Session expired" });

      const userData = tempUserData;

      // Create the user
      const newUser = new User(userData); // create a Mongoose document
      const { accessToken, refreshToken } = generateTokens(newUser);

      // Save the refresh token to user
      newUser.refreshTokens = [refreshToken];
      await newUser.save();

      // Cleanup Redis
      await redis.del(`otp:${email}`);
      await redis.del(`tempUser:${email}`);

      return res.status(200).json({
        message: "Signup successful",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          year: newUser.year,
        },
        accessToken,
        refreshToken,
      });
    }

    if (type === "reset") {
      const tempUserData = await redis.get(`tempUser:${email}`);
      if (!tempUserData)
        return res.status(400).json({ message: "Session expired" });

      const { password } = tempUserData;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      await User.updateOne({ email }, { password });

      await redis.del(`otp:${email}`);
      await redis.del(`tempUser:${email}`);

      return res.status(200).json({ message: "Password reset successful" });
    }

    return res.status(400).json({ message: "Invalid request type" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
