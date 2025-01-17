const express = require("express");
const User = require("../../models/user");
const { RequestError, sendEmail } = require("../../helpers");
const { BASE_URL } = process.env;
const router = express.Router();
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const { SECRET_KEY } = process.env;
const authenticate = require("../../middlewares/authenticate");
const upload = require("../../middlewares/upload");
const fs = require("fs/promises");
const Jimp = require("jimp");
const Joi = require("joi");
const path = require("path");

const userSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().min(6).required(),
});
const verifyEmailSchema = Joi.object({
  email: Joi.string().required(),
});
router.post("/register", async (req, res, next) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      throw RequestError(400, error.message);
    }
    const { email, password, subscription } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw RequestError(409, "Email in use");
    }
    const hashPassword = await bcrypt.hash(password, bcrypt.genSaltSync(10));
    const avatarURL = gravatar.url(email);
    const verificationToken = nanoid();
    const result = await User.create({
      email,
      password: hashPassword,
      subscription,
      avatarURL,
      verificationToken,
    });
    const mail = {
      to: email,
      subject: "Підтвердження реєстрації",
      html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}" >Натисніть для підтвердження</a>`,
    };
    await sendEmail(mail);
    res.status(201).json({
      email: result.email,
      subscription: result.subscription,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:verificationToken", async (req, res, next) => {
  const { verificationToken } = req.params;
  try {
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw RequestError(404, "User not found");
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: "",
    });
    res.json({
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
});
router.post("/verify", async (req, res, next) => {
  const { error } = verifyEmailSchema.validate(req.body);
  if (error) {
    throw RequestError(400, "missing required field email");
  }
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw RequestError(404, "User not found");
  }
  if (user.verify) {
    throw RequestError(400, "Verification has already been passed");
  }
  const mail = {
    to: email,
    subject: "Підтвердження реєстрації",
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationToken}" >Натисніть для підтвердження</a>`,
  };
  await sendEmail(mail);
  res.json({
    message: "Verification email sent",
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      throw RequestError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw RequestError(401, "Email or password is wrong");
    }
    if (!user.verify) {
      throw RequestError(401, "Email is not verify");
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw RequestError(401, "Email or password is wrong");
    }
    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY);
    await User.findByIdAndUpdate(user._id, { token });
    res.status(201).json({
      token,
      email: user.email,
      subscription: user.subscription,
    });
  } catch (error) {
    next(error);
  }
});
router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).json();
});
router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    const { _id } = req.user;
    const { path: tempUpload, originalname } = req.file;

    const file = await Jimp.read(tempUpload);
    await file.resize(250, Jimp.AUTO);
    await file.writeAsync(tempUpload);
    const filename = `${_id}${originalname}`;

    const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

    try {
      const resultUpload = path.join(avatarsDir, filename);
      await fs.rename(tempUpload, resultUpload);
      const avatarURL = path.join("avatars", filename);

      await User.findByIdAndUpdate(_id, { avatarURL });
      res.json({ avatarURL });
    } catch (error) {
      await fs.unlink(tempUpload);
      next(error);
    }
  }
);
router.get("/current", authenticate, async (req, res, next) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription,
  });
});
module.exports = router;
