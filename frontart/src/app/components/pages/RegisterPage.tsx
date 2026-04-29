import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../utils/api';

// Helper function to extract error messages from backend response
const getErrorMessage = (error: any): string => {
  return error?.message || 'Registration failed. Please try again.';
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation helper
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return { valid: errors.length === 0, errors };
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.errors.join('. '), {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        duration: 5000,
      });
      return;
    }

    // Validate terms
    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    // Validate username
    if (formData.username.length < 3 || formData.username.length > 30) {
      toast.error('Username must be 3-30 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (formData.displayName.trim().length < 2 || formData.displayName.trim().length > 60) {
      toast.error('Display name must be 2-60 characters');
      return;
    }

    // Validate phone number
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setIsLoading(true);
    try {
      await register(
        formData.username,
        formData.displayName.trim(),
        formData.email,
        formData.password,
        formData.phone
      );
      toast.success('Account created successfully! Please check your email to verify your account.', {
        duration: 6000,
      });
      navigate('/login');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage, {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white overflow-hidden">
      {/* Left Side: Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex relative items-center justify-center bg-black group overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            src="https://res.cloudinary.com/dylofrbje/image/upload/v1776248053/18swapnil_sakhare_15000_wzzbfm.jpg"
            alt="Art Background"
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-10000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-6xl font-extrabold tracking-tight mb-6">
              <span style={{ 
                background: "linear-gradient(to right, #fdbc5aff, #fc5522ff, #f345c7ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(2px 2px 14px rgba(0,0,0,0.35))",
              }}>
                <span style={{ fontFamily: "'Playfair Display', serif" }}>art</span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: '600' }}>VPP</span>
              </span>
            </h1>
            <p className="text-xl text-gray-300 font-light max-w-md mx-auto leading-relaxed">
              Join a blooming community of creators and collectors. Start your journey today.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
          <div className="text-white/40 text-xs font-medium tracking-[0.2em] uppercase">
            Creative Community
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-gray-50/50 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b30452]/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#a73f2b]/5 rounded-full blur-3xl -ml-32 -mb-32" />

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[500px] z-10 py-10"
        >
          {/* Logo for Mobile */}
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span style={{ 
                background: "linear-gradient(to right, #fdbc5aff, #fc5522ff, #f345c7ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                <span style={{ fontFamily: "'Playfair Display', serif" }}>art</span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: '600' }}>VPP</span>
              </span>
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-500">Sign up and join our community of art lovers</p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm mb-8 border border-gray-100">
            <Link to="/login" className="flex-1 text-center py-3 rounded-xl text-gray-500 hover:text-gray-900 font-medium transition-all">
              Sign In
            </Link>
            <Link to="/register" className="flex-1 text-center py-3 rounded-xl bg-gray-900 text-white font-medium shadow-lg transition-all">
              Sign Up
            </Link>
          </div>

          <Card className="border-0 shadow-2xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-700 font-semibold mb-2 block ml-1" htmlFor="username">Username</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        className="pl-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                        placeholder="john_doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold mb-2 block ml-1" htmlFor="displayName">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        required
                        className="pl-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block ml-1" htmlFor="email">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="pl-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block ml-1" htmlFor="phone">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="pl-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-700 font-semibold mb-2 block ml-1" htmlFor="password">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="pl-12 pr-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-700 font-semibold mb-2 block ml-1" htmlFor="confirmPassword">Confirm</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="pl-12 pr-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-1">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    className="mt-1 border-gray-300 data-[state=checked]:bg-[#b30452] data-[state=checked]:border-[#b30452]"
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed text-gray-600">
                    I agree to the <Link to="/terms" className="text-[#b30452] font-bold">Terms</Link> & <Link to="/privacy" className="text-[#b30452] font-bold">Privacy Policy</Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full text-white rounded-2xl shadow-xl hover:shadow-[#b30452]/20 transition-all duration-300 py-7 text-lg mt-4 border-0 font-bold bg-gradient-to-r from-[#a73f2b] to-[#b30452] hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Create Account'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-[#b30452]/20 text-center">
            <p className="text-sm text-gray-600">
              <strong>Want to sell your art?</strong><br />
              Complete your profile then apply in the <Link to="/sell" className="text-[#b30452] font-bold hover:underline">Seller Hub</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
