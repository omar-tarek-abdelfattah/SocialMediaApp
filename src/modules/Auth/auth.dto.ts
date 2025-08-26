
import * as validators from './auth.validation'
import { z } from 'zod'
// export interface ISignupBodyInputs {
//     username: string,
//     password: string,
//     email: string
// }


export type ISignupBodyInputsDto = z.infer<typeof validators.signup.body>