"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/toast-context";
import { createClient } from "@/utils/supabase/client";
import { Upload, Loader2 } from "lucide-react";

export default function VendorUploadPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "painting",
    isLimitedEdition: false,
  });
  const supabase = createClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast("Please login first", "error");
        router.push("/login");
        return;
      }

      // Get the file input
      const fileInput = document.getElementById("preview") as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (!file) {
        showToast("Please select an image", "error");
        setLoading(false);
        return;
      }

      // Upload image to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-previews")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        showToast("Failed to upload image", "error");
        setLoading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("product-previews")
        .getPublicUrl(fileName);

      // Create product
      const { error: productError } = await supabase
        .from("products")
        .insert({
          vendor_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          preview_url: publicUrl,
          file_url: publicUrl, // Same as preview for physical art
          is_limited_edition: formData.isLimitedEdition,
        });

      if (productError) {
        console.error("Product error:", productError);
        showToast("Failed to create product", "error");
        setLoading(false);
        return;
      }

      showToast("Product uploaded successfully!", "success");
      router.push("/vendor/dashboard");
    } catch (error) {
      console.error("Error uploading product:", error);
      showToast("Failed to upload product", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="container-custom py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload New Artwork</h1>
          <p className="text-muted-foreground mb-8">
            Add your original artwork to the marketplace
          </p>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Preview Image Upload */}
              <div>
                <Label htmlFor="preview">Artwork Image *</Label>
                <div className="mt-2">
                  {previewUrl ? (
                    <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 mb-4">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Click below to upload artwork image
                      </p>
                    </div>
                  )}
                  <Input
                    id="preview"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    required
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Sunset Landscape"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your artwork..."
                  className="w-full min-h-[100px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="5000"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You will receive 70% of the sale price
                </p>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-900 dark:border-slate-700"
                  required
                >
                  <option value="painting">Painting</option>
                  <option value="drawing">Drawing</option>
                  <option value="sketch">Sketch</option>
                  <option value="digital">Digital Art</option>
                </select>
              </div>

              {/* Limited Edition */}
              <div className="flex items-center space-x-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <input
                  id="limitedEdition"
                  type="checkbox"
                  checked={formData.isLimitedEdition}
                  onChange={(e) => setFormData({ ...formData, isLimitedEdition: e.target.checked })}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <Label htmlFor="limitedEdition" className="cursor-pointer font-medium">
                    Limited Edition Artwork
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check this if your artwork is a limited edition piece (only one original available)
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Artwork"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
