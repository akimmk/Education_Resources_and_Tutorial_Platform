const User = require("../models/users.model.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../middleware/cloudinaryConfig.js");
const streamifier = require("streamifier");

const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const verifyUser = await User.findOne({ email });

  try {
    if (verifyUser) {
      return res.status(403).json({
        message: "Email already in used",
      });
    } else {
      bcrypt.hash(password, 10, (_err, hash) => {
        User.create({ name, email, role, password: hash }).then((result) => {
          return res.status(201).json({
            message: "User Successfully Created",
            result: result,
          });
        });
      });
    }
  } catch (err) {
    console.log("unable to create user: " + err);
    return res.status(412).json({
      message: "Failed to registrer user",

      success: false,
    });
  }
};

const getUser = async (_req, res) => {
  const { _id, role } = res.locals.user;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Invalid ID" });
  }
};

const updateProfile = async (req, res) => {
  const { _id, role } = res.locals.user;
  console.log("id", _id, role);
  try {
    if (role === "admin" || _id.toString() === req.params.id) {
      if (req.body.name || req.body.profile || req.body.mobile || req.file) {
        const update = {
          ...req.body,
        };
        if (req.file) {
          const profile = await new Promise((resolve, result) => {
            const cld_profile_upstream = cloudinary.uploader.upload_stream(
              { folder: 'profiles', },
              (error, result) => {
                if (result) {
                  resolve(result);
                } else {
                  resolve(error);
                }
              }
            );

            streamifier.createReadStream(req.file.buffer).pipe(cld_profile_upstream);
          });

          const url = cloudinary.url(profile.public_id, {
            transformation: [
              {
                quality: 'auto',
                fetch_format: 'auto'
              }
            ]
          });
          console.log("profile url", url);
          update.profile = url;
        }
        const user = await User.findByIdAndUpdate(req.params.id, update, {
          new: true,
        });
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
      } else {
        res.status(400).json({ message: "No updated field provided" });
      }
    } else {
      return res.status(403).json({ message: "Forbidden: Unauthorized user" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteAccount = async (req, res) => {
  const { _id, role } = res.locals.user;

  try {
    if (role === "admin" || _id.toString() === req.body.id) {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User Deleted Successfully" });
    } else {
      return res.status(403).json({ message: "Forbidden: Unauthorized user" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePassword = async (req, res) => {
  const { _id, role } = res.locals.user;
  try {
    if (role === "admin" || _id.toString() === req.params.id) {
      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(_id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const match = await bcrypt.compare(oldPassword, user.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);

      user.password = hashedPassword;

      await user.save();

      res.status(200).json({ message: "Password updated successfully" });
    } else {
      return res.status(403).json({ message: "Forbidden: Unauthorized user" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  updateProfile,
  deleteAccount,
  createUser,
  updatePassword,
  getUser,
  getUserById,
};
