import { compareHash, generateHash } from './../../utils/security/hash.security';
import { Request, Response } from "express";
import { IFreezeAccountParamsDTO, IHardDeleteAccountParamsDTO, ILogoutBodyInput, IRestoreAccountParamsDTO, IUpdateBasicBodyDTO, IUpdatePasswordBodyDTO } from "./user.dto";
import { createLoginCredentials, createRevokeToken, logoutEnum } from "../../utils/security/token.security";
import { UpdateQuery } from "mongoose";
import { HUserDocument, IUser, roleEnum, UserModel } from "../../DB/models/User.model";
import { UserRepository } from "../../DB/repositories";
import { JwtPayload } from "jsonwebtoken";
import { createPreSignedUploadLink, deleteFiles, deleteFolderByPrefix, uploadFiles } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/multer.cloud";
import { Types } from "mongoose";
import { BadRequestException, ForbiddenException, NotFoundException } from "../../utils/response/error.response";
import { s3Event } from "../../utils/multer/s3.events"; import { emailEvent } from "../../utils/events/email.event";
import { generateNumberOtp } from "../../utils/email/otp";
import { successResponse } from '../../utils/response/success.response';


class UserService {
    private userModel = new UserRepository(UserModel)
    constructor() {

    }

    profile = async (req: Request, res: Response): Promise<Response> => {


        return res.json({ message: `done`, user: req.user, decoded: req.decoded })
    }


    profileImage = async (req: Request, res: Response): Promise<Response> => {



        const { ContentType, OriginalName }: { ContentType: string, OriginalName: string } = req.body
        const { url, key } = await createPreSignedUploadLink({ ContentType, OriginalName, path: `users/${req.decoded?._id}` })

        const user = this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                profileImage: key,
                tempProfileImage: req.user?.profileImage
            }
        })

        if (!user) {
            throw new BadRequestException(`fail to update user profile image`)
        }

        s3Event.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            key,
            expiresIn: 30000
        })
        return res.json({ message: `done`, data: { key, url } })
    }
    coverImages = async (req: Request, res: Response): Promise<Response> => {

        const urls = await uploadFiles({
            storageApproach: StorageEnum.disk,
            files: req.files as Express.Multer.File[],
            path: `users/${req.decoded?._id}/cover`
        })

        const user = this.userModel.findByIdAndUpdate({
            id: req.user?._id as Types.ObjectId,
            update: {
                coverImages: urls
            }
        })

        if (!user) {
            throw new BadRequestException(`failed to update profile cover images`)
        }

        if (req.user?.coverImages) {
            await deleteFiles({ urls: req.user.coverImages })
        }

        return res.json({ message: `done`, data: urls })
    }

    updatePassword = async (req: Request, res: Response): Promise<Response> => {
        const { email, oldPassword, otp, newPassword }: IUpdatePasswordBodyDTO = req.body;


        if (oldPassword === newPassword) {
            throw new BadRequestException('new password cannot be old password')
        }

        const user = await this.userModel.findOne({ filter: { email, resetPasswordOtp: { $exists: 1 } } })
        console.log(user);

        if (!user) {
            throw new NotFoundException(`couldn't find an account that has a reset password request with this email`)
        }
        if (!await compareHash({ plainText: otp, hash: user.resetPasswordOtp as string })) {
            throw new BadRequestException('invalid otp')
        }
        if (!await compareHash({ plainText: oldPassword, hash: user.password as string })) {
            await this.userModel.updateOne({ filter: { email }, update: { changeCredentialsTime: new Date() } })
            throw new BadRequestException('wrong old password, you have been logged out')
        }

        const updatedPassword = await this.userModel.updateOne({
            filter: { email }, update: {
                password: await generateHash(newPassword),
                $unset: { resetPasswordOtp: 1 }
            }
        })
        console.log(updatedPassword);

        if (!updatedPassword.modifiedCount) {
            throw new BadRequestException('failed to update password')
        }

        return res.json({ message: 'password updated' })
    }
    updatePasswordRequest = async (req: Request, res: Response): Promise<Response> => {
        const { email }: { email: string } = req.body;

        const resetPasswordOtp = generateNumberOtp()

        const user = await this.userModel.findOneAndUpdate({ filter: { email }, update: { resetPasswordOtp: await generateHash(String(resetPasswordOtp)) } })
        if (!user) {
            throw new NotFoundException('user not found')
        }

        emailEvent.emit('resetPassword', { to: email, otp: resetPasswordOtp })



        return res.json({ message: 'done ,  check ur email' })
    }


    updateBasic = async (req: Request, res: Response): Promise<Response> => {
        const { address, username, gender }: IUpdateBasicBodyDTO = req.body;

        let update: { firstName?: string, lastName?: string, address?: string, gender?: string } = {}

        if (address) {
            update.address = address
        }

        if (username) {

            const [firstName, lastName] = username.split(' ') || []
            update.firstName = firstName as string
            update.lastName = lastName as string
        }

        if (gender) {
            update.gender = gender
        }

        console.log(update);

        const updatedUser = await this.userModel.updateOne({
            filter: { _id: req.user?._id },
            update
        })

        if (!updatedUser.modifiedCount) {
            throw new BadRequestException('failed to update info')
        }

        return res.json({ message: 'done' })
    }


    freezeAccount = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as IFreezeAccountParamsDTO || {};

        if (userId && req.user?.role !== roleEnum.admin) {
            throw new ForbiddenException(`not authorized user`)
        }

        const user = await this.userModel.updateOne({
            filter: {
                _id: userId || req.user?._id,
                freezedAt: { $exists: false },
                freezedBy: { $exists: false },
            }, update: {
                freezedAt: new Date(),
                freezedBy: req.user?._id,
                changeCredentialsTime: new Date(),
                $unset: {
                    restoredAt: 1,
                    restoredBy: 1
                }
            }
        })



        if (!user.matchedCount) {
            throw new NotFoundException(`user not found , failed to update this resource`)
        }

        return res.json({ message: 'done' })
    }


    restoreAccount = async (req: Request, res: Response): Promise<Response> => {
        const { userId } = req.params as IRestoreAccountParamsDTO || {};

        const user = await this.userModel.updateOne({
            filter: {
                _id: userId,
                freezedBy: { $ne: userId },
            }, update: {
                restoredAt: new Date(),
                restoredBy: req.user?._id,
                $unset: {
                    freezedAt: 1,
                    freezedBy: 1
                }
            }
        })



        if (!user.matchedCount) {
            throw new NotFoundException(`user not found , failed to restore this resource`)
        }

        return res.json({ message: 'done' })
    }
    hardDeleteAccount = async (req: Request, res: Response): Promise<Response> => {
        const { userId }: IHardDeleteAccountParamsDTO = req.params as IRestoreAccountParamsDTO || {};

        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                freezedAt: { $exists: true },
            }
        })



        if (!user.deletedCount) {
            throw new NotFoundException(`user not found , failed to delete resource`)
        }

        await deleteFolderByPrefix({ path: `users/${userId}` })

        return res.json({ message: 'done' })
    }

    logout = async (req: Request, res: Response): Promise<Response> => {

        const { flag }: ILogoutBodyInput = req.body
        const update: UpdateQuery<IUser> = {}
        let statusCode: number = 200



        switch (flag) {
            case logoutEnum.all:
                update.changeCredentialsTime = new Date()
                break;

            default:
                await createRevokeToken(req.decoded as JwtPayload)
                statusCode = 201
                break;
        }

        await this.userModel.updateOne({
            filter: {
                _id: req.decoded?._id
            },
            update
        })

        return res.status(statusCode).json({ message: `done` })
    }


    verify2Fa = async (req: Request, res: Response): Promise<Response> => {

        const { email, otp }: { email: string, otp: string } = req.body

        const user = await this.userModel.findOne({ filter: { email, twoFA_Otp: { $exists: 1 } } })

        if (!user) {
            throw new BadRequestException('invalid email')
        }

        if (!await compareHash({ plainText: otp, hash: user.twoFA_Otp as string })) {
            throw new BadRequestException('invalid otp')
        }

        const updatedUser = await this.userModel.updateOne({ filter: { email }, update: { $unset: { twoFA_Otp: 1 }, twoFA_Activated: true } })

        if (!updatedUser.modifiedCount) {
            throw new BadRequestException('failed to update this resource')
        }
        return successResponse({ res, message: '2fa enabled successfully ' })

    }
    enable2Fa = async (req: Request, res: Response): Promise<Response> => {

        const { email }: { email: string } = req.body
        const otp = generateNumberOtp()
        const user = await this.userModel.findOneAndUpdate({
            filter: { email: req.user?.email || email, confirmEmail: { $exists: 1 }, freezedAt: { $exists: 0 } }, update: {
                twoFA_Otp: await generateHash(String(otp)) as string,
            }
        })

        if (!user) {
            throw new BadRequestException('invalid email')
        }
        emailEvent.emit('enable2Fa', { to: req.user?.email || email, otp })
        return res.status(201).json({ message: `done, check the email sent to ${req.user?.email || email}` })

    }


    refreshToken = async (req: Request, res: Response): Promise<Response> => {

        const credentials = await createLoginCredentials(req.user as HUserDocument)
        await createRevokeToken(req.decoded as JwtPayload)

        return res.status(201).json({ message: 'done', credentials })
    }

}

export default new UserService()