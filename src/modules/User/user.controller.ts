import { Router } from "express"
import { authentication, authorization } from "../../middlewares/authentication.middleware"
import UserService from "./user.service"
import { validation } from "../../middlewares/validation.middleware"
import * as validators from './user.validation'
import { TokenEnum } from "../../utils/security/token.security"
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/multer.cloud"
import { endpoint } from "./user.authorization"

const router = Router()


router.get(`/`, authentication(), UserService.profile)

router.post(`/logout`, authentication(), validation(validators.logout), UserService.logout)

router.patch(`/profile-image`, authentication(), UserService.profileImage)

router.patch(`/cover-images`, authentication(),
    cloudFileUpload({
        validation: fileValidation.image
        , storageType: StorageEnum.disk,
        maxSizeMb: 4
    }).array(`images`)
    , UserService.coverImages)

router.patch("/update-basic", authentication(), validation(validators.updateBasic), UserService.updateBasic)

router.patch("/send-update-password", authentication(), validation(validators.updatePasswordRequest), UserService.updatePasswordRequest)
router.patch("/update-password", authentication(), validation(validators.updatePassword), UserService.updatePassword)

router.delete("{/:userId}/freeze-account", authentication(), validation(validators.freezeAccount), UserService.freezeAccount)
router.delete("/:userId", authorization(endpoint.hardDelete), validation(validators.hardDelete), UserService.hardDeleteAccount)
router.patch("/:userId/restore-account", authorization(endpoint.restoreAccount), validation(validators.restoreAccount), UserService.restoreAccount)

router.patch('/enable-2fa', authentication(), validation(validators.enable2Fa), UserService.enable2Fa)
router.patch('/verify-2fa', authentication(), validation(validators.verify2Fa), UserService.verify2Fa)


router.post(`/refresh-token`, authentication(TokenEnum.refresh), UserService.refreshToken)


export default router