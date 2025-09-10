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



export default router