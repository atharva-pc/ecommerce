import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Construction, Image as ImageIcon, FileText, Bell, Plus, Trash2, Save, Upload, Loader2, GripVertical, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { toast } from 'sonner';
import { 
    getHomeSlides, 
    adminGetAllHomeSlides, 
    adminUpsertHomeSlide, 
    adminDeleteHomeSlide, 
    adminUploadHomeSlideImage 
} from '../../../utils/api';

import { DEFAULT_SLIDES } from '../../../data/sliderData';

const FORMATTED_DEFAULTS = DEFAULT_SLIDES.map((s, i) => ({ ...s, displayOrder: i, isActive: true }));

export function AdminContent() {
    const [slides, setSlides] = useState<any[]>(FORMATTED_DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState<number | null>(null);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            setLoading(true);
            const res = await adminGetAllHomeSlides();
            if (res.success && res.data && res.data.length > 0) {
                setSlides(res.data);
            } else {
                setSlides(FORMATTED_DEFAULTS);
            }
        } catch (e) {
            console.error('Failed to fetch slides:', e);
            // Keep default slides if fetch fails
            setSlides(FORMATTED_DEFAULTS);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlide = () => {
        const newSlide = {
            title: '',
            artist: '',
            image: { url: '', publicId: '' },
            displayOrder: slides.length,
            isActive: true
        };
        setSlides([...slides, newSlide]);
    };

    const handleRemoveSlide = async (index: number, id?: string) => {
        if (id) {
            if (!confirm('Are you sure you want to delete this slide?')) return;
            try {
                const res = await adminDeleteHomeSlide(id);
                if (res.success) {
                    toast.success('Slide deleted');
                    setSlides(slides.filter((_, i) => i !== index));
                }
            } catch (e: any) {
                toast.error(e.message || 'Failed to delete slide');
            }
        } else {
            setSlides(slides.filter((_, i) => i !== index));
        }
    };

    const handleImageUpload = async (index: number, file: File) => {
        try {
            setUploading(index);
            const formData = new FormData();
            formData.append('image', file);
            const res = await adminUploadHomeSlideImage(formData);
            if (res.success && res.data) {
                const updated = [...slides];
                updated[index] = { ...updated[index], image: res.data };
                setSlides(updated);
                toast.success('Image uploaded');
            }
        } catch (e: any) {
            toast.error(e.message || 'Upload failed');
        } finally {
            setUploading(null);
        }
    };

    const handleSaveSlide = async (index: number) => {
        const slide = slides[index];
        if (!slide.image?.url) {
            toast.error('Please upload an image first');
            return;
        }

        try {
            setSaving(true);
            const res = await adminUpsertHomeSlide({
                id: slide._id,
                ...slide
            });
            if (res.success) {
                toast.success('Slide saved successfully');
                fetchSlides();
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to save slide');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#a73f2b]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Content Management</h2>
                    <p className="text-muted-foreground">Manage homepage banners, featured sections, and announcements.</p>
                </div>
                <Button onClick={handleAddSlide} className="bg-[#a73f2b] hover:bg-[#b30452]">
                    <Plus className="w-4 h-4 mr-2" /> Add New Slide
                </Button>
            </div>

            <Tabs defaultValue="banners" className="w-full">
                <TabsList>
                    <TabsTrigger value="banners">Homepage Banners</TabsTrigger>
                    <TabsTrigger value="featured">Featured Section</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                </TabsList>

                <TabsContent value="banners" className="mt-6 space-y-6">
                    {slides.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-gray-500">No slides configured. Click "Add New Slide" to begin.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {slides.map((slide, index) => (
                                <Card key={slide._id || index} className="overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Preview */}
                                            <div className="w-full md:w-64 lg:w-80 bg-gray-100 flex items-center justify-center relative group aspect-video md:aspect-auto">
                                                {slide.image?.url || (typeof slide.image === 'string' && slide.image) ? (
                                                    <>
                                                        <img 
                                                            src={slide.image?.url || slide.image} 
                                                            alt="Preview" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <label className="cursor-pointer bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md transition-all">
                                                                <Upload className="w-6 h-6 text-white" />
                                                                <input 
                                                                    type="file" 
                                                                    className="hidden" 
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleImageUpload(index, file);
                                                                    }}
                                                                />
                                                            </label>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <label className="flex flex-col items-center gap-2 cursor-pointer text-gray-400 hover:text-[#a73f2b] transition-colors">
                                                        {uploading === index ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                                                        <span className="text-xs font-medium">Upload Image</span>
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleImageUpload(index, file);
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>

                                            {/* Form */}
                                            <div className="flex-1 p-6 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 mr-4">
                                                        <div className="space-y-2">
                                                            <Label>Slide Title</Label>
                                                            <Input 
                                                                placeholder="e.g., Discover Indian Art" 
                                                                value={slide.title}
                                                                onChange={(e) => {
                                                                    const updated = [...slides];
                                                                    updated[index].title = e.target.value;
                                                                    setSlides(updated);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Artist / Subtitle</Label>
                                                            <Input 
                                                                placeholder="e.g., Curated Collection" 
                                                                value={slide.artist}
                                                                onChange={(e) => {
                                                                    const updated = [...slides];
                                                                    updated[index].artist = e.target.value;
                                                                    setSlides(updated);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="icon" 
                                                            variant="outline" 
                                                            className="text-red-500 hover:bg-red-50"
                                                            onClick={() => handleRemoveSlide(index, slide._id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            className="bg-green-600 hover:bg-green-700"
                                                            onClick={() => handleSaveSlide(index)}
                                                            disabled={saving}
                                                        >
                                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <GripVertical className="w-3 h-3" />
                                                        Order: {slide.displayOrder}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="checkbox" 
                                                            id={`active-${index}`}
                                                            checked={slide.isActive}
                                                            onChange={(e) => {
                                                                const updated = [...slides];
                                                                updated[index].isActive = e.target.checked;
                                                                setSlides(updated);
                                                            }}
                                                        />
                                                        <label htmlFor={`active-${index}`}>Active</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="featured" className="mt-4">
                    <Card className="opacity-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Featured Collections
                            </CardTitle>
                            <CardDescription>Select which collections appear on the home page.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-center text-muted-foreground py-8">
                                Featured sections management coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="announcements" className="mt-4">
                    <Card className="opacity-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Site Announcements
                            </CardTitle>
                            <CardDescription>Create announcements that appear across the site.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-center text-muted-foreground py-8">
                                Announcements management coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
