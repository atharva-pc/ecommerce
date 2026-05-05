import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from './ui/dialog';

interface LightboxImageProps {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: string;
}

export function LightboxImage({ src, alt, className = '', aspectRatio = 'aspect-[4/3]' }: LightboxImageProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <motion.div
                className={`relative overflow-hidden cursor-pointer group ${aspectRatio} ${className}`}
                whileHover="hover"
                onClick={() => setIsOpen(true)}
            >
                <motion.img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    variants={{
                        hover: { scale: 1.15 }
                    }}
                    transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                    className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover */}
                <motion.div 
                    variants={{
                        hover: { opacity: 1 }
                    }}
                    initial={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30">
                        <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                </motion.div>
            </motion.div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] p-0 overflow-hidden border-none bg-transparent shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{alt}</DialogTitle>
                        <DialogDescription>Full screen view of {alt}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative flex items-center justify-center w-full h-[90vh]">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
