import type { NextFunction, Request, Response } from "express"
import { z, type ZodError, type ZodType } from "zod"
import { BadRequestException } from "../utils/response/error.response"
import { Types } from "mongoose"

export const generalFields = {
    username: z.string().min(3).max(25),
    email: z.email(),
    password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}/),
    confirmPassword: z.string(),
    otp: z.string().regex(/^\d{6}$/),
    file: function (mimetype: string[]) {
        return z.strictObject({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.enum(mimetype),
            buffer: z.any().optional(),
            path: z.string().optional(),
            size: z.number()
        }).refine((data) => {
            return data.buffer || data.path
        }, { error: "neither path or buffer is provided", path: ["file"] })
    }, id: z.string().refine(data => { return Types.ObjectId.isValid(data) }, { error: "invalid object id format " })
}


type KeyReqType = keyof Request
type SchemaType = Partial<Record<KeyReqType, ZodType>>

type validationErrors = Array<{
    key: KeyReqType,
    issues: Array<{
        message: string,
        path: (string | number | symbol | undefined)[]
    }>
}>

export const validation = (schema: SchemaType) => {


    return (req: Request, res: Response, next: NextFunction): NextFunction => {

        const validationErrors: validationErrors = []

        for (const key of Object.keys(schema) as KeyReqType[]) {
            if (!schema[key]) continue;


            if (req.file) {
                req.body.attachment = req.file
            }
            if (req.files) {
                req.body.attachments = req.files
            }

            const validationResult = schema[key].safeParse(req[key])

            if (!validationResult.success) {
                const errors = validationResult.error as ZodError
                validationErrors.push({ key, issues: errors.issues.map(issue => { return { message: issue.message, path: issue.path } }) })
            }

        };

        if (validationErrors.length) {
            throw new BadRequestException("validation Error", { validationErrors });
        };


        return next() as unknown as NextFunction
    }
}