import express from 'express';
import { 
  getHomeCategories, 
  adminGetAllHomeCategories, 
  adminUpsertHomeCategory, 
  adminDeleteHomeCategory,
  adminUploadCategoryImage
} from '../controllers/homeCategoryController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roleCheck.js';
import { uploadHomeCategoryImage } from '../middleware/upload.js';

const router = express.Router();

/**
 * PUBLIC ROUTES
 */
router.get('/', getHomeCategories);

/**
 * ADMIN ROUTES
 */
router.get('/admin/all', isAuthenticated, isAdmin, adminGetAllHomeCategories);
router.post('/admin/upsert', isAuthenticated, isAdmin, adminUpsertHomeCategory);
router.delete('/admin/:id', isAuthenticated, isAdmin, adminDeleteHomeCategory);
router.post('/admin/upload', isAuthenticated, isAdmin, uploadHomeCategoryImage, adminUploadCategoryImage);

export default router;
