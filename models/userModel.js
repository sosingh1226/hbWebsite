const mongoose = require("mongoose");
const Post = require("./postModel");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Enter a valid email"],
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
  },
  displayName: {
    type: String,
    required: true,
  },
  confirmed: { type: Boolean, default: false },
});

userSchema.post("findOneAndDelete", async (user) => {
  try {
    await Post.deleteMany({ authorId: user._id });
  } catch (err) {
    console.log(err);
  }
});

module.exports = User = mongoose.model("user", userSchema);