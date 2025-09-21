import { z } from 'zod'
import { logoutEnum } from '../../utils/security/token.security'
import { Types } from 'mongoose'
import { GenderEnum } from '../../DB/models/User.model'
import { generalFields } from '../../middlewares/validation.middleware'

export const logout = {
    body: z.strictObject({
        flag: z.enum(logoutEnum).default(logoutEnum.only)
    })
}

export const freezeAccount = {
    params: z.object({
        userId: z.string().optional()
    }).optional().refine((data) => { return data?.userId ? Types.ObjectId.isValid(data.userId) : true }, { error: "invalid objectId format", path: ["userId"] })
}
export const restoreAccount = {
    params: z.object({
        userId: z.string()
    }).refine((data) => { return data?.userId ? Types.ObjectId.isValid(data.userId) : true }, { error: "invalid objectId format", path: ["userId"] })
}
export const updateBasic = {
    body: z.strictObject({
        gender: z.enum(GenderEnum).default(GenderEnum.male).optional(),
        username: z.string().optional(),
        address: z.string().optional()
    })
}
export const updatePasswordRequest = {
    body: z.strictObject({
        email: generalFields.email,
    })
}
export const updatePassword = {
    body: z.strictObject({
        email: generalFields.email,
        otp: generalFields.otp,

        oldPassword: generalFields.password,
        newPassword: generalFields.password,
        confirmNewPassword: generalFields.confirmPassword,
    }).refine(data => {
        return data.confirmNewPassword === data.newPassword
    }, { error: `confirm password doesn't match with password`, path: ['confirmPassword'] })
}

export const enable2Fa = {
    body: z.object({
        email: generalFields.email.optional()
    }).optional()
}
export const verify2Fa = {
    body: z.strictObject({
        email: generalFields.email,
        otp: generalFields.otp
    })
}

export const hardDelete = restoreAccount