const express = require("express");
const { isValidObjectId } = require("mongoose");
const Contact = require("../../models/contact");
const authenticate = require("../../middlewares/authenticate");

const { RequestError } = require("../../helpers");
const router = express.Router();
const Joi = require("joi");
const addSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean(),
});
const updateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
});
router.get("/", authenticate, async (_, res, next) => {
  try {
    const result = await Contact.find();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const isValideId = isValidObjectId(contactId);
    if (!isValideId) {
      throw RequestError(404, `id ${contactId} is not valid`);
    }
    const result = await Contact.findById({ _id: contactId });
    if (!result) {
      throw RequestError(404, "Not found");
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { error } = addSchema.validate(req.body);
    if (error) {
      throw RequestError(400, error.message);
    }
    const result = await Contact.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const isValideId = isValidObjectId(contactId);
    if (!isValideId) {
      throw RequestError(404, `id ${contactId} is not valid`);
    }
    const result = await Contact.findByIdAndRemove(contactId);
    if (!result) {
      throw RequestError(404, "Not found");
    }
    res.json({ message: "contact deleted" });
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", authenticate, async (req, res, next) => {
  try {
    const { error } = addSchema.validate(req.body);
    if (error) {
      throw RequestError(400, error.message);
    }
    const { contactId } = req.params;
    const isValideId = isValidObjectId(contactId);
    if (!isValideId) {
      throw RequestError(404, `id ${contactId} is not valid`);
    }
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {
      new: true,
    });
    if (!result) {
      throw RequestError(404, "Not found");
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch("/:contactId/favorite", authenticate, async (req, res, next) => {
  try {
    const { error } = updateFavoriteSchema.validate(req.body);

    if (error) {
      throw RequestError(400, "missing field favorite");
    }

    const { contactId } = req.params;
    const isValideId = isValidObjectId(contactId);
    if (!isValideId) {
      throw RequestError(404, `id ${contactId} is not valid`);
    }
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {
      new: true,
    });
    if (!result) {
      throw RequestError(404, "Not found");
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});
module.exports = router;
