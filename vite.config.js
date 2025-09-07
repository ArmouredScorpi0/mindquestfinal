import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // This 'define' block is the key to fixing the Firebase connection.
  // It tells Vite to find your VITE_FIREBASE_CONFIG environment variable
  // and make it available inside the application code under the name `__firebase_config__`.
  define: {
    '__firebase_config__': process.env.VITE_FIREBASE_CONFIG,
  }
})