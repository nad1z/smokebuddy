import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// When deployed to GitHub Pages, GITHUB_REPOSITORY is set by Actions (e.g. "user/smokebuddy")
// Derive base path from the repo name so assets load from the right subdirectory.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  plugins: [tailwindcss(), react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
