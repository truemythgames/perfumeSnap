import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://perfumesnap.app",
  output: "static",
  integrations: [react()],
});
