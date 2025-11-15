import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    refreshTokens: {
      type: [String],
      default: [],
      // validate: [(arr) => arr.length <= 5, "Too many active sessions"],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
