import { Router } from "express"
import { authentication } from "../../middlewares/authentication.middleware"
import UserService from "./user.service"
import { validation } from "../../middlewares/validation.middleware"
import * as validators from './user.validation'
import { TokenEnum } from "../../utils/security/token.security"

const router = Router()


router.get(`/`, authentication(), UserService.profile)
router.post(`/logout`, authentication(), validation(validators.logout), UserService.logout)
router.post(`/refresh-token`, authentication(TokenEnum.refresh), UserService.refreshToken)


export default router