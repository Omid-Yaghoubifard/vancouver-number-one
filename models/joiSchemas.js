const Joi      = require("@hapi/joi"),
      userName = Joi.string().min(3).max(30).required(),
      Email    = Joi.string().email().lowercase().required(),
      Password = Joi.string().min(8).max(50).required(),
      Title    = Joi.string().max(100).uppercase().required(),
      Body     = Joi.string().max(5000).required(),
      Category = Joi.string().valid("Natural", "Cultural", "Events", "Man-Made").required();


const userDataSchema = Joi.object().keys({
    username: userName,
    email: Email,
    password: Password,
});

const authDataSchema = Joi.object().keys({
    username: userName,
    password: Password,
});

const postDataSchema = Joi.object().keys({
    title: Title,
    body: Body,
    category: Category,
});

module.exports = {
    "users": userDataSchema,
    "auth": authDataSchema,
    "post": postDataSchema
};