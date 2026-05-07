import express from 'express';
import { 
  getHomeSlides, 
  adminGetAllHomeSlides, 
  adminUpsertHomeSlide, 
  adminDeleteHomeSlide,
  adminUploadSlideImage
} from '../controllers/homeSliderController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import { uploadHomeSlideImage } from '../middleware/upload.js';

const router = express.Router();

/**
 * PUBLIC ROUTES
 */
router.get('/', getHomeSlides);

/**
 * ADMIN ROUTES
 */
router.get('/admin/all', isAuthenticated, isAdmin, adminGetAllHomeSlides);
router.post('/admin/upsert', isAuthenticated, isAdmin, adminUpsertHomeSlide);
router.delete('/admin/:id', isAuthenticated, isAdmin, adminDeleteHomeSlide);
router.post('/admin/upload', isAuthenticated, isAdmin, uploadHomeSlideImage, adminUploadSlideImage);

export default router;
