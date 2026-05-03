import { uploadProfile, uploadArtworks, uploadArtistApplication, deleteImage, deleteMultipleImages, cloudinary } from "../config/cloudinary.js";
import multer from "multer";

// Memory storage for manual Cloudinary upload
const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
        }
    }
});

/**
 * Upload Middleware
 *
 * Handles file uploads with proper error handling
 * Works with both web and mobile (React Native) clients
 */

// ============================================
// PROFILE PICTURE UPLOAD
// ============================================

/**
 * Middleware to upload single profile picture
 * Field name: "profilePicture"
 */
export const uploadProfilePicture = (req, res, next) => {
    const upload = uploadProfile.single("profilePicture");

    upload(req, res, (err) => {
        if (err) {
            // Multer error (file size, type, etc.)
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "Profile picture must be less than 5MB"
                });
            }

            return res.status(400).json({
                success: false,
                message: err.message || "Error uploading profile picture"
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile picture is required"
            });
        }

        // Attach file info to request for controller
        req.uploadedFile = {
            url: req.file.path || req.file.secure_url, // Cloudinary URL
            publicId: req.file.filename || req.file.public_id // Cloudinary public_id
        };

        next();
    });
};

// ============================================
// ARTWORKS UPLOAD (5 required)
// ============================================

/**
 * Middleware to upload exactly 5 artwork images
 * Field name: "artworks"
 */
export const uploadArtworkImages = (req, res, next) => {
    const upload = uploadArtworks.array("artworks", 5);

    upload(req, res, async (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "Each artwork must be less than 10MB"
                });
            }

            if (err.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({
                    success: false,
                    message: "Maximum 5 artworks allowed"
                });
            }

            return res.status(400).json({
                success: false,
                message: err.message || "Error uploading artworks"
            });
        }

        // Check if exactly 5 files were uploaded
        if (!req.files || req.files.length !== 5) {
            // If some files were uploaded, delete them (cleanup)
            if (req.files && req.files.length > 0) {
                const publicIds = req.files.map(f => f.filename);
                await deleteMultipleImages(publicIds).catch(console.error);
            }

            return res.status(400).json({
                success: false,
                message: `Exactly 5 artworks are required. You uploaded ${req.files?.length || 0}`
            });
        }

        // Attach files info to request for controller
        req.uploadedArtworks = req.files.map(file => ({
            url: file.path || file.secure_url,
            publicId: file.filename || file.public_id
        }));

        next();
    });
};

// ============================================
// COMBINED UPLOAD FOR ARTIST APPLICATION
// ============================================

/**
 * Helper function to upload buffer to Cloudinary
 */
const uploadBufferToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                resource_type: 'image'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
            }
        );
        uploadStream.end(buffer);
    });
};

const uploadBuffersToCloudinary = async (files, folder) => {
    return Promise.all(
        files.map((file) => uploadBufferToCloudinary(file.buffer, folder))
    );
};

/**
 * Middleware to upload profile picture + 5 artworks together
 * Uses memory storage and manual Cloudinary upload to avoid compatibility issues
 *
 * Fields:
 * - profilePicture: single file
 * - artworks: 5 files
 */
export const uploadArtistApplicationFiles = (req, res, next) => {
    const upload = memoryUpload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "artworks", maxCount: 5 }
    ]);

    upload(req, res, async (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size limit exceeded. Max 10MB per file."
                });
            }

            return res.status(400).json({
                success: false,
                message: err.message || "Error uploading files"
            });
        }

        const profilePicFile = req.files?.profilePicture?.[0];
        const artworkFiles = req.files?.artworks;

        // Validate profile picture
        if (!profilePicFile) {
            return res.status(400).json({
                success: false,
                message: "Profile picture is required"
            });
        }

        // Validate exactly 5 artworks
        if (!artworkFiles || artworkFiles.length !== 5) {
            return res.status(400).json({
                success: false,
                message: `Exactly 5 artworks are required. You uploaded ${artworkFiles?.length || 0}`
            });
        }

        try {
            // Upload profile picture to Cloudinary
            const profilePicResult = await uploadBufferToCloudinary(
                profilePicFile.buffer,
                "artvpp/artist-applications/profiles"
            );

            // Upload all artworks to Cloudinary in parallel
            const artworkResults = await Promise.all(
                artworkFiles.map((file) => {
                    return uploadBufferToCloudinary(
                        file.buffer,
                        "artvpp/artist-applications/artworks"
                    );
                })
            );

            // Attach uploaded files info to request
            req.uploadedFiles = {
                profilePicture: profilePicResult,
                artworks: artworkResults
            };

            next();

        } catch (uploadError) {

            // Try to cleanup any files that were uploaded before the error
            // This is a best-effort cleanup
            if (req.uploadedFiles?.profilePicture?.publicId) {
                await deleteImage(req.uploadedFiles.profilePicture.publicId).catch(console.error);
            }

            return res.status(500).json({
                success: false,
                message: "Failed to upload images to cloud storage. Please try again."
            });
        }
    });
};

/**
 * Middleware to upload student form profile + artwork images + optional book PDFs
 *
 * Fields:
 * - profilePicture: single file (required for new accounts)
 * - artworkImages: 1..60 files (required)
 * - bookPdfs: 0..10 PDF files (optional, for book submissions)
 */

const studentSubmissionUpload = multer({
    storage: memoryStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB to allow PDFs
    fileFilter: (req, file, cb) => {
        const imageTypes = ["image/jpeg", "image/png", "image/webp"];
        const pdfType = "application/pdf";

        if (file.fieldname === "bookPdfs") {
            if (file.mimetype === pdfType) {
                cb(null, true);
            } else {
                cb(new Error("Only PDF files are allowed for book uploads"), false);
            }
        } else {
            if (imageTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error("Only JPG, PNG, and WebP images are allowed"), false);
            }
        }
    }
});

/**
 * Upload buffer to Cloudinary as raw file (for PDFs)
 */
const uploadPdfToCloudinary = (buffer, folder, originalName) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'raw',
                public_id: `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id
                    });
                }
            }
        );
        uploadStream.end(buffer);
    });
};

export const uploadStudentSubmissionFiles = (req, res, next) => {
    const upload = studentSubmissionUpload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "artworkImages", maxCount: 60 },
        { name: "bookPdfs", maxCount: 10 }
    ]);

    upload(req, res, async (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size limit exceeded. Max 10MB per image, 20MB per PDF."
                });
            }

            return res.status(400).json({
                success: false,
                message: err.message || "Error uploading files"
            });
        }

        const profilePicFile = req.files?.profilePicture?.[0];
        const artworkFiles = req.files?.artworkImages || [];
        const pdfFiles = req.files?.bookPdfs || [];

        if (artworkFiles.length < 1) {
            return res.status(400).json({
                success: false,
                message: "At least one artwork image is required"
            });
        }

        if (artworkFiles.length > 60) {
            return res.status(400).json({
                success: false,
                message: "Too many artwork images. Maximum 60 files allowed."
            });
        }

        try {
            let profilePicResult = null;
            if (profilePicFile) {
                profilePicResult = await uploadBufferToCloudinary(
                    profilePicFile.buffer,
                    "artvpp/student-submissions/profiles"
                );
            }

            const artworkResults = await uploadBuffersToCloudinary(
                artworkFiles,
                "artvpp/student-submissions/artworks"
            );

            // Upload PDFs if any
            let pdfResults = [];
            if (pdfFiles.length > 0) {
                pdfResults = await Promise.all(
                    pdfFiles.map((file) =>
                        uploadPdfToCloudinary(
                            file.buffer,
                            "artvpp/student-submissions/books",
                            file.originalname
                        )
                    )
                );
            }

            req.uploadedFiles = {
                profilePicture: profilePicResult,
                artworkImages: artworkResults,
                bookPdfs: pdfResults
            };

            next();
        } catch (uploadError) {
            await cleanupUploadedFiles(req.uploadedFiles || {}).catch(console.error);
            return res.status(500).json({
                success: false,
                message: "Failed to upload files to cloud storage. Please try again."
            });
        }
    });
};

// ============================================
// CLEANUP UTILITY
// ============================================

/**
 * Cleanup uploaded files if application submission fails
 * Call this in catch block or on validation failure
 */
export const cleanupUploadedFiles = async (files) => {
    try {
        const publicIds = [];

        if (files.profilePicture?.publicId) {
            publicIds.push(files.profilePicture.publicId);
        }

        if (files.artworks && Array.isArray(files.artworks)) {
            publicIds.push(...files.artworks.map(a => a.publicId));
        }

        if (files.artworkImages && Array.isArray(files.artworkImages)) {
            publicIds.push(...files.artworkImages.map(a => a.publicId));
        }

        if (publicIds.length > 0) {
            await deleteMultipleImages(publicIds);
            console.log(`Cleaned up ${publicIds.length} uploaded image files`);
        }

        // Clean up PDF files separately (they use resource_type: raw)
        if (files.bookPdfs && Array.isArray(files.bookPdfs)) {
            const pdfIds = files.bookPdfs.map(p => p.publicId).filter(Boolean);
            if (pdfIds.length > 0) {
                await cloudinary.api.delete_resources(pdfIds, { resource_type: 'raw' });
                console.log(`Cleaned up ${pdfIds.length} uploaded PDF files`);
            }
        }
    } catch (error) {
        console.error("Cleanup error:", error);
    }
};
