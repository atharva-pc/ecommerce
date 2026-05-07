import HomeCategory from '../models/HomeCategory.js';
import { cloudinary } from '../config/cloudinary.js';

/**
 * @desc    Get all active home categories
 * @route   GET /api/v1/home-categories
 * @access  Public
 */
export const getHomeCategories = async (req, res) => {
  try {
    const categories = await HomeCategory.find({ isActive: true }).sort({ displayOrder: 1 });
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get home categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * @desc    Get all home categories (admin)
 * @route   GET /api/v1/admin/home-categories
 * @access  Admin
 */
export const adminGetAllHomeCategories = async (req, res) => {
  try {
    const categories = await HomeCategory.find().sort({ displayOrder: 1 });
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Admin get home categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
};

/**
 * @desc    Upsert home category (admin)
 * @route   POST /api/v1/admin/home-categories/upsert
 * @access  Admin
 */
export const adminUpsertHomeCategory = async (req, res) => {
  try {
    const { id, categoryName, description, image, redirectUrl, displayOrder, isActive } = req.body;

    let category;
    if (id) {
      category = await HomeCategory.findById(id);
    }

    const payload = {
      categoryName,
      description,
      image,
      redirectUrl,
      displayOrder: Number(displayOrder || 0),
      isActive: isActive !== undefined ? isActive : true
    };

    if (category) {
      category = await HomeCategory.findByIdAndUpdate(id, payload, { new: true });
    } else {
      category = await HomeCategory.create(payload);
    }

    res.status(200).json({
      success: true,
      data: category,
      message: 'Category saved successfully'
    });
  } catch (error) {
    console.error('Upsert home category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save category'
    });
  }
};

/**
 * @desc    Delete home category (admin)
 * @route   DELETE /api/v1/admin/home-categories/:id
 * @access  Admin
 */
export const adminDeleteHomeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await HomeCategory.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete home category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};

/**
 * @desc    Upload category image (admin)
 * @route   POST /api/v1/admin/home-categories/upload
 * @access  Admin
 */
export const adminUploadCategoryImage = async (req, res) => {
  try {
    if (!req.uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'Image upload failed'
      });
    }

    res.status(200).json({
      success: true,
      data: req.uploadedFile
    });
  } catch (error) {
    console.error('Upload category image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
};
