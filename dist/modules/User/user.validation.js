"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardDelete = exports.verify2Fa = exports.enable2Fa = exports.updatePassword = exports.updatePasswordRequest = exports.updateBasic = exports.restoreAccount = exports.freezeAccount = exports.logout = void 0;
const zod_1 = require("zod");
const token_security_1 = require("../../utils/security/token.security");
const mongoose_1 = require("mongoose");
const User_model_1 = require("../../DB/models/User.model");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
exports.logout = {
    body: zod_1.z.strictObject({
        flag: zod_1.z.enum(token_security_1.logoutEnum).default(token_security_1.logoutEnum.only)
    })
};
exports.freezeAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string().optional()
    }).optional().refine((data) => { return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true; }, { error: "invalid objectId format", path: ["userId"] })
};
exports.restoreAccount = {
    params: zod_1.z.object({
        userId: zod_1.z.string()
    }).refine((data) => { return data?.userId ? mongoose_1.Types.ObjectId.isValid(data.userId) : true; }, { error: "invalid objectId format", path: ["userId"] })
};
exports.updateBasic = {
    body: zod_1.z.strictObject({
        gender: zod_1.z.enum(User_model_1.GenderEnum).default(User_model_1.GenderEnum.male).optional(),
        username: zod_1.z.string().optional(),
        address: zod_1.z.string().optional()
    })
};
exports.updatePasswordRequest = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
    })
};
exports.updatePassword = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp,
        oldPassword: validation_middleware_1.generalFields.password,
        newPassword: validation_middleware_1.generalFields.password,
        confirmNewPassword: validation_middleware_1.generalFields.confirmPassword,
    }).refine(data => {
        return data.confirmNewPassword === data.newPassword;
    }, { error: `confirm password doesn't match with password`, path: ['confirmPassword'] })
};
exports.enable2Fa = {
    body: zod_1.z.object({
        email: validation_middleware_1.generalFields.email.optional()
    }).optional()
};
exports.verify2Fa = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        otp: validation_middleware_1.generalFields.otp
    })
};
exports.hardDelete = exports.restoreAccount;
