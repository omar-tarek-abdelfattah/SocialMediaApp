import { z } from 'zod'
import { generalFields } from '../../middlewares/validation.middleware'




export const login = {
    body: z.strictObject({
        email: generalFields.email,
        password: generalFields.password
    })
}

export const confirmEmail = {
    body: z.strictObject({
        email: generalFields.email,
        otp: generalFields.otp
    })
}


export const signup = {
    body: login.body.extend({
        username: generalFields.username,
        confirmPassword: generalFields.confirmPassword
    }).superRefine((data, ctx) => {
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: 'custom',
                path: ["confirmPassword"],
                message: `password mismatches the confirm password`
            })

            if (data.username.split(" ")?.length != 2) {
                ctx.addIssue({
                    code: `custom`,
                    path: ['username'],
                    message: `username must consist of 2 parts. EX: John Doe`
                })
            }
        }
    })
}

export const signUpWithGmail = {
    body: z.strictObject({
        idToken: z.string()
    })
}