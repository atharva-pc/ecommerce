"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Instagram, Twitter, Globe, Linkedin } from "lucide-react";

type VendorPayload = {
  fullName: string;
  bio: string;
  instagram: string;
  twitter: string;
  website: string;
  linkedin: string;
  profileImage: File | null;
};

type VendorSignUpFormProps = {
  initialFullName?: string;
};

const INITIAL_VENDOR_PAYLOAD: VendorPayload = {
  fullName: "",
  bio: "",
  instagram: "",
  twitter: "",
  website: "",
  linkedin: "",
  profileImage: null,
};

export default function VendorSignUpForm({
  initialFullName,
}: VendorSignUpFormProps) {
  const [payload, setPayload] = useState<VendorPayload>(INITIAL_VENDOR_PAYLOAD);
  const [buttonText, setButtonText] = useState("Submit Application");
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bioWordCount, setBioWordCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPayload((prev) => ({
      ...prev,
      fullName: initialFullName ?? prev.fullName,
    }));
  }, [initialFullName]);

  const handleChange = (key: keyof VendorPayload) => (value: string) => {
    setPayload((prev) => ({ ...prev, [key]: value }));

    // Count words for bio
    if (key === "bio") {
      const words = value.trim().split(/\s+/).filter(word => word.length > 0);
      setBioWordCount(words.length);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPayload((prev) => ({ ...prev, profileImage: file }));

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!payload.fullName.trim()) {
      setError("Full name is required.");
      return false;
    }

    if (!payload.bio.trim()) {
      setError("Bio is required.");
      return false;
    }

    const words = payload.bio.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length < 15) {
      setError("Bio must be at least 15 words.");
      return false;
    }

    if (words.length > 60) {
      setError("Bio must not exceed 60 words.");
      return false;
    }

    if (!payload.profileImage) {
      setError("Profile image is required.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setDisabled(true);
    setButtonText("Submitting…");

    const formData = new FormData();
    formData.append("fullName", payload.fullName);
    formData.append("bio", payload.bio);
    formData.append("instagram", payload.instagram);
    formData.append("twitter", payload.twitter);
    formData.append("website", payload.website);
    formData.append("linkedin", payload.linkedin);

    if (payload.profileImage) {
      formData.append("profileImage", payload.profileImage);
    }

    try {
      const response = await fetch("/api/vendors/apply", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Vendor application failed:", {
          status: response.status,
          statusText: response.statusText,
          result,
        });
        throw new Error(result.message || "Unable to submit request");
      }

      console.log("Vendor application successful:", result);
      setSuccess(true);
    } catch (err) {
      console.error("Vendor application error:", err);
      setError(err instanceof Error ? err.message : "Vendor request failed");
    } finally {
      setDisabled(false);
      setButtonText("Submit Application");
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Become an Artist</CardTitle>
        <CardDescription>
          Tell us about yourself and showcase your artistic journey
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="rounded-2xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-8 text-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
              Application Submitted!
            </h3>
            <p className="text-emerald-700 dark:text-emerald-300">
              Your vendor account is under review. We'll notify you within 24-48 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Label className="text-base font-semibold">Profile Picture *</Label>
              <div
                onClick={handleImageClick}
                className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary cursor-pointer transition-colors group overflow-hidden bg-gray-50 dark:bg-slate-900"
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    <Camera className="h-10 w-10 mb-2" />
                    <span className="text-xs font-medium">Click to upload</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                Click the icon above to upload your profile picture
              </p>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g., Alex Rivera"
                required
                value={payload.fullName}
                onChange={(e) => handleChange("fullName")(e.target.value)}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="bio">Artist Bio *</Label>
                <span className={`text-xs ${
                  bioWordCount < 15 
                    ? "text-red-500" 
                    : bioWordCount > 60 
                    ? "text-red-500" 
                    : "text-green-600 dark:text-green-400"
                }`}>
                  {bioWordCount} / 15-60 words
                </span>
              </div>
              <textarea
                id="bio"
                placeholder="Tell us about your artistic journey, style, and inspiration (15-60 words)..."
                required
                value={payload.bio}
                onChange={(e) => handleChange("bio")(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Share what makes your art unique. Min 15 words, max 60 words.
              </p>
            </div>

            {/* Social Media Section */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Social Media (Optional)
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Connect your social accounts to showcase your work
                </p>
              </div>

              {/* Instagram */}
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  placeholder="@username or profile URL"
                  value={payload.instagram}
                  onChange={(e) => handleChange("instagram")(e.target.value)}
                />
              </div>

              {/* Twitter */}
              <div className="space-y-2">
                <Label htmlFor="twitter" className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-blue-500" />
                  Twitter / X
                </Label>
                <Input
                  id="twitter"
                  placeholder="@username or profile URL"
                  value={payload.twitter}
                  onChange={(e) => handleChange("twitter")(e.target.value)}
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  Portfolio Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={payload.website}
                  onChange={(e) => handleChange("website")(e.target.value)}
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  placeholder="Profile URL"
                  value={payload.linkedin}
                  onChange={(e) => handleChange("linkedin")(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
              disabled={disabled}
            >
              {buttonText}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              * Required fields • We'll review your application within 24-48 hours
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}


