import mongoose from 'mongoose';

const homeSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false
  },
  artist: {
    type: String,
    required: false
  },
  image: {
    url: { type: String, required: true },
    publicId: { type: String, required: false }
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const HomeSlide = mongoose.model('HomeSlide', homeSlideSchema);

export default HomeSlide;
