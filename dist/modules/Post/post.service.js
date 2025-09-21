"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const success_response_1 = require("../../utils/response/success.response");
const repositories_1 = require("../../DB/repositories");
const Post_model_1 = require("../../DB/models/Post.model");
const User_model_1 = require("../../DB/models/User.model");
const error_response_1 = require("../../utils/response/error.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const uuid_1 = require("uuid");
const email_event_1 = require("../../utils/events/email.event");
class PostService {
    postModel = new repositories_1.PostRepository(Post_model_1.PostModel);
    userModel = new repositories_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this.userModel.find({
                filter: { _id: { $in: req.body.tags } }
            }))?.length !== req.body.tags.length) {
            throw new error_response_1.NotFoundException("some of mentioned users do not exist ");
        }
        if (req.body.tags) {
            const taggedUsers = await this.userModel.find({ filter: { _id: { $in: req.body.tags } } }) || [];
            for (const taggedUser of taggedUsers) {
                email_event_1.emailEvent.emit('tag', { to: taggedUser.email, taggerName: req.user?.username });
            }
        }
        let attachments = [];
        let accessFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user?._id}/ ${accessFolderId}`
            });
        }
        const [post] = await this.postModel.create({
            data: [{
                    ...req.body,
                    attachments,
                    accessFolderId,
                    createdBy: req.user?._id
                }]
        }) || [];
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new error_response_1.BadRequestException('fail to create this post');
        }
        return (0, success_response_1.successResponse)({ res, statusCode: 201 });
    };
    likePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = { $addToSet: { likes: req.user?._id } };
        if (action === Post_model_1.LikeActionEnum.unlike) {
            update = { $pull: { likes: req.user?._id } };
        }
        else {
        }
        const post = await this.postModel.findOneAndUpdate({
            filter: {
                _id: postId
            },
            update
        });
        if (!post) {
            throw new error_response_1.NotFoundException(`invalid Post Id, or post doesn't exist`);
        }
        return (0, success_response_1.successResponse)({ res });
    };
}
exports.default = new PostService();
