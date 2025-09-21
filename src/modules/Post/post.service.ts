import type { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { PostRepository, UserRepository } from "../../DB/repositories";
import { HPostDocument, LikeActionEnum, PostModel } from "../../DB/models/Post.model";
import { UserModel } from "../../DB/models/User.model";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { v4 as uuid } from 'uuid'
import { ILikePostQueryInputDTO } from "./post.dto";
import { UpdateQuery } from "mongoose";
import { emailEvent } from "../../utils/events/email.event";


class PostService {
    private postModel = new PostRepository(PostModel)
    private userModel = new UserRepository(UserModel)
    constructor() { }

    createPost = async (req: Request, res: Response): Promise<Response> => {
        if (
            req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags } }
            }))?.length !== req.body.tags.length
        ) {
            throw new NotFoundException("some of mentioned users do not exist ")
        }

        if (req.body.tags) {
            const taggedUsers = await this.userModel.find({ filter: { _id: { $in: req.body.tags } } }) || []
            for (const taggedUser of taggedUsers) {
                emailEvent.emit('tag', { to: taggedUser.email, taggerName: req.user?.username })
            }
        }
        let attachments: string[] = []
        let accessFolderId: string = uuid()

        if (req.files?.length) {
            attachments = await uploadFiles({
                files: req.files as Express.Multer.File[]
                , path: `users/${req.user?._id}/ ${accessFolderId}`
            })
        }

        const [post] = await this.postModel.create({
            data: [{
                ...req.body,
                attachments,
                accessFolderId,
                createdBy: req.user?._id
            }]
        }) || []

        if (!post) {
            if (attachments.length) {
                await deleteFiles({ urls: attachments })
            }
            throw new BadRequestException('fail to create this post')
        }

        return successResponse({ res, statusCode: 201 })
    }

    likePost = async (req: Request, res: Response): Promise<Response> => {

        const { postId }: { postId: string } = req.params as { postId: string }
        const { action } = req.query as ILikePostQueryInputDTO

        let update: UpdateQuery<HPostDocument> = { $addToSet: { likes: req.user?._id } }
        if (action === LikeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } }
        }
        else {

        }

        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId
            },
            update
        })

        if (!post) {
            throw new NotFoundException(`invalid Post Id, or post doesn't exist`)
        }

        return successResponse({ res })
    }
}

export default new PostService()