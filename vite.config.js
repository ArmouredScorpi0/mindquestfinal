import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // This 'define' block is the key to fixing the Firebase connection.
  define: {
    '__firebase_config__': process.env.VITE_FIREBASE_CONFIG,
  }
})