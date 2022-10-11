const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { RequestError } = require("../helpers");
const { SECRET_KEY } = process.env;

const authenticate = async (req, res, next) => {
  try {
    const { authorization = "" } = req.headers;
    const [bearer, token] = authorization.split(" ");
    if (bearer !== "Bearer") {
      throw RequestError(401);
    }
    try {
      const { id } = jwt.verify(token, SECRET_KEY);
      //   console.log(User);
      const user = await User.findById(id);

      if (!user) {
        throw Error("Not authorized");
      }
      next();
    } catch (error) {
      throw RequestError(401, error.message);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
