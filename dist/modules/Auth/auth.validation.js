"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = exports.login = void 0;
const zod_1 = require("zod");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
exports.login = {
    body: zod_1.z.strictObject({
        email: validation_middleware_1.generalFields.email,
        password: validation_middleware_1.generalFields.password
    })
};
exports.signup = {
    body: exports.login.body.extend({
        username: validation_middleware_1.generalFields.username,
        confirmPassword: validation_middleware_1.generalFields.confirmPassword
    }).superRefine((data, ctx) => {
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: 'custom',
                path: ["confirmPassword"],
                message: `password mismatches the confirm password`
            });
            if (data.username.split(" ")?.length != 2) {
                ctx.addIssue({
                    code: `custom`,
                    path: ['username'],
                    message: `username must consist of 2 parts. EX: John Doe`
                });
            }
        }
    })
};
