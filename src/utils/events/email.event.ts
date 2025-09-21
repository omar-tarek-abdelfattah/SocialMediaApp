import EventEmitter from "node:events";
import Mail from "nodemailer/lib/mailer";
import { sendEmail } from "../email/send.email";
import { tagTemplateEmail, verifyTemplateEmail } from "../email/verify.template";


export const emailEvent = new EventEmitter()

interface IEmail extends Mail.Options {
    otp: number,
    taggerName?: string
}


emailEvent.on(`confirmEmail`, async (data: IEmail) => {
    try {
        data.subject = `Confirm Email`
        data.html = verifyTemplateEmail({ otp: data.otp, title: `email confirmation` })
        await sendEmail(data)
    } catch (error) {
        console.log(`fail to send email`, error);

    }
})
emailEvent.on(`resetPassword`, async (data: IEmail) => {
    try {
        data.subject = `reset password`
        data.html = verifyTemplateEmail({ otp: data.otp, title: `reset code` })
        await sendEmail(data)
    } catch (error) {
        console.log(`fail to send email`, error);

    }
})
emailEvent.on("tag", async (data: IEmail) => {
    try {
        data.subject = 'you got tagged on a post'
        data.html = tagTemplateEmail({ taggerName: data.taggerName as string, title: 'you got tagged on a post' })
        await sendEmail(data)
    } catch (error) {
        console.log(`fail to send email`, error);

    }
})
emailEvent.on("enable2Fa", async (data: IEmail) => {
    try {
        data.subject = 'enable 2fa otp'
        data.html = verifyTemplateEmail({ otp: data.otp, title: 'enable 2fa otp' })
        await sendEmail(data)
    } catch (error) {
        console.log(`fail to send email`, error);

    }
})
emailEvent.on("2FAOtp", async (data: IEmail) => {
    try {
        data.subject = '2fa otp'
        data.html = verifyTemplateEmail({ otp: data.otp, title: '2fa otp' })
        await sendEmail(data)
    } catch (error) {
        console.log(`fail to send email`, error);
    }
})
