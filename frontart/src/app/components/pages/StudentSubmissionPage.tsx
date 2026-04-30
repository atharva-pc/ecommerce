import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Loader2, Plus, Trash2, Upload, CheckCircle2, User, Mail, Phone, Lock, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '../ui/dialog';
import { toast } from 'sonner';
import {
    checkStudentSubmissionAvailability,
    submitStudentArtworkSubmission,
    submitStudentArtworkSubmissionAuthenticated,
    getStudentProfileInfo
} from '../../utils/api';
import { useApp } from '../../context/AppContext';

const FORM_STORAGE_KEY = 'student-artwork-submission-draft-v1';
const CATEGORY_OPTIONS = [
    'Calligraphy Artworks',
    'Digital Art',
    'Metal Art & Craft',
    'Mural Art',
    'Paintings',
    'Photographs',
    'Prints',
    'Handicrafts',
    'Sketches'
];

type CategoryOption = typeof CATEGORY_OPTIONS[number];

type ArtworkDraft = {
    category: CategoryOption;
    title: string;
    price: string;
    size: string;
    medium: string;
    description: string;
    files: File[];
    previews: string[];
    coverIndex: number;
    categoryMeta: Record<string, string | boolean>;
};

const LICENSE_OPTIONS = ['Personal Use', 'Commercial Use', 'Editorial Use', 'Exclusive Rights'];

const isYes = (value: unknown) => value === true || value === 'yes';

const sanitizeMeta = (meta: Record<string, string | boolean>) => {
    const cleaned: Record<string, string | boolean> = {};
    Object.entries(meta).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
            cleaned[key] = value;
            return;
        }
        const next = String(value || '').trim();
        if (next) cleaned[key] = next;
    });
    return cleaned;
};

const validateCategoryMeta = (artwork: ArtworkDraft) => {
    const m = artwork.categoryMeta || {};

    switch (artwork.category) {
        case 'Paintings':
        case 'Sketches':
            if (!m.frameOption) return false;
            if (m.frameOption === 'with_frame') {
                return !!m.sizeWithFrame && !!m.sizeWithoutFrame && !!m.priceWithFrame && !!m.frameMaterial;
            }
            return !!(m.sizeWithoutFrame || artwork.size);

        case 'Photographs':
            if (!m.frameOption || !m.printMedium || !m.licenseType) return false;
            if (m.frameOption === 'with_frame') {
                return !!m.sizeWithFrame && !!m.sizeWithoutFrame && !!m.priceWithFrame && !!m.frameMaterial;
            }
            return !!(m.sizeWithoutFrame || artwork.size);

        case 'Calligraphy Artworks':
            if (!m.frameOption || !m.scriptStyle || !m.licenseType) return false;
            if (m.frameOption === 'with_frame') {
                return !!m.sizeWithFrame && !!m.sizeWithoutFrame && !!m.priceWithFrame && !!m.frameMaterial;
            }
            return !!(m.sizeWithoutFrame || artwork.size);

        case 'Digital Art':
            return !!m.fileFormat && !!m.resolution && !!m.dimensions && !!m.deliveryMethod && !!m.licenseType;

        case 'Prints':
            if (!m.printType || !m.editionType || !m.paperType || !m.frameOption) return false;
            if (m.editionType === 'Limited Edition' && !m.editionNumber) return false;
            if (m.frameOption === 'with_frame') {
                return !!m.sizeWithFrame && !!m.sizeWithoutFrame && !!m.priceWithFrame && !!m.frameMaterial;
            }
            return !!(m.sizeWithoutFrame || artwork.size);

        case 'Metal Art & Craft':
            return !!m.material && !!m.technique && !!m.dimensions3d && !!m.weight && !!m.finishType && !!m.mountType;

        case 'Mural Art':
            return !!m.muralMedium && !!m.scale && !!m.surfaceType && !!m.originality && !!m.availabilityType;

        case 'Handicrafts':
            return !!m.craftType && !!m.materialsUsed && !!m.dimensions3d && !!m.weight && isYes(m.handmadeCertified) && !!m.quantityAvailable;

        default:
            return true;
    }
};

const createArtworkDraft = (): ArtworkDraft => ({
    category: 'Paintings',
    title: '',
    price: '',
    size: '',
    medium: '',
    description: '',
    files: [],
    previews: [],
    coverIndex: 0,
    categoryMeta: {}
});

const renderCategorySpecificFields = (
    artwork: ArtworkDraft,
    idx: number,
    updateMeta: (artworkIndex: number, key: string, value: string | boolean) => void
) => {
    const meta = artwork.categoryMeta || {};
    const frameOption = String(meta.frameOption || '');
    const editionType = String(meta.editionType || '');

    const frameFields = (
        <div className="grid md:grid-cols-2 gap-3">
            <div>
                <Label>Frame Option *</Label>
                <Select value={frameOption} onValueChange={(value) => updateMeta(idx, 'frameOption', value)}>
                    <SelectTrigger><SelectValue placeholder="Select frame option" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="with_frame">With Frame</SelectItem>
                        <SelectItem value="without_frame">Without Frame</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {frameOption === 'with_frame' && (
                <>
                    <div><Label>Size With Frame (W X H) *</Label><Input value={String(meta.sizeWithFrame || '')} onChange={(e) => updateMeta(idx, 'sizeWithFrame', e.target.value)} /></div>
                    <div><Label>Size Without Frame (W X H) *</Label><Input value={String(meta.sizeWithoutFrame || '')} onChange={(e) => updateMeta(idx, 'sizeWithoutFrame', e.target.value)} /></div>
                    <div><Label>Price With Frame *</Label><Input value={String(meta.priceWithFrame || '')} onChange={(e) => updateMeta(idx, 'priceWithFrame', e.target.value)} /></div>
                    <div><Label>Frame Material / Description *</Label><Input value={String(meta.frameMaterial || '')} onChange={(e) => updateMeta(idx, 'frameMaterial', e.target.value)} /></div>
                </>
            )}

            {frameOption === 'without_frame' && (
                <div>
                    <Label>Size Without Frame (W X H) *</Label>
                    <Input value={artwork.size || ''} readOnly className="bg-gray-100" />
                </div>
            )}
        </div>
    );

    switch (artwork.category) {
        case 'Paintings':
            return frameFields;

        case 'Photographs':
            return (
                <div className="space-y-3">
                    {frameFields}
                    <div className="grid md:grid-cols-2 gap-3">
                        <div><Label>Print Medium *</Label><Input value={String(meta.printMedium || '')} onChange={(e) => updateMeta(idx, 'printMedium', e.target.value)} placeholder="Glossy, Matte, Canvas" /></div>
                        <div>
                            <Label>License Type *</Label>
                            <Select value={String(meta.licenseType || '')} onValueChange={(value) => updateMeta(idx, 'licenseType', value)}>
                                <SelectTrigger><SelectValue placeholder="Select license" /></SelectTrigger>
                                <SelectContent>
                                    {LICENSE_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            );

        case 'Calligraphy Artworks':
            return (
                <div className="space-y-3">
                    {frameFields}
                    <div className="grid md:grid-cols-2 gap-3">
                        <div><Label>Script Style *</Label><Input value={String(meta.scriptStyle || '')} onChange={(e) => updateMeta(idx, 'scriptStyle', e.target.value)} placeholder="Arabic, Devanagari, Latin..." /></div>
                        <div>
                            <Label>License Type *</Label>
                            <Select value={String(meta.licenseType || '')} onValueChange={(value) => updateMeta(idx, 'licenseType', value)}>
                                <SelectTrigger><SelectValue placeholder="Select license" /></SelectTrigger>
                                <SelectContent>
                                    {LICENSE_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            );

        case 'Digital Art':
            return (
                <div className="grid md:grid-cols-2 gap-3">
                    <div><Label>File Format *</Label><Input value={String(meta.fileFormat || '')} onChange={(e) => updateMeta(idx, 'fileFormat', e.target.value)} placeholder="JPEG, PNG, SVG, TIFF" /></div>
                    <div><Label>Resolution (DPI) *</Label><Input value={String(meta.resolution || '')} onChange={(e) => updateMeta(idx, 'resolution', e.target.value)} /></div>
                    <div><Label>Dimensions *</Label><Input value={String(meta.dimensions || '')} onChange={(e) => updateMeta(idx, 'dimensions', e.target.value)} placeholder="e.g. 4000x3000 px" /></div>
                    <div><Label>Delivery Method *</Label><Input value={String(meta.deliveryMethod || '')} onChange={(e) => updateMeta(idx, 'deliveryMethod', e.target.value)} placeholder="Digital Download / Print-on-Demand" /></div>
                    <div>
                        <Label>License Type *</Label>
                        <Select value={String(meta.licenseType || '')} onValueChange={(value) => updateMeta(idx, 'licenseType', value)}>
                            <SelectTrigger><SelectValue placeholder="Select license" /></SelectTrigger>
                            <SelectContent>
                                {LICENSE_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            );

        case 'Prints':
            return (
                <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div><Label>Print Type *</Label><Input value={String(meta.printType || '')} onChange={(e) => updateMeta(idx, 'printType', e.target.value)} placeholder="Giclee, Screen Print..." /></div>
                        <div>
                            <Label>Edition Type *</Label>
                            <Select value={editionType} onValueChange={(value) => updateMeta(idx, 'editionType', value)}>
                                <SelectTrigger><SelectValue placeholder="Select edition type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open Edition">Open Edition</SelectItem>
                                    <SelectItem value="Limited Edition">Limited Edition</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {editionType === 'Limited Edition' && (
                            <div><Label>Edition Number *</Label><Input value={String(meta.editionNumber || '')} onChange={(e) => updateMeta(idx, 'editionNumber', e.target.value)} placeholder="e.g. 3/50" /></div>
                        )}
                        <div><Label>Paper / Substrate Type *</Label><Input value={String(meta.paperType || '')} onChange={(e) => updateMeta(idx, 'paperType', e.target.value)} /></div>
                    </div>
                    {frameFields}
                </div>
            );

        case 'Metal Art & Craft':
            return (
                <div className="grid md:grid-cols-2 gap-3">
                    <div><Label>Material *</Label><Input value={String(meta.material || '')} onChange={(e) => updateMeta(idx, 'material', e.target.value)} /></div>
                    <div><Label>Technique *</Label><Input value={String(meta.technique || '')} onChange={(e) => updateMeta(idx, 'technique', e.target.value)} /></div>
                    <div><Label>Dimensions (L x W x H) *</Label><Input value={String(meta.dimensions3d || '')} onChange={(e) => updateMeta(idx, 'dimensions3d', e.target.value)} /></div>
                    <div><Label>Weight *</Label><Input value={String(meta.weight || '')} onChange={(e) => updateMeta(idx, 'weight', e.target.value)} /></div>
                    <div><Label>Finish Type *</Label><Input value={String(meta.finishType || '')} onChange={(e) => updateMeta(idx, 'finishType', e.target.value)} /></div>
                    <div>
                        <Label>Mount Type *</Label>
                        <Select value={String(meta.mountType || '')} onValueChange={(value) => updateMeta(idx, 'mountType', value)}>
                            <SelectTrigger><SelectValue placeholder="Wall-mounted or freestanding" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="wall_mounted">Wall-mounted</SelectItem>
                                <SelectItem value="freestanding">Freestanding</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            );

        case 'Mural Art':
            return (
                <div className="grid md:grid-cols-2 gap-3">
                    <div><Label>Mural Medium *</Label><Input value={String(meta.muralMedium || '')} onChange={(e) => updateMeta(idx, 'muralMedium', e.target.value)} /></div>
                    <div><Label>Scale *</Label><Input value={String(meta.scale || '')} onChange={(e) => updateMeta(idx, 'scale', e.target.value)} placeholder="sq. ft / sq. m" /></div>
                    <div><Label>Surface Type *</Label><Input value={String(meta.surfaceType || '')} onChange={(e) => updateMeta(idx, 'surfaceType', e.target.value)} /></div>
                    <div>
                        <Label>Original / Reproduction *</Label>
                        <Select value={String(meta.originality || '')} onValueChange={(value) => updateMeta(idx, 'originality', value)}>
                            <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="original">Original</SelectItem>
                                <SelectItem value="reproduction">Reproduction</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Availability Type *</Label>
                        <Select value={String(meta.availabilityType || '')} onValueChange={(value) => updateMeta(idx, 'availabilityType', value)}>
                            <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="commission_only">Commission Only</SelectItem>
                                <SelectItem value="print_available">Print Available</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            );

        case 'Handicrafts':
            return (
                <div className="grid md:grid-cols-2 gap-3">
                    <div><Label>Craft Type *</Label><Input value={String(meta.craftType || '')} onChange={(e) => updateMeta(idx, 'craftType', e.target.value)} /></div>
                    <div><Label>Materials Used *</Label><Input value={String(meta.materialsUsed || '')} onChange={(e) => updateMeta(idx, 'materialsUsed', e.target.value)} /></div>
                    <div><Label>Dimensions (L x W x H) *</Label><Input value={String(meta.dimensions3d || '')} onChange={(e) => updateMeta(idx, 'dimensions3d', e.target.value)} /></div>
                    <div><Label>Weight *</Label><Input value={String(meta.weight || '')} onChange={(e) => updateMeta(idx, 'weight', e.target.value)} /></div>
                    <div><Label>Quantity Available *</Label><Input value={String(meta.quantityAvailable || '')} onChange={(e) => updateMeta(idx, 'quantityAvailable', e.target.value)} /></div>
                    <div>
                        <Label>Handmade Certification *</Label>
                        <Select value={String(meta.handmadeCertified || '')} onValueChange={(value) => updateMeta(idx, 'handmadeCertified', value === 'yes')}>
                            <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="yes">I confirm this is handmade</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            );

        case 'Sketches':
            return (
                <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div><Label>Sketch Medium *</Label><Input value={String(meta.sketchMedium || '')} onChange={(e) => updateMeta(idx, 'sketchMedium', e.target.value)} /></div>
                        <div><Label>Paper Type *</Label><Input value={String(meta.paperType || '')} onChange={(e) => updateMeta(idx, 'paperType', e.target.value)} /></div>
                    </div>
                    {frameFields}
                </div>
            );

        default:
            return null;
    }
};

const getSubmitBlockers = (
    form: {
        displayName: string;
        username: string;
        email: string;
        phone: string;
        password: string;
        confirmPassword: string;
        fullName: string;
        bio: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
        termsAccepted: boolean;
    },
    profilePicture: File | null,
    artworks: ArtworkDraft[],
    usernameAvailable: boolean | null,
    emailAvailable: boolean | null,
    requiresAccountCreation: boolean,
    isAuthenticated: boolean
) => {
    const blockers: string[] = [];

    if (!requiresAccountCreation && !isAuthenticated) {
        blockers.push('Please log in to submit with your existing account');
    }

    // Profile picture is only required for new account creation
    if (!profilePicture && !isAuthenticated) blockers.push('Profile picture is required');
    if (!form.displayName.trim()) blockers.push('Display name is required');

    if (requiresAccountCreation) {
        const username = form.username.trim();
        if (!username) blockers.push('Username is required');
        else if (username.length < 3) blockers.push('Username must be at least 3 characters');
        else if (!/^[a-zA-Z0-9_]+$/.test(username)) blockers.push('Username can contain only letters, numbers, and underscores');

        if (!form.email.trim()) blockers.push('Email is required');

        if (!form.password) blockers.push('Password is required');
        else {
            if (form.password.length < 8) blockers.push('Password must be at least 8 characters');
            if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
                blockers.push('Password must include uppercase, lowercase, and a number');
            }
        }

        if (!form.confirmPassword) blockers.push('Confirm password is required');
        if (form.password !== form.confirmPassword) blockers.push('Passwords do not match');

        if (usernameAvailable === false) blockers.push('Username is already taken');
        if (emailAvailable === false) blockers.push('Email is already registered');
    }

    if (!form.phone.trim()) blockers.push('Phone number is required');

    if (!form.fullName.trim()) blockers.push('Full name is required');

    const bioWordCount = form.bio.trim() ? form.bio.trim().split(/\s+/).length : 0;
    if (bioWordCount < 15) blockers.push('Bio must be at least 15 words');
    if (form.bio.trim().length < 50) blockers.push('Bio must be at least 50 characters');

    if (!form.street.trim()) blockers.push('Postal address is required');
    if (!form.city.trim()) blockers.push('City is required');
    if (!form.state.trim()) blockers.push('State is required');

    const pincode = form.pincode.trim();
    if (!pincode) blockers.push('Pincode is required');
    else if (!/^\d{6}$/.test(pincode)) blockers.push('Pincode must be exactly 6 digits');

    if (!artworks.length) blockers.push('Add at least one artwork');

    artworks.forEach((a, idx) => {
        const label = `Artwork #${idx + 1}`;
        if (!a.title.trim()) blockers.push(`${label}: title is required`);
        if (!a.price.trim() || Number(a.price) <= 0) blockers.push(`${label}: valid price is required`);
        if (!a.size.trim()) blockers.push(`${label}: size is required`);
        if (!a.medium.trim()) blockers.push(`${label}: medium/material is required`);
        if (a.files.length < 1) blockers.push(`${label}: at least 1 image is required`);
        if (!validateCategoryMeta(a)) blockers.push(`${label}: complete category-specific details`);
    });

    if (!form.termsAccepted) blockers.push('Accept Terms & Conditions to continue');

    return blockers;
};

export function StudentSubmissionPage() {
    const { user, login } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [referenceId, setReferenceId] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [authMode, setAuthMode] = useState<'create' | 'login'>('create');
    const [loginForm, setLoginForm] = useState({
        email: '',
        password: ''
    });
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [form, setForm] = useState({
        displayName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        bio: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        termsAccepted: false,
        honeypot: ''
    });

    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
    const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string>('');
    const [artworks, setArtworks] = useState<ArtworkDraft[]>([createArtworkDraft()]);
    const requiresAccountCreation = !user && authMode === 'create';

    const updateArtworkMeta = (
        artworkIndex: number,
        key: string,
        value: string | boolean
    ) => {
        setArtworks((prev) => prev.map((item, idx) => {
            if (idx !== artworkIndex) return item;

            const syncedMeta: Record<string, string | boolean> = {};
            if (key === 'frameOption' && value === 'without_frame') {
                syncedMeta.sizeWithoutFrame = item.size;
            }

            return {
                ...item,
                categoryMeta: {
                    ...item.categoryMeta,
                    ...syncedMeta,
                    [key]: value
                }
            };
        }));
    };

    useEffect(() => {
        const raw = localStorage.getItem(FORM_STORAGE_KEY);
        if (!raw) return;

        try {
            const parsed = JSON.parse(raw);
            if (parsed?.form) {
                setForm((prev) => ({ ...prev, ...parsed.form, password: '', confirmPassword: '' }));
            }
            if (Array.isArray(parsed?.artworks) && parsed.artworks.length > 0) {
                setArtworks(parsed.artworks.map((a: any) => ({
                    ...createArtworkDraft(),
                    ...a,
                    categoryMeta: a?.categoryMeta || {},
                    files: [],
                    previews: []
                })));
            }
        } catch {
            localStorage.removeItem(FORM_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        const save = setInterval(() => {
            const snapshot = {
                form: {
                    ...form,
                    password: '',
                    confirmPassword: ''
                },
                artworks: artworks.map((a) => ({
                    category: a.category,
                    title: a.title,
                    price: a.price,
                    size: a.size,
                    medium: a.medium,
                    description: a.description,
                    coverIndex: a.coverIndex,
                    categoryMeta: a.categoryMeta || {}
                }))
            };
            localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(snapshot));
        }, 30000);

        return () => clearInterval(save);
    }, [form, artworks]);

    useEffect(() => {
        if (!user) return;

        setAuthMode('login');
        
        // Fetch user's profile info from the backend
        getStudentProfileInfo()
            .then((response) => {
                if (response.success && response.data) {
                    const profileData = response.data;
                    setForm((prev) => ({
                        ...prev,
                        displayName: profileData.displayName || prev.displayName || user.name || '',
                        email: profileData.email || user.email || prev.email,
                        phone: profileData.phone || prev.phone || user.phone || '',
                        fullName: profileData.fullName || prev.fullName,
                        bio: profileData.bio || prev.bio,
                        street: profileData.street || prev.street,
                        city: profileData.city || prev.city,
                        state: profileData.state || prev.state,
                        pincode: profileData.pincode || prev.pincode,
                        country: profileData.country || prev.country || 'India'
                    }));
                }
            })
            .catch((error) => {
                console.error('Failed to fetch profile info:', error);
                // Fallback: just populate from user object
                setForm((prev) => ({
                    ...prev,
                    displayName: prev.displayName || user.name || '',
                    email: user.email || prev.email,
                    phone: prev.phone || user.phone || ''
                }));
            });
    }, [user]);

    useEffect(() => {
        if (!requiresAccountCreation) {
            setUsernameAvailable(null);
            setEmailAvailable(null);
            return;
        }

        if (!form.username && !form.email) {
            setUsernameAvailable(null);
            setEmailAvailable(null);
            return;
        }

        const timeout = setTimeout(async () => {
            if (form.username.length < 3 && !form.email) return;
            setCheckingAvailability(true);
            try {
                const response = await checkStudentSubmissionAvailability({
                    username: form.username || undefined,
                    email: form.email || undefined
                });
                if (response.success) {
                    setUsernameAvailable(response.data.usernameAvailable);
                    setEmailAvailable(response.data.emailAvailable);
                }
            } catch {
                // Keep UX non-blocking if availability call fails.
            } finally {
                setCheckingAvailability(false);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [form.username, form.email, requiresAccountCreation]);

    useEffect(() => () => {
        if (profilePreview) URL.revokeObjectURL(profilePreview);
        artworks.forEach((a) => a.previews.forEach((p) => URL.revokeObjectURL(p)));
    }, [profilePreview, artworks]);

    const submitBlockers = getSubmitBlockers(
        form,
        profilePicture,
        artworks,
        usernameAvailable,
        emailAvailable,
        requiresAccountCreation,
        Boolean(user)
    );
    const requiredReady = submitBlockers.length === 0;

    const updateArtwork = (index: number, patch: Partial<ArtworkDraft>) => {
        setArtworks((prev) => prev.map((item, idx) => {
            if (idx !== index) return item;

            const next = { ...item, ...patch };
            if (next.categoryMeta?.frameOption === 'without_frame') {
                next.categoryMeta = {
                    ...next.categoryMeta,
                    sizeWithoutFrame: next.size
                };
            }

            return next;
        }));
    };

    const onProfileChange = (file?: File) => {
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Profile picture must be JPG, PNG, or WebP');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Profile picture must be under 10MB');
            return;
        }
        if (profilePreview) URL.revokeObjectURL(profilePreview);
        setProfilePicture(file);
        setProfilePreview(URL.createObjectURL(file));
    };

    const onArtworkFilesChange = (artworkIndex: number, files: FileList | null) => {
        if (!files) return;
        const selected = Array.from(files);
        const current = artworks[artworkIndex];

        if (current.files.length + selected.length > 6) {
            toast.error('Maximum 6 images per artwork block');
            return;
        }

        const nextFiles: File[] = [...current.files];
        const nextPreviews: string[] = [...current.previews];

        for (const file of selected) {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                toast.error(`${file.name}: only JPG, PNG, WebP allowed`);
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name}: file must be under 10MB`);
                continue;
            }
            nextFiles.push(file);
            nextPreviews.push(URL.createObjectURL(file));
        }

        updateArtwork(artworkIndex, { files: nextFiles, previews: nextPreviews });
    };

    const removeArtworkImage = (artworkIndex: number, imageIndex: number) => {
        const current = artworks[artworkIndex];
        URL.revokeObjectURL(current.previews[imageIndex]);

        const nextFiles = current.files.filter((_, idx) => idx !== imageIndex);
        const nextPreviews = current.previews.filter((_, idx) => idx !== imageIndex);
        const nextCover = Math.max(0, Math.min(current.coverIndex, nextFiles.length - 1));

        updateArtwork(artworkIndex, {
            files: nextFiles,
            previews: nextPreviews,
            coverIndex: nextCover
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submitBlockers.length > 0) {
            toast.error(submitBlockers[0]);
            return;
        }

        // Profile picture is only required for new account creation, not for logged-in users
        if (!profilePicture && !user) {
            toast.error('Profile picture is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = new FormData();

            Object.entries(form).forEach(([key, value]) => {
                payload.append(key, String(value));
            });

            if (profilePicture) {
                payload.append('profilePicture', profilePicture);
            }

            artworks.forEach((item) => {
                item.files.forEach((file) => {
                    payload.append('artworkImages', file);
                });
            });

            // Build global image indexes in the same order as appended files.
            let globalImageIndex = 0;
            const normalizedMeta = artworks.map((item) => {
                const imageIndexes = item.files.map(() => {
                    const value = globalImageIndex;
                    globalImageIndex += 1;
                    return value;
                });
                return {
                    category: item.category,
                    title: item.title,
                    price: Number(item.price),
                    size: item.size,
                    medium: item.medium,
                    description: item.description,
                    primaryImageIndex: item.coverIndex,
                    imageIndexes,
                    categoryMeta: sanitizeMeta(item.categoryMeta || {})
                };
            });

            payload.set('artworksMeta', JSON.stringify(normalizedMeta));

            const response = requiresAccountCreation
                ? await submitStudentArtworkSubmission(payload)
                : await submitStudentArtworkSubmissionAuthenticated(payload);
            if (response.success) {
                setReferenceId(response.data.referenceId || response.data.applicationId);
                setShowSuccessModal(true);
                toast.success('Thanks for submitting. Your artwork is under review by admin. You will be updated via email.');
                localStorage.removeItem(FORM_STORAGE_KEY);
            }
        } catch (error: any) {
            toast.error(error.message || 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInlineLogin = async () => {
        const normalizedEmail = loginForm.email.trim().toLowerCase();
        if (!normalizedEmail || !loginForm.password) {
            toast.error('Please enter both email and password');
            return;
        }

        setIsLoggingIn(true);
        try {
            await login(normalizedEmail, loginForm.password);
            toast.success('Logged in. You can now submit new artworks with this account.');
        } catch (error: any) {
            toast.error(error?.message || 'Login failed');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen relative bg-[#F7F8FA] pb-24">
            {/* Artistic Header Section */}
            <div className="relative h-[450px] bg-[#0A0A0A] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=2071&auto=format&fit=crop" 
                        alt="Art background" 
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#F7F8FA]" />
                </div>
                
                <div className="relative z-10 max-w-5xl mx-auto px-6 h-full flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 drop-shadow-md" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Share Your Art with the World
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
                        Join our curated community of artists. Apply to sell your artworks on ArtVPP and reach collectors globally.
                    </p>
                </div>
            </div>

            {/* Form Container */}
            <div className="max-w-4xl mx-auto px-6 -mt-24 relative z-20">
                <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="w-5 h-5" /> Submission Received
                            </DialogTitle>
                            <DialogDescription className="text-gray-700">
                                Your artwork has been submitted and is under review. You will be updated via email.
                            </DialogDescription>
                        </DialogHeader>
                        {referenceId ? <p className="text-sm text-gray-600">Reference ID: <strong>{referenceId}</strong></p> : null}
                        <DialogFooter>
                            <Button type="button" onClick={() => setShowSuccessModal(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 md:p-12 mb-10 border border-white/20">
                    <div className="text-center mb-10 border-b border-gray-100 pb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#a73f2b] to-[#b30452] rounded-2xl mb-6 shadow-lg shadow-[#b30452]/20">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl font-serif font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Final Artwork Submission</h2>
                        <p className="text-gray-500 text-lg">Submit your artwork details for admin to review. Check email for current status.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* Section 1: Artist Profile */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                    <User className="w-5 h-5 text-[#a73f2b]" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">1. User Registration Information</h3>
                            </div>

                            {!user && (
                                <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                                    <Button
                                        type="button"
                                        variant={authMode === 'create' ? 'default' : 'ghost'}
                                        className={authMode === 'create' ? 'bg-white text-gray-900 shadow-sm hover:bg-gray-50' : 'text-gray-500 hover:text-gray-700'}
                                        onClick={() => setAuthMode('create')}
                                    >
                                        Create New Account
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={authMode === 'login' ? 'default' : 'ghost'}
                                        className={authMode === 'login' ? 'bg-white text-gray-900 shadow-sm hover:bg-gray-50' : 'text-gray-500 hover:text-gray-700'}
                                        onClick={() => setAuthMode('login')}
                                    >
                                        Login Existing Account
                                    </Button>
                                </div>
                            )}

                            {!user && authMode === 'login' && (
                                <div className="bg-orange-50/50 rounded-xl p-6 border border-orange-100 space-y-4">
                                    <p className="text-sm text-[#a73f2b] font-medium">New student? Create account once. Already submitted before? Log in and reuse your account.</p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <Input
                                                type="email"
                                                value={loginForm.email}
                                                onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                                                placeholder="Email address"
                                                className="pl-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <Input
                                                type={showLoginPassword ? "text" : "password"}
                                                value={loginForm.password}
                                                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                                                placeholder="Password"
                                                className="pl-10 pr-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button type="button" onClick={handleInlineLogin} disabled={isLoggingIn} className="w-full bg-gradient-to-br from-[#a73f2b] to-[#b30452] hover:opacity-90 text-white rounded-lg h-11 transition-all">
                                        {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Secure Login
                                    </Button>
                                </div>
                            )}

                            {/* Profile Upload */}
                            <div className="flex flex-col items-center justify-center py-6">
                                <Label className="text-sm font-semibold text-gray-700 mb-4 block w-full text-center">Upload profile picture *</Label>
                                <div className="relative group">
                                    <label
                                        htmlFor="student-profile-picture"
                                        className={`h-32 w-32 rounded-full border-2 border-dashed bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300 ${profilePreview ? 'border-transparent shadow-md' : 'border-gray-300 hover:border-[#a73f2b] hover:bg-orange-50'}`}
                                    >
                                        {profilePreview ? (
                                            <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <Plus className="w-8 h-8 text-gray-400 group-hover:text-[#a73f2b] transition-colors" />
                                                <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider group-hover:text-[#a73f2b]">Upload</span>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        id="student-profile-picture"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(e) => onProfileChange(e.target.files?.[0])}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Display Name *</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            value={form.displayName}
                                            onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                                            className="pl-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white"
                                            maxLength={60}
                                            placeholder="How you appear to others"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Full Legal Name *</Label>
                                    <Input
                                        value={form.fullName}
                                        onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                                        className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                {requiresAccountCreation && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Username *</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input 
                                                    value={form.username} 
                                                    onChange={(e) => setForm((p) => ({ ...p, username: e.target.value.replace(/\s/g, '') }))} 
                                                    className="pl-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]"
                                                    placeholder="johndoe_art"
                                                    required 
                                                />
                                            </div>
                                            {checkingAvailability ? <p className="text-xs text-gray-500 mt-1">Checking...</p> : null}
                                            {usernameAvailable === false ? <p className="text-xs text-red-600 mt-1">Username already taken</p> : null}
                                            {usernameAvailable === true ? <p className="text-xs text-green-600 mt-1">Username available</p> : null}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Email Address *</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input 
                                                    type="email" 
                                                    value={form.email} 
                                                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} 
                                                    className="pl-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]"
                                                    placeholder="you@example.com"
                                                    required 
                                                />
                                            </div>
                                            {emailAvailable === false ? <p className="text-xs text-red-600 mt-1">Email already registered</p> : null}
                                        </div>
                                    </>
                                )}

                                {user && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                            <Input type="email" value={user?.email || form.email} disabled className="pl-10 h-11 rounded-lg bg-gray-50 border-gray-200 text-gray-500" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Phone *</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            value={form.phone}
                                            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                                            className="pl-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white"
                                            placeholder="10-digit number"
                                            required
                                        />
                                    </div>
                                </div>

                                {requiresAccountCreation && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input type={showSignupPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="pl-10 pr-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]" required />
                                                <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none">
                                                    {showSignupPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">Confirm Password *</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} className="pl-10 pr-10 h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]" required />
                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none">
                                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 flex justify-between">
                                    <span>Artist Bio *</span>
                                    <span className="text-xs text-gray-500 font-normal">Min 15 words</span>
                                </Label>
                                <Textarea
                                    value={form.bio}
                                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                                    className="min-h-[120px] rounded-xl border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white"
                                    placeholder="Tell us about your art journey, style, and inspiration..."
                                    required
                                />
                            </div>
                        </div>

                        {/* Section 2: Address */}
                        <div className="space-y-8 pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-[#a73f2b]" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">2. Address</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Street Address *</Label>
                                    <Textarea
                                        value={form.street}
                                        onChange={(e) => setForm((p) => ({ ...p, street: e.target.value }))}
                                        className="h-20 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white resize-none"
                                        placeholder="Street Address, Apt, Suite"
                                        required
                                    />
                                </div>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">City *</Label>
                                        <Input
                                            value={form.city}
                                            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                                            className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">State / Region *</Label>
                                        <Input
                                            value={form.state}
                                            onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                                            className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Postal Code *</Label>
                                        <Input
                                            value={form.pincode}
                                            onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
                                            className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Country *</Label>
                                    <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] bg-white" required />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Artwork Submission */}
                        <div className="space-y-8 pt-8 border-t border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-[#a73f2b]" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900">3. Artwork Submission</h3>
                            </div>
                            <p className="text-sm text-gray-500">Each artwork needs 1-6 images and one cover image.</p>

                            <div className="space-y-8">
                                {artworks.map((artwork, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-2xl p-6 md:p-8 bg-white shadow-sm relative group transition-all hover:border-[#a73f2b]/30 hover:shadow-md">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-lg font-bold text-gray-900">Artwork #{idx + 1}</h4>
                                            {artworks.length > 1 && (
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setArtworks((prev) => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-gray-700">Category *</Label>
                                                <Select value={artwork.category} onValueChange={(value) => updateArtwork(idx, { category: value as CategoryOption, categoryMeta: {} })}>
                                                    <SelectTrigger className="h-11 rounded-lg border-gray-200 focus:ring-[#a73f2b]"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                                        {CATEGORY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2"><Label className="text-sm font-medium text-gray-700">Title *</Label><Input value={artwork.title} onChange={(e) => updateArtwork(idx, { title: e.target.value })} className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]" placeholder="Artwork title" required /></div>
                                            <div className="space-y-2"><Label className="text-sm font-medium text-gray-700">Price (INR) *</Label><Input type="number" min="1" step="0.01" value={artwork.price} onChange={(e) => updateArtwork(idx, { price: e.target.value })} className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]" placeholder="e.g. 5000" required /></div>
                                            <div className="space-y-2"><Label className="text-sm font-medium text-gray-700">Size (W x H) *</Label><Input value={artwork.size} onChange={(e) => updateArtwork(idx, { size: e.target.value })} className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]" placeholder="e.g. 24x36 inches" required /></div>
                                            <div className="space-y-2 md:col-span-2"><Label className="text-sm font-medium text-gray-700">Medium / Material *</Label><Input value={artwork.medium} onChange={(e) => updateArtwork(idx, { medium: e.target.value })} className="h-11 rounded-lg border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b]" placeholder="e.g. Oil on Canvas" required /></div>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <Label className="text-sm font-medium text-gray-700">Description</Label>
                                            <Textarea value={artwork.description} onChange={(e) => updateArtwork(idx, { description: e.target.value })} rows={3} className="rounded-xl border-gray-200 focus:border-[#a73f2b] focus:ring-[#a73f2b] resize-none p-4" placeholder="Provide details about the artwork, its inspiration, and history..." />
                                        </div>

                                        <div className="rounded-xl p-6 bg-gray-50 border border-gray-100 mb-6 transition-all hover:bg-gray-100/50">
                                            <p className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#a73f2b]" /> Category Details</p>
                                            {renderCategorySpecificFields(artwork, idx, updateArtworkMeta)}
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-sm font-medium text-gray-700">Choose Artwork Images *</Label>
                                            <div className="border-2 border-dashed border-gray-300 hover:border-[#a73f2b] bg-gray-50/50 hover:bg-orange-50/30 transition-all rounded-xl p-8 text-center cursor-pointer group" onClick={() => document.getElementById(`artwork-images-${idx}`)?.click()}>
                                                <input
                                                    id={`artwork-images-${idx}`}
                                                    type="file"
                                                    multiple
                                                    accept="image/jpeg,image/png,image/webp"
                                                    onChange={(e) => onArtworkFilesChange(idx, e.target.files)}
                                                    className="hidden"
                                                />
                                                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3 group-hover:text-[#a73f2b] transition-colors" />
                                                <p className="text-sm font-medium text-gray-900 mb-1">Click to upload images</p>
                                                <p className="text-xs text-gray-500">JPG, PNG, WebP up to 10MB each</p>
                                            </div>

                                            {artwork.previews.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
                                                    {artwork.previews.map((src, imageIdx) => (
                                                        <div key={src} className={`relative rounded-lg overflow-hidden border-2 transition-all group ${artwork.coverIndex === imageIdx ? 'border-[#a73f2b] shadow-sm' : 'border-gray-200'}`}>
                                                            <img src={src} alt={`Preview ${imageIdx + 1}`} className="h-24 w-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                                {artwork.coverIndex !== imageIdx && (
                                                                    <Button type="button" size="sm" variant="secondary" className="h-6 text-[10px] w-16 px-0 bg-white/90 text-gray-900 hover:bg-white" onClick={(e) => { e.stopPropagation(); updateArtwork(idx, { coverIndex: imageIdx }); }}>Set Cover</Button>
                                                                )}
                                                                <Button type="button" size="sm" variant="destructive" className="h-6 text-[10px] w-16 px-0 bg-red-600 hover:bg-red-700" onClick={(e) => { e.stopPropagation(); removeArtworkImage(idx, imageIdx); }}>Remove</Button>
                                                            </div>
                                                            {artwork.coverIndex === imageIdx && (
                                                                <div className="absolute top-1 left-1 bg-[#a73f2b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">Cover</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 border-gray-300 text-gray-600 hover:border-[#a73f2b] hover:text-[#a73f2b] hover:bg-orange-50/50 transition-all font-medium" onClick={() => setArtworks((prev) => [...prev, createArtworkDraft()])}>
                                    <Plus className="w-5 h-5 mr-2" /> Add Another Artwork
                                </Button>
                            </div>
                        </div>

                        {/* Terms and Submit */}
                        <div className="pt-8 border-t border-gray-100 space-y-6">
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h4>
                                <div className="max-h-32 overflow-y-auto text-sm text-gray-600 pr-2 space-y-2 custom-scrollbar">
                                    <p>By submitting this form, you confirm that all information provided and artwork uploaded are your original work or properly licensed, and that your submission respects the rights of others.</p>
                                    <p>Your submission will be reviewed by the admin team, and approved submission will be published on the platform.</p>
                                    <p>You also agree to the ArtVPP Terms, Privacy Policy, and moderation guidelines.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-3 mt-4">
                                <Checkbox id="terms" checked={form.termsAccepted} onCheckedChange={(value) => setForm((p) => ({ ...p, termsAccepted: !!value }))} className="mt-1 h-5 w-5 border-gray-300 text-[#a73f2b] focus:ring-[#a73f2b] rounded" />
                                <Label htmlFor="terms" className="text-sm font-medium text-gray-700 cursor-pointer leading-relaxed">I have read and agree to the Terms & Conditions and Privacy Policy *</Label>
                            </div>

                            <input
                                type="text"
                                value={form.honeypot}
                                onChange={(e) => setForm((p) => ({ ...p, honeypot: e.target.value }))}
                                className="hidden"
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                            />

                            <div className="pt-4 flex flex-col items-center">
                                <Button type="submit" disabled={isSubmitting || !form.termsAccepted} className={`w-full md:w-auto min-w-[200px] h-14 rounded-xl text-lg font-bold text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${(!form.termsAccepted || isSubmitting) ? 'bg-gray-400 cursor-not-allowed shadow-none hover:translate-y-0' : 'bg-gradient-to-br from-[#a73f2b] to-[#b30452] hover:opacity-90'}`}>
                                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                                    Submit for Admin Review
                                </Button>
                                
                                {!requiredReady && submitBlockers.length > 0 && form.termsAccepted ? (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg max-w-lg w-full text-center">
                                        <p className="text-sm font-medium text-red-600 flex items-center justify-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 block"></span>
                                            Complete required fields to submit. Next issue: {submitBlockers[0]}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
