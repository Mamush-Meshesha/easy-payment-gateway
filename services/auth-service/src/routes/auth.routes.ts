import { Router } from 'express';
import { AuthController } from '../controller/auth.controller';
import { validateDto } from './validation.middleware'; // Assuming it exists or I will create a basic one
import { LoginDto, RefreshDto, RegisterInitialAdminDto, RegisterMerchantDto } from '../dtos/auth.dto';

const router = Router();

// Used only once to bootstrap the system
router.post('/register-admin', validateDto(RegisterInitialAdminDto), AuthController.registerInitialAdmin);

router.post('/register-merchant', validateDto(RegisterMerchantDto), AuthController.registerMerchant);

router.post('/login', validateDto(LoginDto), AuthController.login);
router.post('/refresh', validateDto(RefreshDto), AuthController.refresh);

export default router;
