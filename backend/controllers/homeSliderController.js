import HomeSlide from '../models/HomeSlide.js';

/**
 * @desc    Get all active home slides
 * @route   GET /api/v1/home-slides
 * @access  Public
 */
export const getHomeSlides = async (req, res) => {
  try {
    const slides = await HomeSlide.find({ isActive: true }).sort({ displayOrder: 1 });
    res.status(200).json({
      success: true,
      data: slides
    });
  } catch (error) {
    console.error('Get home slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slides'
    });
  }
};

/**
 * @desc    Get all home slides (admin)
 * @route   GET /api/v1/home-slides/admin/all
 * @access  Admin
 */
export const adminGetAllHomeSlides = async (req, res) => {
  try {
    const slides = await HomeSlide.find().sort({ displayOrder: 1 });
    res.status(200).json({
      success: true,
      data: slides
    });
  } catch (error) {
    console.error('Admin get home slides error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slides'
    });
  }
};

/**
 * @desc    Upsert home slide (admin)
 * @route   POST /api/v1/home-slides/admin/upsert
 * @access  Admin
 */
export const adminUpsertHomeSlide = async (req, res) => {
  try {
    const { id, title, artist, image, displayOrder, isActive } = req.body;

    let slide;
    if (id) {
      slide = await HomeSlide.findById(id);
    }

    const payload = {
      title,
      artist,
      image,
      displayOrder: Number(displayOrder || 0),
      isActive: isActive !== undefined ? isActive : true
    };

    if (slide) {
      slide = await HomeSlide.findByIdAndUpdate(id, payload, { new: true });
    } else {
      slide = await HomeSlide.create(payload);
    }

    res.status(200).json({
      success: true,
      data: slide,
      message: 'Slide saved successfully'
    });
  } catch (error) {
    console.error('Upsert home slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save slide'
    });
  }
};

/**
 * @desc    Delete home slide (admin)
 * @route   DELETE /api/v1/home-slides/admin/:id
 * @access  Admin
 */
export const adminDeleteHomeSlide = async (req, res) => {
  try {
    const { id } = req.params;
    await HomeSlide.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Slide deleted successfully'
    });
  } catch (error) {
    console.error('Delete home slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete slide'
    });
  }
};

/**
 * @desc    Upload slide image (admin)
 * @route   POST /api/v1/home-slides/admin/upload
 * @access  Admin
 */
export const adminUploadSlideImage = async (req, res) => {
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
    console.error('Upload slide image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
};
