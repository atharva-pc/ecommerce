import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const fullName = (formData.get("fullName") as string | null)?.trim();
  const bio = (formData.get("bio") as string | null)?.trim();
  const instagram = (formData.get("instagram") as string | null)?.trim();
  const twitter = (formData.get("twitter") as string | null)?.trim();
  const website = (formData.get("website") as string | null)?.trim();
  const linkedin = (formData.get("linkedin") as string | null)?.trim();
  const profileImage = formData.get("profileImage") as File | null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate bio word count
  if (bio) {
    const words = bio.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 15 || words.length > 60) {
      return NextResponse.json(
        { message: "Bio must be between 15 and 60 words" },
        { status: 400 }
      );
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, vendor_status, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<{
      role: string | null;
      vendor_status: string | null;
      full_name: string | null;
      avatar_url: string | null;
    }>();

  if (!profile) {
    return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  }

  console.log("Current profile state:", {
    role: profile.role,
    vendor_status: profile.vendor_status,
    user_id: user.id,
  });

  // Only block if BOTH role is vendor AND status is pending
  if (profile.role === "vendor" && profile.vendor_status === "pending") {
    return NextResponse.json(
      {
        message: "Application already submitted",
        currentStatus: { role: profile.role, vendor_status: profile.vendor_status },
      },
      { status: 200 }
    );
  }

  if (profile.role === "vendor" && profile.vendor_status === "approved") {
    return NextResponse.json(
      {
        message: "You are already an approved vendor",
        currentStatus: { role: profile.role, vendor_status: profile.vendor_status },
      },
      { status: 200 }
    );
  }

  let avatarUrl: string | null = null;
  if (profileImage) {
    const previewPath = `vendor-avatars/${user.id}/${Date.now()}-${profileImage.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-previews")
      .upload(previewPath, profileImage, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      return NextResponse.json({ message: uploadError.message }, { status: 500 });
    }

    avatarUrl = supabase.storage
      .from("product-previews")
      .getPublicUrl(previewPath).data.publicUrl;
  }

  // Prepare update object with social media fields
  const updateData: any = {
    full_name: fullName ?? profile.full_name,
    role: "vendor",
    vendor_status: "pending",
    avatar_url: avatarUrl ?? profile.avatar_url,
  };

  // Add bio if provided
  if (bio) {
    updateData.bio = bio;
  }

  // Add social media fields if provided
  if (instagram) updateData.instagram = instagram;
  if (twitter) updateData.twitter = twitter;
  if (website) updateData.website = website;
  if (linkedin) updateData.linkedin = linkedin;

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // Verify the update worked
  const { data: updatedProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("role, vendor_status")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    console.error("Failed to verify profile update:", fetchError);
    return NextResponse.json({ message: "Update succeeded but verification failed" }, { status: 500 });
  }

  console.log("Profile updated successfully:", updatedProfile);

  return NextResponse.json({ message: "Vendor application submitted" });
}
