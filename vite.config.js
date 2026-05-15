import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// =====================================================
// VITE CONFIGURATION
// =====================================================

export default defineConfig({
  plugins: [react(), tailwindcss()],
})