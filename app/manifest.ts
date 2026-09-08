import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dagsverket",
    short_name: "Dagsverket",
    description: "Familjens dashboard – kalender, sysslor, inköp och middagar.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#0b0f17",
    theme_color: "#0b0f17",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
