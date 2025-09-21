
import * as validators from './auth.validation'
import { z } from 'zod'



export type ISignupBodyInputsDto = z.infer<typeof validators.signup.body>
export type ILoginBodyInputsDto = z.infer<typeof validators.login.body>
export type IConfirmEmailBodyInputsDto = z.infer<typeof validators.confirmEmail.body>
export type IGmail = z.infer<typeof validators.signUpWithGmail.body>
export type ISendForgotCodeDTO = z.infer<typeof validators.sendForgotCode.body>
export type IResetPasswordInputsDTO = z.infer<typeof validators.resetPassword.body>
export type IVerify2FaBodyInputs = z.infer<typeof validators.verify2fa.body>