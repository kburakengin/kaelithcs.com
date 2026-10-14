import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://kaelithcs.com",
  // /klipler/ as a folder, so the old kaelithcs.com/klipler links keep working.
  build: { format: "directory" },
});
