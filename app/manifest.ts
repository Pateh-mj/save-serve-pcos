import type { MetadataRoute } from "next";

// Installable PWA (report §1.5): staff and smartphone patients can add SaveServe to the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SaveServe — Patient-Centric Orchestration System",
    short_name: "SaveServe",
    description: "Book visits, view health records and bills. No internet? Dial *384#.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
