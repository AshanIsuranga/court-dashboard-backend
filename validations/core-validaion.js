const Joi = require("joi");

exports.getparmasIdSchema = Joi.object({
    caseId: Joi.number().required()
});

exports.getConnectionSchema = Joi.object({
    partyId: Joi.number().required(),
    userId: Joi.number().required()
});

exports.getConnectionOrgSchema = Joi.object({
    partyId: Joi.number().required(),
    userId: Joi.number().required(),
    orgId: Joi.number().required(),
    orgUserId: Joi.number().required()
});

exports.getAllConnectionDetailsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
    searchText: Joi.string().allow('').optional(), 
});