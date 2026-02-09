import Navbar from "@/components/Navbar";
import VendorSignUpForm from "@/components/VendorSignUpForm";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle, Clock, XCircle, Palette, TrendingUp, Users, Shield } from "lucide-react";

export default async function VendorSignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <main className="container-custom py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Become an Artist on ArtVPP
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Join our community of talented artists and start selling your artwork today
            </p>
          </div>

          {/* Benefits Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6 text-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">70% Revenue</h3>
              <p className="text-sm text-muted-foreground">Keep 70% of every sale you make</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6 text-center">
              <div className="bg-green-100 dark:bg-green-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Palette className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Your Gallery</h3>
              <p className="text-sm text-muted-foreground">Showcase unlimited artworks</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6 text-center">
              <div className="bg-purple-100 dark:bg-purple-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Global Reach</h3>
              <p className="text-sm text-muted-foreground">Access to art lovers worldwide</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-lg p-6 text-center">
              <div className="bg-orange-100 dark:bg-orange-900/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Payment</h3>
              <p className="text-sm text-muted-foreground">Safe transactions via Razorpay</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 border rounded-2xl p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Start?</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to your account to begin your vendor application
            </p>
            <div className="space-y-3">
              <Link href="/login" className="block">
                <button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                  Sign In
                </button>
              </Link>
              <Link href="/signup" className="block">
                <button className="w-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-foreground font-semibold py-3 px-6 rounded-lg transition-colors">
                  Create Account
                </button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, vendor_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  const status = profile.vendor_status;
  const isVendor = profile.role === "vendor";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />
      <main className="container-custom py-16">
        {isVendor && status === "pending" ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-8 text-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Application Under Review</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Thank you for applying! Our team is reviewing your vendor application.
              </p>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-6 text-left space-y-3">
                <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Our admin team reviews all applications within 24-48 hours
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    You'll receive an email notification once your application is approved
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    After approval, you can immediately start uploading your artwork
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isVendor && status === "approved" ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
              <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">You're All Set!</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Your vendor account is approved. Start showcasing your art to the world!
              </p>
              <Link href="/vendor/dashboard">
                <button className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          </div>
        ) : isVendor && status === "rejected" ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
              <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-3">Application Not Approved</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Unfortunately, your vendor application was not approved at this time.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please reach out to our support team for more information or to discuss reapplication.
              </p>
              <a href="mailto:support@artvpp.com">
                <button className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors">
                  Contact Support
                </button>
              </a>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-3">Vendor Application</h1>
              <p className="text-lg text-muted-foreground">
                Complete the form below to become an artist on ArtVPP
              </p>
            </div>
            <VendorSignUpForm initialFullName={profile.full_name ?? undefined} />
          </div>
        )}
      </main>
    </div>
  );
}
