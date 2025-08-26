import { Router } from 'express'
import authService from './auth.service'
import * as validators from './auth.validation'
import { validation } from '../../middlewares/validation.middleware'
const router = Router();

router.post('/signup', validation(validators.signup), authService.signup)
router.post('/login', authService.login)


export default router