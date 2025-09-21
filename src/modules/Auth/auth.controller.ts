import { Router } from 'express'
import authService from './auth.service'
import * as validators from './auth.validation'
import { validation } from '../../middlewares/validation.middleware'

const router = Router();


router.post('/signup',
    validation(validators.signup),
    authService.signup)

router.post('/login', authService.login)

router.post(`/signup-gmail`, validation(validators.signUpWithGmail), authService.signupWithGmail)

router.post(`/login-gmail`, validation(validators.signUpWithGmail), authService.loginWithGmail)

router.patch(`/confirm-email`, validation(validators.confirmEmail), authService.confrmEmail)

router.patch('/send-reset-password', validation(validators.sendForgotCode), authService.sendForgotCode)
router.patch('/reset-password', validation(validators.resetPassword), authService.resetPassword)



// endpoint to verify enabling 2fa
router.patch('/verify-2fa', validation(validators.verify2fa), authService.verify2fa)


export default router