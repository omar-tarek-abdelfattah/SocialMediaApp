import { z } from 'zod'
import { AllowCommentsEnum, AvailabilityEnum, LikeActionEnum } from '../../DB/models/Post.model'
import { generalFields } from '../../middlewares/validation.middleware'
import { fileValidation } from '../../utils/multer/multer.cloud'

export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(500000).optional(),
        attachments: z.array(generalFields.file(fileValidation.image)).max(2).optional(),
        availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.public),
        allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.allow),
        tags: z
            .array(generalFields.id).max(10).optional()
    }).superRefine((data, ctx) => {
        if (!data.attachments?.length && !data.content) {
            ctx.addIssue({
                code: `custom`,
                path: ['content'],
                message: "Can't make post without content or attachments , either one must be provided"
            })

            if (data.tags?.length && data.tags.length !== [... new Set(data.tags)].length) {
                ctx.addIssue({
                    code: "custom",
                    path: ['tags'],
                    message: `duplicated tagged user.`
                })
            }
        }
    })
}

export const likePost = {
    params: z.strictObject({
        postId: generalFields.id
    }),
    query: z.strictObject({
        action: z.enum(LikeActionEnum).default(LikeActionEnum.like)
    })
}