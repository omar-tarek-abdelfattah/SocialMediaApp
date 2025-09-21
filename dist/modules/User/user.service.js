"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hash_security_1 = require("./../../utils/security/hash.security");
const token_security_1 = require("../../utils/security/token.security");
const User_model_1 = require("../../DB/models/User.model");
const repositories_1 = require("../../DB/repositories");
const s3_config_1 = require("../../utils/multer/s3.config");
const multer_cloud_1 = require("../../utils/multer/multer.cloud");
const error_response_1 = require("../../utils/response/error.response");
const s3_events_1 = require("../../utils/multer/s3.events");
const email_event_1 = require("../../utils/events/email.event");
const otp_1 = require("../../utils/email/otp");
const success_response_1 = require("../../utils/response/success.response");
class UserService {
    userModel = new repositories_1.UserRepository(User_model_1.UserModel);
    constructor() {
    }
    profile = async (req, res) => {
        return res.json({ message: `done`, user: req.user, decoded: req.decoded });
    };
    profileImage = async (req, res) => {
        const { ContentType, OriginalName } = req.body;
        const { url, key } = await (0, s3_config_1.createPreSignedUploadLink)({ ContentType, OriginalName, path: `users/${req.decoded?._id}` });
        const user = this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                profileImage: key,
                tempProfileImage: req.user?.profileImage
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException(`fail to update user profile image`);
        }
        s3_events_1.s3Event.emit("trackProfileImageUpload", {
            userId: req.user?._id,
            oldKey: req.user?.profileImage,
            key,
            expiresIn: 30000
        });
        return res.json({ message: `done`, data: { key, url } });
    };
    coverImages = async (req, res) => {
        const urls = await (0, s3_config_1.uploadFiles)({
            storageApproach: multer_cloud_1.StorageEnum.disk,
            files: req.files,
            path: `users/${req.decoded?._id}/cover`
        });
        const user = this.userModel.findByIdAndUpdate({
            id: req.user?._id,
            update: {
                coverImages: urls
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException(`failed to update profile cover images`);
        }
        if (req.user?.coverImages) {
            await (0, s3_config_1.deleteFiles)({ urls: req.user.coverImages });
        }
        return res.json({ message: `done`, data: urls });
    };
    updatePassword = async (req, res) => {
        const { email, oldPassword, otp, newPassword } = req.body;
        if (oldPassword === newPassword) {
            throw new error_response_1.BadRequestException('new password cannot be old password');
        }
        const user = await this.userModel.findOne({ filter: { email, resetPasswordOtp: { $exists: 1 } } });
        console.log(user);
        if (!user) {
            throw new error_response_1.NotFoundException(`couldn't find an account that has a reset password request with this email`);
        }
        if (!await (0, hash_security_1.compareHash)({ plainText: otp, hash: user.resetPasswordOtp })) {
            throw new error_response_1.BadRequestException('invalid otp');
        }
        if (!await (0, hash_security_1.compareHash)({ plainText: oldPassword, hash: user.password })) {
            await this.userModel.updateOne({ filter: { email }, update: { changeCredentialsTime: new Date() } });
            throw new error_response_1.BadRequestException('wrong old password, you have been logged out');
        }
        const updatedPassword = await this.userModel.updateOne({
            filter: { email }, update: {
                password: await (0, hash_security_1.generateHash)(newPassword),
                $unset: { resetPasswordOtp: 1 }
            }
        });
        console.log(updatedPassword);
        if (!updatedPassword.modifiedCount) {
            throw new error_response_1.BadRequestException('failed to update password');
        }
        return res.json({ message: 'password updated' });
    };
    updatePasswordRequest = async (req, res) => {
        const { email } = req.body;
        const resetPasswordOtp = (0, otp_1.generateNumberOtp)();
        const user = await this.userModel.findOneAndUpdate({ filter: { email }, update: { resetPasswordOtp: await (0, hash_security_1.generateHash)(String(resetPasswordOtp)) } });
        if (!user) {
            throw new error_response_1.NotFoundException('user not found');
        }
        email_event_1.emailEvent.emit('resetPassword', { to: email, otp: resetPasswordOtp });
        return res.json({ message: 'done ,  check ur email' });
    };
    updateBasic = async (req, res) => {
        const { address, username, gender } = req.body;
        let update = {};
        if (address) {
            update.address = address;
        }
        if (username) {
            const [firstName, lastName] = username.split(' ') || [];
            update.firstName = firstName;
            update.lastName = lastName;
        }
        if (gender) {
            update.gender = gender;
        }
        console.log(update);
        const updatedUser = await this.userModel.updateOne({
            filter: { _id: req.user?._id },
            update
        });
        if (!updatedUser.modifiedCount) {
            throw new error_response_1.BadRequestException('failed to update info');
        }
        return res.json({ message: 'done' });
    };
    freezeAccount = async (req, res) => {
        const { userId } = req.params || {};
        if (userId && req.user?.role !== User_model_1.roleEnum.admin) {
            throw new error_response_1.ForbiddenException(`not authorized user`);
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
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException(`user not found , failed to update this resource`);
        }
        return res.json({ message: 'done' });
    };
    restoreAccount = async (req, res) => {
        const { userId } = req.params || {};
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
        });
        if (!user.matchedCount) {
            throw new error_response_1.NotFoundException(`user not found , failed to restore this resource`);
        }
        return res.json({ message: 'done' });
    };
    hardDeleteAccount = async (req, res) => {
        const { userId } = req.params || {};
        const user = await this.userModel.deleteOne({
            filter: {
                _id: userId,
                freezedAt: { $exists: true },
            }
        });
        if (!user.deletedCount) {
            throw new error_response_1.NotFoundException(`user not found , failed to delete resource`);
        }
        await (0, s3_config_1.deleteFolderByPrefix)({ path: `users/${userId}` });
        return res.json({ message: 'done' });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        const update = {};
        let statusCode = 200;
        switch (flag) {
            case token_security_1.logoutEnum.all:
                update.changeCredentialsTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokeToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: {
                _id: req.decoded?._id
            },
            update
        });
        return res.status(statusCode).json({ message: `done` });
    };
    verify2Fa = async (req, res) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({ filter: { email, twoFA_Otp: { $exists: 1 } } });
        if (!user) {
            throw new error_response_1.BadRequestException('invalid email');
        }
        if (!await (0, hash_security_1.compareHash)({ plainText: otp, hash: user.twoFA_Otp })) {
            throw new error_response_1.BadRequestException('invalid otp');
        }
        const updatedUser = await this.userModel.updateOne({ filter: { email }, update: { $unset: { twoFA_Otp: 1 }, twoFA_Activated: true } });
        if (!updatedUser.modifiedCount) {
            throw new error_response_1.BadRequestException('failed to update this resource');
        }
        return (0, success_response_1.successResponse)({ res, message: '2fa enabled successfully ' });
    };
    enable2Fa = async (req, res) => {
        const { email } = req.body;
        const otp = (0, otp_1.generateNumberOtp)();
        const user = await this.userModel.findOneAndUpdate({
            filter: { email: req.user?.email || email, confirmEmail: { $exists: 1 }, freezedAt: { $exists: 0 } }, update: {
                twoFA_Otp: await (0, hash_security_1.generateHash)(String(otp)),
            }
        });
        if (!user) {
            throw new error_response_1.BadRequestException('invalid email');
        }
        email_event_1.emailEvent.emit('enable2Fa', { to: req.user?.email || email, otp });
        return res.status(201).json({ message: `done, check the email sent to ${req.user?.email || email}` });
    };
    refreshToken = async (req, res) => {
        const credentials = await (0, token_security_1.createLoginCredentials)(req.user);
        await (0, token_security_1.createRevokeToken)(req.decoded);
        return res.status(201).json({ message: 'done', credentials });
    };
}
exports.default = new UserService();
