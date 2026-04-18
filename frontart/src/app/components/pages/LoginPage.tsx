import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useApp } from '../../context/AppContext';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';

// Helper function to extract error messages from backend response
const getErrorMessage = (error: any): string => {
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map((e: any) => e.message).join('. ');
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  return error?.message || 'Login failed. Please try again.';
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedEmail = loginData.email.trim().toLowerCase();

    if (!normalizedEmail || !loginData.password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(normalizedEmail, loginData.password);
      toast.success('Login successful!');

      // Navigate based on role
      if (response.role === 'admin') {
        navigate('/dashboard/admin');
      } else if (response.role === 'artist') {
        navigate('/dashboard/vendor');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.toLowerCase().includes('verify') || errorMessage.toLowerCase().includes('verification')) {
        toast.error(errorMessage, {
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
          duration: 6000,
          action: {
            label: 'Verify Email',
            onClick: () => navigate('/verify-email'),
          },
        });
      } else {
        toast.error(errorMessage, {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          duration: 5000,
        });
      }
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
            src="https://res.cloudinary.com/dylofrbje/image/upload/v1776247101/d8d54a62-236d-4746-9c6a-0e542af05016_zmuvmq.jpg"
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
              Step into a world where creativity meets freedom. Your collection, your rules.
            </p>
          </motion.div>
        </div>

        {/* Floating elements for extra flair */}
        <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
          <div className="text-white/40 text-xs font-medium tracking-[0.2em] uppercase">
            Curating Excellence
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-gray-50/50 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b30452]/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#a73f2b]/5 rounded-full blur-3xl -ml-32 -mb-32" />

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[440px] z-10"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">Sign in to continue your artistic journey</p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm mb-8 border border-gray-100">
            <Link to="/login" className="flex-1 text-center py-3 rounded-xl bg-gray-900 text-white font-medium shadow-lg transition-all">
              Sign In
            </Link>
            <Link to="/register" className="flex-1 text-center py-3 rounded-xl text-gray-500 hover:text-gray-900 font-medium transition-all">
              Sign Up
            </Link>
          </div>

          <Card className="border-0 shadow-2xl shadow-gray-200/50 bg-white/70 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 sm:p-10">
              {/* Google Sign In */}
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 py-7 rounded-2xl border-gray-200 text-gray-700 hover:bg-white hover:border-gray-900 transition-all duration-300 bg-white shadow-sm font-semibold mb-8 group"
                onClick={() => loginWithGoogle()}
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="bg-transparent px-4 text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block ml-1" htmlFor="email">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="pl-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <Label className="text-gray-700 font-semibold" htmlFor="password">Password</Label>
                    <Link to="/forgot-password" size="sm" className="text-xs font-bold text-[#b30452] hover:text-[#a73f2b] transition-colors">
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#b30452] transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="pl-12 h-14 rounded-2xl border-gray-200 focus:border-[#b30452] focus:ring-[#b30452]/10 transition-all bg-white/50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full text-white rounded-2xl shadow-xl hover:shadow-[#b30452]/20 transition-all duration-300 py-7 text-lg mt-4 border-0 font-bold bg-gradient-to-r from-[#a73f2b] to-[#b30452] hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-10">
            Artvpp Community • Buy & Sell with Freedom
          </p>
        </motion.div>
      </div>
    </div>
  );
}
