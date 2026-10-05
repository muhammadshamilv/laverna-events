import { API_ORIGIN } from "@/api/client";

// The events API is inconsistent about this field, confirmed live: the
// list endpoint (ListAPIView, which auto-injects request context into its
// serializer) returns an ABSOLUTE cover_image URL
// ("http://127.0.0.1:8000/media/..."), while create/detail/update
// (plain APIView methods building EventSerializer without a request in
// context) return a RELATIVE path ("/media/events/covers/...."). This
// resolves either shape to a usable <img src>, and passes through null.
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
