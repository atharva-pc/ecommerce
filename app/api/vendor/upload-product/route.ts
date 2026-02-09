import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function invalid(message = "Invalid payload") {
  return NextResponse.json({ message }, { status: 400 });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim();
  const price = Number(formData.get("price"));
  const category = (formData.get("category") as string | null)?.trim();
  const preview = formData.get("preview") as File | null;
  const digital = formData.get("digital") as File | null;

  if (!title || !description || Number.isNaN(price) || !category || !preview || !digital) {
    return invalid("Please provide all required fields and files.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, vendor_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "vendor" || profile.vendor_status !== "approved") {
    return NextResponse.json({ message: "Vendor access restricted" }, { status: 403 });
  }

  const prefix = `${user.id}/${Date.now()}`;
  const previewPath = `previews/${prefix}-${preview.name}`;
  const digitalPath = `files/${prefix}-${digital.name}`;

  const { error: previewError } = await supabase.storage
    .from("product-previews")
    .upload(previewPath, preview, {
      cacheControl: "3600",
      upsert: false,
    });

  if (previewError) {
    return NextResponse.json({ message: previewError.message }, { status: 500 });
  }

  const previewUrl = supabase.storage
    .from("product-previews")
    .getPublicUrl(previewPath).data.publicUrl;

  const { error: digitalError } = await supabase.storage
    .from("product-files")
    .upload(digitalPath, digital, {
      cacheControl: "3600",
      upsert: false,
    });

  if (digitalError) {
    return NextResponse.json({ message: digitalError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      title,
      description,
      price: Math.round(price),
      category,
      preview_url: previewUrl,
      file_url: digitalPath,
      vendor_id: user.id,
    })
    .select("id, title, description, price, category, preview_url, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}
