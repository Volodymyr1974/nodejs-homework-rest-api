const express = require("express");
const User = require("../../models/user");
const { RequestError } = require("../../helpers");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { SECRET_KEY } = process.env;
const authenticate = require("../../middlewares/authenticate");

const Joi = require("joi");
const userSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().min(6).required(),
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
    const result = await User.create({
      email,
      password: hashPassword,
      subscription,
    });
    res.status(201).json({
      email: result.email,
      subscription: result.subscription,
    });
  } catch (error) {
    next(error);
  }
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
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw RequestError(401, "Email or password is wrong");
    }
    const payload = {
      id: user._id,
    };
    const token = jwt.sign(payload, SECRET_KEY);
    res.status(201).json({
      token,
      email: user.email,
      subscription: user.subscription,
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
