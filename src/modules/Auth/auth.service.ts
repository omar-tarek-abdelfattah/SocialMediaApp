import type { Request, Response } from "express"
import type { IGmail, ILoginBodyInputsDto, IResetPasswordInputsDTO, ISendForgotCodeDTO, ISignupBodyInputsDto, IVerify2FaBodyInputs } from "./auth.dto.js";
import { HUserDocument, providerEnum, UserModel } from "../../DB/models/User.model.js";
import { BadRequestException, ConflictException, NotFoundException } from "../../utils/response/error.response.js";
import { compareHash, generateHash } from "../../utils/security/hash.security.js";
import { emailEvent } from "../../utils/events/email.event.js";
import { generateNumberOtp } from "../../utils/email/otp.js";
import { createLoginCredentials } from "../../utils/security/token.security.js";
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { successResponse } from "../../utils/response/success.response.js";
import { ILoginResponse } from "./auth.entities.js";
import { UserRepository } from "../../DB/repositories";


class AuthenticationService {
    private userModel = new UserRepository(UserModel)
    constructor(
    ) { }


    /**
     * 
     * @param req -Express.Request
     * @param res -Express.Response
     * @returns Promise<Response>
     * @example({ username, email, password }: ISignupBodyInputsDto)
     * return {message : 'Done' , statusCode:201}
     */

    private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_ID?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new BadRequestException(`failed to verify this google account`)
        }
        return payload
    }



    loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: IGmail = req.body

        const { email } = await this.verifyGmailAccount(idToken)


        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: providerEnum.google
            },
        })

        if (!user) {
            throw new NotFoundException(`not registered account, or different provider`)
        }

        const credentials = await createLoginCredentials(user as HUserDocument)

        return res.status(200).json({ message: "done", data: { credentials } })
    }


    signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
        const { idToken }: IGmail = req.body

        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken)


        const user = await this.userModel.findOne({
            filter: { email },
        })

        if (user) {
            if (user.provider === providerEnum.google) {
                return this.loginWithGmail(req, res)
            }
            throw new ConflictException(`this user exists by different provider`)
        }

        const [newUser] = await this.userModel.create({
            data:
                [
                    {
                        firstName: given_name as string,
                        email: email as string,
                        lastName: family_name as string,
                        profileImage: picture as string,
                        confirmEmail: new Date()
                    }
                ]
        }) || []


        if (!newUser) {
            throw new BadRequestException(`failed to signup with gmail, try again later`)
        }

        const credentials = await createLoginCredentials(newUser)

        return res.status(201).json({ message: "done", data: { credentials } })
    }
    signup = async (req: Request, res: Response): Promise<Response> => {


        let { username, email, password }: ISignupBodyInputsDto = req.body;
        const otp: number = generateNumberOtp()

        if (await this.userModel.findOne({ filter: { email } })) {
            throw new ConflictException(`Email already exists`)
        }

        const [user] = await this.userModel.createUser({
            data: [{ username, email, password, confirmEmailOtp: `${otp}` }],
            options: {
                validateBeforeSave: true
            }
        }) || [];

        if (!user) {
            throw new BadRequestException('failed to signup')
        }

        // emailEvent.emit(`confirmEmail`, { to: email, otp })

        return res.status(201).json({ message: "done", data: user })
    }

    login = async (req: Request, res: Response): Promise<Response> => {

        const { email, password }: ILoginBodyInputsDto = req.body

        const user = await this.userModel.findOne({
            filter: {
                email
            }
        })

        if (!user) {
            throw new NotFoundException(`Invalid credentials`)
        }

        if (!user.confirmEmail) {
            throw new BadRequestException(`Account not verified, Confirm your email first`)
        }

        if (!await compareHash({ hash: user.password, plainText: password })) {
            throw new NotFoundException(`Invalid credentials`)
        }

        if (user.twoFA_Activated) {
            const otp = generateNumberOtp()
            emailEvent.emit('2FAOtp', { to: email, otp })
            const twoFaUser = await this.userModel.updateOne({ filter: { email, twoFA_Activated: true }, update: { twoFA_Otp: await generateHash(String(otp)) } })
            if (!twoFaUser.modifiedCount) {
                throw new BadRequestException('failed to update this resource')
            }
            return successResponse({ res, message: '2FA Activated, check your email' })
        }

        const credentials = await createLoginCredentials(user as HUserDocument)


        return successResponse<ILoginResponse>({ res, data: { credentials } })
    }

    verify2fa = async (req: Request, res: Response): Promise<Response> => {

        const { otp, email }: IVerify2FaBodyInputs = req.body
        const user = await this.userModel.findOne({
            filter: {
                email,
                twoFA_Otp: { $exists: 1 },
                twoFA_Activated: true,
            }
        })

        if (!user) {
            throw new NotFoundException(`No account found`)
        }

        if (!await compareHash({ hash: user?.twoFA_Otp as string, plainText: otp })) {
            throw new BadRequestException(`Invalid OTP`)
        }


        await this.userModel.updateOne({
            filter: { email },
            update: {
                $unset: {
                    twoFA_Otp: true
                }
            }
        })

        const credentials = await createLoginCredentials(user as HUserDocument)


        // compareHash(otp)
        return successResponse({ res, data: { credentials }, message: 'done' })
    }
    confrmEmail = async (req: Request, res: Response): Promise<Response> => {

        const { otp, email } = req.body
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: 1 },
                confirmEmail: { $exists: 0 },
            }
        })

        if (!user) {
            throw new NotFoundException(`No account found`)
        }

        if (!await compareHash({ hash: user?.confirmEmailOtp as string, plainText: otp })) {
            throw new BadRequestException(`Wrong OTP`)
        }


        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmEmail: new Date(),
                $unset: {
                    confirmEmailOtp: true
                }
            }
        })


        // compareHash(otp)
        return res.status(201).json({ message: "done" })
    }



    sendForgotCode = async (req: Request, res: Response): Promise<Response> => {

        const { email }: ISendForgotCodeDTO = req.body
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: providerEnum.system,
                confirmEmail: { $exists: 1 },
            }
        })

        if (!user) {
            throw new NotFoundException(`invalid or not confirmed account`)
        }

        const otp = generateNumberOtp();

        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await generateHash(String(otp))
            }
        })

        if (!result.matchedCount) {
            throw new BadRequestException(`failed to send the otp`)
        }

        emailEvent.emit(`resetPassword`, { to: email, otp })

        return res.status(201).json({ message: "done" })
    }
    resetPassword = async (req: Request, res: Response): Promise<Response> => {

        const { email, password, otp }: IResetPasswordInputsDTO = req.body
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: providerEnum.system,
                confirmEmail: { $exists: 1 },
                resetPasswordOtp: { $exists: 1 }
            }
        })

        if (!user) {
            throw new NotFoundException(`invalid or not confirmed account`)
        }

        if (!await compareHash({ hash: user.resetPasswordOtp as string, plainText: otp })) {
            throw new BadRequestException(`invalid otp`)
        }


        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await generateHash(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 },

            }
        })

        if (!result.matchedCount) {
            throw new BadRequestException(`failed reset password`)
        }

        emailEvent.emit(`resetPassword`, { to: email, otp })

        return res.status(201).json({ message: "done" })
    }

}

export default new AuthenticationService()