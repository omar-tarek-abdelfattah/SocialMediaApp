"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = require("nodemailer");
const error_response_1 = require("../response/error.response");
const sendEmail = async (data) => {
    if (!data.html && !data.attachments?.length && !data.text) {
        throw new error_response_1.BadRequestException(`missing email content`);
    }
    const transporter = (0, nodemailer_1.createTransport)({
        service: 'gmail',
        auth: {
            user: process.env.APP_GMAIL,
            pass: process.env.APP_PASSWORD
        }
    });
    const info = await transporter.sendMail({
        ...data,
        from: `Social App <${process.env.APP_GMAIL}>`,
    });
    console.log(`Message Sent`, info.messageId);
};
exports.sendEmail = sendEmail;
