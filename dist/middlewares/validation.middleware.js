"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = exports.generalFields = void 0;
const zod_1 = require("zod");
const error_response_1 = require("../utils/response/error.response");
exports.generalFields = {
    username: zod_1.z.string().min(3).max(25),
    email: zod_1.z.email(),
    password: zod_1.z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}/),
    confirmPassword: zod_1.z.string()
};
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationErrors.push({ key, issues: errors.issues.map(issue => { return { message: issue.message, path: issue.path[0] }; }) });
            }
        }
        ;
        if (validationErrors.length) {
            throw new error_response_1.BadRequestException("validation Error", { validationErrors });
        }
        ;
        return next();
    };
};
exports.validation = validation;
