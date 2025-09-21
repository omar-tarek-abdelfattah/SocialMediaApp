"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_js_1 = require("../../DB/models/User.model.js");
const error_response_js_1 = require("../../utils/response/error.response.js");
const hash_security_js_1 = require("../../utils/security/hash.security.js");
const email_event_js_1 = require("../../utils/events/email.event.js");
const otp_js_1 = require("../../utils/email/otp.js");
const token_security_js_1 = require("../../utils/security/token.security.js");
const google_auth_library_1 = require("google-auth-library");
const success_response_js_1 = require("../../utils/response/success.response.js");
const repositories_1 = require("../../DB/repositories");
class AuthenticationService {
    userModel = new repositories_1.UserRepository(User_model_js_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_ID?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_js_1.BadRequestException(`failed to verify this google account`);
        }
        return payload;
    }
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_js_1.providerEnum.google
            },
        });
        if (!user) {
            throw new error_response_js_1.NotFoundException(`not registered account, or different provider`);
        }
        const credentials = await (0, token_security_js_1.createLoginCredentials)(user);
        return res.status(200).json({ message: "done", data: { credentials } });
    };
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: { email },
        });
        if (user) {
            if (user.provider === User_model_js_1.providerEnum.google) {
                return this.loginWithGmail(req, res);
            }
            throw new error_response_js_1.ConflictException(`this user exists by different provider`);
        }
        const [newUser] = await this.userModel.create({
            data: [
                {
                    firstName: given_name,
                    email: email,
                    lastName: family_name,
                    profileImage: picture,
                    confirmEmail: new Date()
                }
            ]
        }) || [];
        if (!newUser) {
            throw new error_response_js_1.BadRequestException(`failed to signup with gmail, try again later`);
        }
        const credentials = await (0, token_security_js_1.createLoginCredentials)(newUser);
        return res.status(201).json({ message: "done", data: { credentials } });
    };
    signup = async (req, res) => {
        let { username, email, password } = req.body;
        const otp = (0, otp_js_1.generateNumberOtp)();
        if (await this.userModel.findOne({ filter: { email } })) {
            throw new error_response_js_1.ConflictException(`Email already exists`);
        }
        const [user] = await this.userModel.createUser({
            data: [{ username, email, password, confirmEmailOtp: `${otp}` }],
            options: {
                validateBeforeSave: true
            }
        }) || [];
        if (!user) {
            throw new error_response_js_1.BadRequestException('failed to signup');
        }
        return res.status(201).json({ message: "done", data: user });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email
            }
        });
        if (!user) {
            throw new error_response_js_1.NotFoundException(`Invalid credentials`);
        }
        if (!user.confirmEmail) {
            throw new error_response_js_1.BadRequestException(`Account not verified, Confirm your email first`);
        }
        if (!await (0, hash_security_js_1.compareHash)({ hash: user.password, plainText: password })) {
            throw new error_response_js_1.NotFoundException(`Invalid credentials`);
        }
        if (user.twoFA_Activated) {
            const otp = (0, otp_js_1.generateNumberOtp)();
            email_event_js_1.emailEvent.emit('2FAOtp', { to: email, otp });
            const twoFaUser = await this.userModel.updateOne({ filter: { email, twoFA_Activated: true }, update: { twoFA_Otp: await (0, hash_security_js_1.generateHash)(String(otp)) } });
            if (!twoFaUser.modifiedCount) {
                throw new error_response_js_1.BadRequestException('failed to update this resource');
            }
            return (0, success_response_js_1.successResponse)({ res, message: '2FA Activated, check your email' });
        }
        const credentials = await (0, token_security_js_1.createLoginCredentials)(user);
        return (0, success_response_js_1.successResponse)({ res, data: { credentials } });
    };
    verify2fa = async (req, res) => {
        const { otp, email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                twoFA_Otp: { $exists: 1 },
                twoFA_Activated: true,
            }
        });
        if (!user) {
            throw new error_response_js_1.NotFoundException(`No account found`);
        }
        if (!await (0, hash_security_js_1.compareHash)({ hash: user?.twoFA_Otp, plainText: otp })) {
            throw new error_response_js_1.BadRequestException(`Invalid OTP`);
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                $unset: {
                    twoFA_Otp: true
                }
            }
        });
        const credentials = await (0, token_security_js_1.createLoginCredentials)(user);
        return (0, success_response_js_1.successResponse)({ res, data: { credentials }, message: 'done' });
    };
    confrmEmail = async (req, res) => {
        const { otp, email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: 1 },
                confirmEmail: { $exists: 0 },
            }
        });
        if (!user) {
            throw new error_response_js_1.NotFoundException(`No account found`);
        }
        if (!await (0, hash_security_js_1.compareHash)({ hash: user?.confirmEmailOtp, plainText: otp })) {
            throw new error_response_js_1.BadRequestException(`Wrong OTP`);
        }
        await this.userModel.updateOne({
            filter: { email },
            update: {
                confirmEmail: new Date(),
                $unset: {
                    confirmEmailOtp: true
                }
            }
        });
        return res.status(201).json({ message: "done" });
    };
    sendForgotCode = async (req, res) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_js_1.providerEnum.system,
                confirmEmail: { $exists: 1 },
            }
        });
        if (!user) {
            throw new error_response_js_1.NotFoundException(`invalid or not confirmed account`);
        }
        const otp = (0, otp_js_1.generateNumberOtp)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                resetPasswordOtp: await (0, hash_security_js_1.generateHash)(String(otp))
            }
        });
        if (!result.matchedCount) {
            throw new error_response_js_1.BadRequestException(`failed to send the otp`);
        }
        email_event_js_1.emailEvent.emit(`resetPassword`, { to: email, otp });
        return res.status(201).json({ message: "done" });
    };
    resetPassword = async (req, res) => {
        const { email, password, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_js_1.providerEnum.system,
                confirmEmail: { $exists: 1 },
                resetPasswordOtp: { $exists: 1 }
            }
        });
        if (!user) {
            throw new error_response_js_1.NotFoundException(`invalid or not confirmed account`);
        }
        if (!await (0, hash_security_js_1.compareHash)({ hash: user.resetPasswordOtp, plainText: otp })) {
            throw new error_response_js_1.BadRequestException(`invalid otp`);
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                password: await (0, hash_security_js_1.generateHash)(password),
                changeCredentialsTime: new Date(),
                $unset: { resetPasswordOtp: 1 },
            }
        });
        if (!result.matchedCount) {
            throw new error_response_js_1.BadRequestException(`failed reset password`);
        }
        email_event_js_1.emailEvent.emit(`resetPassword`, { to: email, otp });
        return res.status(201).json({ message: "done" });
    };
}
exports.default = new AuthenticationService();
