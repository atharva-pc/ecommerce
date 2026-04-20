import mongoose from "mongoose";
import { FeaturedArtist } from "../models/FeaturedArtist.js";
import { FeaturedArtwork } from "../models/FeaturedArtwork.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";

/**
 * @desc    Get featured artists for homepage
 * @route   GET /api/v1/featured-artists
 * @access  Public
 */
export const getFeaturedArtists = async (req, res) => {
    try {
        const artists = await FeaturedArtist.find({ status: "active" })
            .sort({ displayOrder: 1 })
            .limit(8)
            .populate({
                path: "artist",
                select: "username displayName avatar followers followersCount bio role specialty"
            });

        // Map to include follower count and specialty if needed
        const formattedArtists = artists.map(item => {
            const artist = item.artist;
            return {
                id: item._id,
                artistId: artist?._id || null,
                name: item.name || artist?.displayName || artist?.username,
                avatar: item.avatar || artist?.avatar,
                specialty: item.category, // Use the category set in featured artist
                followers: artist?.followersCount || artist?.followers?.length || 0,
                artworks: 0, // Will be filled below
                bio: artist?.bio,
                displayOrder: item.displayOrder,
                status: item.status
            };
        });

        // Get artwork count for each artist (Only count active and approved ones)
        for (let artist of formattedArtists) {
            let actualId = artist.artistId;
            
            // If no linked ID, try resolving by name once
            if (!actualId && artist.name) {
                const escapedName = artist.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const resolvedUser = await User.findOne({
                    $or: [
                        { displayName: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } },
                        { username: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } }
                    ]
                });
                if (resolvedUser) {
                    actualId = resolvedUser._id;
                    artist.artistId = actualId; // Update in-memory for the response
                }
            }

            if (actualId) {
                artist.artworks = await Product.countDocuments({ 
                    artist: actualId, 
                    status: "active",
                    "verification.status": "approved"
                });
            }
        }

        res.status(200).json({
            success: true,
            data: formattedArtists
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching featured artists",
            error: error.message
        });
    }
};

/**
 * @desc    Add new featured artist
 * @route   POST /api/v1/featured-artists
 * @access  Admin
 */
export const createFeaturedArtist = async (req, res) => {
    try {
        const { name, category, displayOrder, status, avatar } = req.body;

        // Auto-link artist by name if possible
        let artistId = null;
        if (name) {
            const trimmedName = name.trim();
            const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const user = await User.findOne({ 
                $or: [
                    { displayName: { $regex: new RegExp(`^${escapedName}$`, "i") } }, 
                    { username: { $regex: new RegExp(`^${escapedName}$`, "i") } }
                ] 
            });
            if (user) artistId = user._id;
        }

        // Validate count
        const activeCount = await FeaturedArtist.countDocuments({ status: "active" });
        if (status === "active" && activeCount >= 8) {
            return res.status(400).json({ success: false, message: "Only 8 artists can be active at a time" });
        }

        const featuredArtist = await FeaturedArtist.create({
            artist: artistId,
            name,
            avatar,
            category,
            displayOrder,
            status
        });

        res.status(201).json({
            success: true,
            data: featuredArtist
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating featured artist",
            error: error.message
        });
    }
};

/**
 * @desc    Update featured artist
 * @route   PUT /api/v1/featured-artists/:id
 * @access  Admin
 */
export const updateFeaturedArtist = async (req, res) => {
    try {
        const { name, category, displayOrder, status, avatar } = req.body;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid featured artist ID format" });
        }

        const featuredArtist = await FeaturedArtist.findById(id);
        if (!featuredArtist) {
            return res.status(404).json({ success: false, message: "Featured artist not found" });
        }

        // 1. Re-link logic if name is provided or it's not currently linked
        if (name && name.trim()) {
            const trimmedName = name.trim();
            // Only try to re-link if the name is different from current or no artist is linked
            if (trimmedName !== featuredArtist.name || !featuredArtist.artist) {
                const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const user = await User.findOne({ 
                    $or: [
                        { displayName: { $regex: new RegExp(`^${escapedName}$`, "i") } }, 
                        { username: { $regex: new RegExp(`^${escapedName}$`, "i") } }
                    ] 
                });
                
                if (user) {
                    featuredArtist.artist = user._id;
                }
            }
        }

        // 2. Limit check for active artists
        if (status === "active" && featuredArtist.status !== "active") {
            const activeCount = await FeaturedArtist.countDocuments({ status: "active" });
            if (activeCount >= 8) {
                return res.status(400).json({ success: false, message: "Cannot activate: The limit of 8 active featured artists has been reached." });
            }
        }

        // 3. Apply updates (with strict validation for required fields)
        if (name !== undefined) featuredArtist.name = name.trim() || featuredArtist.name;
        
        // Category is required by model, ensure we don't save an empty string
        if (category !== undefined) {
            const trimmedCat = category.trim();
            if (trimmedCat) featuredArtist.category = trimmedCat;
            else if (!featuredArtist.category) featuredArtist.category = "Art"; // Default fallback if currently empty
        }

        if (avatar !== undefined) featuredArtist.avatar = avatar;
        if (status !== undefined) featuredArtist.status = status;
        
        if (displayOrder !== undefined) {
            const pOrder = parseInt(displayOrder);
            if (!isNaN(pOrder)) featuredArtist.displayOrder = Math.min(8, Math.max(1, pOrder));
        }

        // 4. Final Save with error capture
        try {
            await featuredArtist.save();
        } catch (saveError) {
            console.error("DB Save Error:", saveError);
            return res.status(400).json({ 
                success: false, 
                message: "Update failed: " + (saveError.message.includes('unique') ? "An entry for this artist already exists." : saveError.message)
            });
        }

        // 5. Populate and return
        const updated = await FeaturedArtist.findById(featuredArtist._id).populate({
            path: "artist",
            select: "username displayName email avatar"
        });

        res.status(200).json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error("CRITICAL ERROR in updateFeaturedArtist:", error);
        res.status(500).json({
            success: false,
            message: "Server Error: " + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Remove featured artist
 * @route   DELETE /api/v1/featured-artists/:id
 * @access  Admin
 */
export const deleteFeaturedArtist = async (req, res) => {
    try {
        const { id } = req.params;
        const featuredArtist = await FeaturedArtist.findByIdAndDelete(id);

        if (!featuredArtist) {
            return res.status(404).json({ success: false, message: "Featured artist not found" });
        }

        // Also cleanup featured artworks for this artist
        await FeaturedArtwork.deleteMany({ artist: featuredArtist.artist });

        res.status(200).json({
            success: true,
            message: "Featured artist removed"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting featured artist",
            error: error.message
        });
    }
};

/**
 * @desc    Get all artworks of an artist
 * @route   GET /api/v1/featured-artists/artists/:id/artworks
 * @access  Admin
 */
export const getArtistArtworks = async (req, res) => {
    try {
        let { id } = req.params; // artist id
        const { name } = req.query;
        const isValidId = id && id !== "undefined" && id !== "null" && mongoose.Types.ObjectId.isValid(id);
        let finalArtistId = isValidId ? id : null;
        
        if (!finalArtistId && name) {
            const trimmedName = name.trim();
            const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            const user = await User.findOne({
                $or: [
                    { displayName: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } },
                    { username: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } }
                ]
            });
            
            if (user) {
                finalArtistId = user._id;
            }
        }

        if (!mongoose.Types.ObjectId.isValid(finalArtistId)) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No valid artist found to fetch artworks for"
            });
        }

        let artworks = await Product.find({ artist: finalArtistId });
        
        // If no artworks found by ID, and we have a name, try name search as fallback
        if (artworks.length === 0 && name) {
            const trimmedName = name.trim();
            const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            const fallbackUser = await User.findOne({
                $or: [
                    { displayName: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } },
                    { username: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } }
                ]
            });
            
            if (fallbackUser && (!finalArtistId || fallbackUser._id.toString() !== finalArtistId.toString())) {
                finalArtistId = fallbackUser._id;
                artworks = await Product.find({ artist: finalArtistId });
            }
        }
        
        // Find which ones are currently featured
        const featuredArtworks = await FeaturedArtwork.find({ artist: finalArtistId });
        const featuredIds = featuredArtworks.map(fa => fa.artwork.toString());

        const data = artworks.map(art => ({
            ...art.toObject(),
            isFeatured: featuredIds.includes(art._id.toString())
        }));

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("Error in getArtistArtworks:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching artist artworks: " + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Save selected artworks for profile display
 * @route   PUT /api/v1/featured-artists/artists/:id/featured-artworks
 * @access  Admin
 */
export const updateFeaturedArtworks = async (req, res) => {
    try {
        const { id } = req.params; // artist id
        const { artworkIds } = req.body; // array of artwork ids

        // Remove old featured artworks
        await FeaturedArtwork.deleteMany({ artist: id });

        // Add new ones
        const newFeatured = artworkIds.map(artworkId => ({
            artist: id,
            artwork: artworkId,
            isFeatured: true
        }));

        await FeaturedArtwork.insertMany(newFeatured);

        res.status(200).json({
            success: true,
            message: "Featured artworks updated"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating featured artworks",
            error: error.message
        });
    }
};

/**
 * @desc    Get all featured artists (Admin version - including inactive)
 * @route   GET /api/v1/featured-artists/admin/list
 * @access  Admin
 */
/**
 * @desc    Get featured artworks for an artist (Public)
 * @route   GET /api/v1/featured-artists/artists/:id/public-featured-artworks
 * @access  Public
 */
export const getFeaturedArtworksPublic = async (req, res) => {
    try {
        const { id } = req.params; 
        const { name } = req.query; // Allow name search from query too
        
        const isValidId = id && id !== "undefined" && id !== "null" && mongoose.Types.ObjectId.isValid(id);
        let actualArtistId = isValidId ? id : null;

        // Diagnostic: Check if this is a FeaturedArtist record ID
        if (isValidId) {
            const isFeaturedArtistRecord = await FeaturedArtist.findById(id);
            if (isFeaturedArtistRecord && isFeaturedArtistRecord.artist) {
                actualArtistId = isFeaturedArtistRecord.artist;
            }
        }

        // If no ID or ID is invalid, resolve by name (matches Admin logic)
        const searchName = name || (isValidId ? (await FeaturedArtist.findById(id))?.name : null);
        if (!actualArtistId && searchName) {
            const escapedName = searchName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const user = await User.findOne({
                $or: [
                    { displayName: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } },
                    { username: { $regex: new RegExp(escapedName.replace(/ /g, '.*'), "i") } }
                ]
            });
            if (user) actualArtistId = user._id;
        }

        if (!actualArtistId) {
            return res.status(200).json({ success: true, data: [] });
        }

        // Fetch artworks (Only approved ones for public view)
        const artworks = await Product.find({ 
            artist: actualArtistId,
            'verification.status': 'approved'
        }).limit(12);

        res.status(200).json({
            success: true,
            data: artworks
        });
    } catch (error) {
        console.error("Error in getFeaturedArtworksPublic:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching featured artworks",
            error: error.message
        });
    }
};

export const getAllFeaturedArtistsAdmin = async (req, res) => {
    try {
        const artists = await FeaturedArtist.find()
            .sort({ displayOrder: 1 })
            .populate({
                path: "artist",
                select: "username displayName email avatar"
            });

        res.status(200).json({
            success: true,
            data: artists
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching featured artists list",
            error: error.message
        });
    }
};
