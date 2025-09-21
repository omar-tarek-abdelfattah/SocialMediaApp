import { z } from "zod"
import { likePost } from "./post.validation"
export type ILikePostQueryInputDTO = z.infer<typeof likePost.query>