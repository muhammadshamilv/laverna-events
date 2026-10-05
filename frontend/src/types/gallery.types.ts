// Field names here must match gallery/serializers.py exactly.

export type GalleryMediaType = "IMAGE" | "VIDEO";

export interface GalleryUploadedBy {
  id: number;
  full_name: string;
  role: string;
}

export interface GalleryMedia {
  id: number;
  media_type: GalleryMediaType;
  file: string;
  thumbnail: string | null;
  caption: string;
  is_featured: boolean;
  uploaded_by: GalleryUploadedBy | null;
  created_at: string;
}