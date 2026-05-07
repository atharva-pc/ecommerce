import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Construction, Image as ImageIcon, FileText, Bell, Plus, Trash2, Save, Upload, Loader2, GripVertical, X, Edit2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
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
    const [editingSlide, setEditingSlide] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            setLoading(true);
            const res = await adminGetAllHomeSlides();
            if (res.success && res.data) {
                const dbSlides = res.data;
                const merged = [...FORMATTED_DEFAULTS];
                
                dbSlides.forEach((dbSlide: any) => {
                    const order = dbSlide.displayOrder;
                    if (order !== undefined && order < merged.length) {
                        merged[order] = dbSlide;
                    } else {
                        merged.push(dbSlide);
                    }
                });
                setSlides(merged);
            } else {
                setSlides(FORMATTED_DEFAULTS);
            }
        } catch (e) {
            console.error('Failed to fetch slides:', e);
            setSlides(FORMATTED_DEFAULTS);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlide = () => {
        setEditingSlide({
            title: '',
            artist: '',
            image: { url: '', publicId: '' },
            displayOrder: slides.length,
            isActive: true
        });
        setIsDialogOpen(true);
    };

    const handleEditSlide = (slide: any) => {
        setEditingSlide({ ...slide });
        setIsDialogOpen(true);
    };

    const handleRemoveSlide = async (index: number, id?: string) => {
        if (id) {
            if (!confirm('Are you sure you want to delete this slide?')) return;
            try {
                const res = await adminDeleteHomeSlide(id);
                if (res.success) {
                    toast.success('Slide deleted');
                    fetchSlides();
                }
            } catch (e: any) {
                toast.error(e.message || 'Failed to delete slide');
            }
        } else {
            const updated = [...slides];
            updated.splice(index, 1);
            setSlides(updated);
        }
    };

    const handleSaveSlide = async () => {
        if (!editingSlide.image?.url && !editingSlide.image) {
            toast.error('Image is required');
            return;
        }

        try {
            setSaving(true);
            const res = await adminUpsertHomeSlide({
                id: editingSlide._id,
                ...editingSlide
            });
            if (res.success) {
                toast.success('Slide saved successfully');
                setIsDialogOpen(false);
                fetchSlides();
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to save slide');
        } finally {
            setSaving(false);
        }
    };

    const handleDialogImageUpload = async (file: File) => {
        try {
            setSaving(true);
            const formData = new FormData();
            formData.append('image', file);
            const res = await adminUploadHomeSlideImage(formData);
            if (res.success && res.data) {
                setEditingSlide({ ...editingSlide, image: res.data });
                toast.success('Image uploaded');
            }
        } catch (e: any) {
            toast.error(e.message || 'Upload failed');
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
                <div className="flex gap-2">
                    <Button onClick={handleAddSlide} className="bg-[#a73f2b] hover:bg-[#b30452]">
                        <Plus className="w-4 h-4 mr-2" /> Add New Slide
                    </Button>
                </div>
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
                                                    <img 
                                                        src={slide.image?.url || slide.image} 
                                                        alt="Preview" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-gray-400">
                                                        <ImageIcon className="w-8 h-8" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Display */}
                                            <div className="flex-1 p-6 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">{slide.title || 'Untitled Slide'}</h3>
                                                        <p className="text-sm text-gray-500">{slide.artist || 'No subtitle'}</p>
                                                        <div className="mt-2 flex items-center gap-3">
                                                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">
                                                                Order: {slide.displayOrder}
                                                            </span>
                                                            <span className={`text-xs font-medium px-2 py-1 rounded ${slide.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                {slide.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="icon" 
                                                            variant="outline" 
                                                            title="Edit Slide"
                                                            onClick={() => handleEditSlide(slide)}
                                                            className="hover:border-[#a73f2b] hover:text-[#a73f2b]"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            variant="outline" 
                                                            className="text-red-500 hover:bg-red-50"
                                                            onClick={() => handleRemoveSlide(index, slide._id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
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

                <TabsContent value="featured" className="mt-6">
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <Construction className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium">Featured Section Management</h3>
                            <p className="text-gray-500 max-w-sm">This feature is coming soon. You'll be able to manage the "Explore by Category" and "Featured Artists" sections here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="announcements" className="mt-6">
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <Bell className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium">Announcements Management</h3>
                            <p className="text-gray-500 max-w-sm">This feature is coming soon. You'll be able to manage sitewide announcement bars here.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Slide Editor Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>{editingSlide?._id ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
                        <DialogDescription>
                            Configure your homepage banner details and upload an image.
                        </DialogDescription>
                    </DialogHeader>

                    {editingSlide && (
                        <div className="grid gap-6 py-4">
                            {/* Image Upload Area */}
                            <div className="space-y-2">
                                <Label>Slide Image</Label>
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center group">
                                    {editingSlide.image?.url || (typeof editingSlide.image === 'string' && editingSlide.image) ? (
                                        <>
                                            <img 
                                                src={editingSlide.image?.url || editingSlide.image} 
                                                alt="Slide preview" 
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
                                                            if (file) handleDialogImageUpload(file);
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center gap-2 cursor-pointer text-gray-400 hover:text-[#a73f2b] transition-colors">
                                            {saving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                                            <span className="text-sm font-medium">Click to upload banner image</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleDialogImageUpload(file);
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Slide Title</Label>
                                    <Input 
                                        id="title"
                                        placeholder="Discover Indian Art" 
                                        value={editingSlide.title}
                                        onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="artist">Artist / Subtitle</Label>
                                    <Input 
                                        id="artist"
                                        placeholder="Curated Collection" 
                                        value={editingSlide.artist}
                                        onChange={(e) => setEditingSlide({ ...editingSlide, artist: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="order">Display Order</Label>
                                    <Input 
                                        id="order"
                                        type="number"
                                        value={editingSlide.displayOrder}
                                        onChange={(e) => setEditingSlide({ ...editingSlide, displayOrder: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-8">
                                    <input 
                                        type="checkbox" 
                                        id="dialog-active"
                                        checked={editingSlide.isActive}
                                        className="w-4 h-4 rounded border-gray-300 text-[#a73f2b] focus:ring-[#a73f2b]"
                                        onChange={(e) => setEditingSlide({ ...editingSlide, isActive: e.target.checked })}
                                    />
                                    <Label htmlFor="dialog-active" className="cursor-pointer">Active on Home Page</Label>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSlide} disabled={saving} className="bg-[#a73f2b] hover:bg-[#b30452]">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingSlide?._id ? 'Update Slide' : 'Add Slide'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
