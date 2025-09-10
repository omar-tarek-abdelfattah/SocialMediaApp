import { createTransport, type Transporter } from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { BadRequestException } from '../response/error.response';

export const sendEmail = async (data: Mail.Options): Promise<void> => {
    if (!data.html && !data.attachments?.length && !data.text) {
        throw new BadRequestException(`missing email content`)
    }

    const transporter: Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options> = createTransport({
        service: 'gmail',
        auth: {
            user: process.env.APP_GMAIL as string,
            pass: process.env.APP_PASSWORD as string
        }
    })

    const info = await transporter.sendMail({
        ...data,
        from: `Social App <${process.env.APP_GMAIL as string}>`,
    })
    console.log(`Message Sent`, info.messageId);

}