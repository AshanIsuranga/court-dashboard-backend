const Joi = require("joi");

exports.loginUserSchema = Joi.object({
  userName: Joi.string().required(),
  password: Joi.string().required(),
});

exports.logInUpdate = Joi.object({
  password: Joi.string().required(),
});
