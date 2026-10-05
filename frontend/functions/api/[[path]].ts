// Cloudflare Pages Function: forwards every /api/* request to the Django
// backend on Render. The browser only ever talks to the Pages site, so the
// login cookies are first-party (no cross-site cookie blocking, no CORS).
//
// BACKEND_ORIGIN is set in the Pages project's Variables, for example:
//   https://laverna-api.onrender.com   (no trailing slash)

interface Env {
    BACKEND_ORIGIN: string;
  }
  
  export const onRequest = async (context: {
    request: Request;
    env: Env;
  }): Promise<Response> => {
    const { request, env } = context;
  
    if (!env.BACKEND_ORIGIN) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "BACKEND_ORIGIN is not configured on this Pages project.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, env.BACKEND_ORIGIN);
  
    // new Request(url, request) copies the method, headers (including the
    // auth cookies) and the body, so uploads and JSON posts pass straight through.
    const upstream = new Request(target.toString(), request);
  
    return fetch(upstream, { redirect: "manual" });
  };