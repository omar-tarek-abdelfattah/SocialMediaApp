"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = exports.generalFields = void 0;
const zod_1 = require("zod");
const error_response_1 = require("../utils/response/error.response");
const mongoose_1 = require("mongoose");
exports.generalFields = {
    username: zod_1.z.string().min(3).max(25),
    email: zod_1.z.email(),
    password: zod_1.z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}/),
    confirmPassword: zod_1.z.string(),
    otp: zod_1.z.string().regex(/^\d{6}$/),
    file: function (mimetype) {
        return zod_1.z.strictObject({
            fieldname: zod_1.z.string(),
            originalname: zod_1.z.string(),
            encoding: zod_1.z.string(),
            mimetype: zod_1.z.enum(mimetype),
            buffer: zod_1.z.any().optional(),
            path: zod_1.z.string().optional(),
            size: zod_1.z.number()
        }).refine((data) => {
            return data.buffer || data.path;
        }, { error: "neither path or buffer is provided", path: ["file"] });
    }, id: zod_1.z.string().refine(data => { return mongoose_1.Types.ObjectId.isValid(data); }, { error: "invalid object id format " })
};
const validation = (schema) => {
    return (req, res, next) => {
        const validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key])
                continue;
            if (req.file) {
                req.body.attachment = req.file;
            }
            if (req.files) {
                req.body.attachments = req.files;
            }
            const validationResult = schema[key].safeParse(req[key]);
            if (!validationResult.success) {
                const errors = validationResult.error;
                validationErrors.push({ key, issues: errors.issues.map(issue => { return { message: issue.message, path: issue.path }; }) });
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
