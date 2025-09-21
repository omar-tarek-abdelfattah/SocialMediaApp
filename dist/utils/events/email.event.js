"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = __importDefault(require("node:events"));
const send_email_1 = require("../email/send.email");
const verify_template_1 = require("../email/verify.template");
exports.emailEvent = new node_events_1.default();
exports.emailEvent.on(`confirmEmail`, async (data) => {
    try {
        data.subject = `Confirm Email`;
        data.html = (0, verify_template_1.verifyTemplateEmail)({ otp: data.otp, title: `email confirmation` });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log(`fail to send email`, error);
    }
});
exports.emailEvent.on(`resetPassword`, async (data) => {
    try {
        data.subject = `reset password`;
        data.html = (0, verify_template_1.verifyTemplateEmail)({ otp: data.otp, title: `reset code` });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log(`fail to send email`, error);
    }
});
exports.emailEvent.on("tag", async (data) => {
    try {
        data.subject = 'you got tagged on a post';
        data.html = (0, verify_template_1.tagTemplateEmail)({ taggerName: data.taggerName, title: 'you got tagged on a post' });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log(`fail to send email`, error);
    }
});
exports.emailEvent.on("enable2Fa", async (data) => {
    try {
        data.subject = 'enable 2fa otp';
        data.html = (0, verify_template_1.verifyTemplateEmail)({ otp: data.otp, title: 'enable 2fa otp' });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log(`fail to send email`, error);
    }
});
exports.emailEvent.on("2FAOtp", async (data) => {
    try {
        data.subject = '2fa otp';
        data.html = (0, verify_template_1.verifyTemplateEmail)({ otp: data.otp, title: '2fa otp' });
        await (0, send_email_1.sendEmail)(data);
    }
    catch (error) {
        console.log(`fail to send email`, error);
    }
});
