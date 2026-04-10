const Joi = require("joi");

exports.getparmasIdSchema = Joi.object({
    caseId: Joi.number().required()
});