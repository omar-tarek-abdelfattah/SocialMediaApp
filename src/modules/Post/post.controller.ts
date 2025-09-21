import { Router } from "express";
import { authentication } from "../../middlewares/authentication.middleware";
import postService from "./post.service";
import { cloudFileUpload, fileValidation } from "../../utils/multer/multer.cloud";
import { validation } from "../../middlewares/validation.middleware";
import * as validators from './post.validation'

const router = Router()

router.post('/', authentication(), cloudFileUpload({ validation: fileValidation.image }).array("attachments", 2),
    validation(validators.createPost), postService.createPost)

router.patch('/:postId/like', authentication(), validation(validators.likePost), postService.likePost)
export default router