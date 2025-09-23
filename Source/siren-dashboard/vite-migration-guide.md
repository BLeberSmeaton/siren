# Vite Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from Create React App (react-scripts) to Vite for enhanced security and performance.

## Why Migrate to Vite?

### Security Benefits
- **Fewer Dependencies**: Vite has significantly fewer transitive dependencies
- **Modern Tooling**: Built with security-first approach
- **Active Maintenance**: Rapid security updates and patches
- **No Webpack Vulnerabilities**: Uses Rollup for production builds

### Performance Benefits
- **Faster Development**: Hot Module Replacement (HMR) is much faster
- **Quicker Builds**: Optimized build process
- **Better Tree Shaking**: More efficient bundle optimization

## Migration Steps

### 1. Install Vite Dependencies

```bash
npm install --save-dev vite @vitejs/plugin-react @types/node
```

### 2. Create Vite Configuration

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          utils: ['axios']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
})
```

### 3. Update Package.json Scripts

Replace the scripts section:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### 4. Move index.html

Move `public/index.html` to the root directory and update it:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SIREN Dashboard</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

### 5. Update Environment Variables

Rename `.env` variables from `REACT_APP_` to `VITE_`:

```bash
# Before
REACT_APP_API_URL=http://localhost:5000

# After  
VITE_API_URL=http://localhost:5000
```

Update code references:
```typescript
// Before
const apiUrl = process.env.REACT_APP_API_URL;

// After
const apiUrl = import.meta.env.VITE_API_URL;
```

### 6. Update Import Statements

Update any absolute imports to use the alias:

```typescript
// Before
import { Component } from '../../../components/Component';

// After
import { Component } from '@/components/Component';
```

### 7. Remove Create React App Dependencies

```bash
npm uninstall react-scripts @testing-library/jest-dom
```

### 8. Update Testing Setup (Optional)

For testing with Vitest:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
  },
})
```

### 9. Update TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

## Security Enhancements

### Content Security Policy

Add CSP headers in your web server configuration:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.yourdomain.com;
```

### Security Headers

Configure your web server to include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## Testing the Migration

1. **Development Server**: `npm run dev`
2. **Production Build**: `npm run build`
3. **Preview Build**: `npm run preview`
4. **Run Tests**: `npm test`

## Rollback Plan

If issues arise, you can rollback by:

1. Restoring the original `package.json`
2. Running `npm install`
3. Moving `index.html` back to `public/`
4. Reverting environment variable names

## Benefits After Migration

- ✅ **Zero Known Vulnerabilities**: Vite has a clean security record
- ✅ **Faster Development**: 10x faster HMR
- ✅ **Smaller Bundle**: Better tree shaking and optimization
- ✅ **Modern Tooling**: ESM-first, TypeScript native support
- ✅ **Active Maintenance**: Regular updates and security patches

## Timeline Recommendation

- **Phase 1** (Immediate): Continue with current setup using security mitigations
- **Phase 2** (1-2 weeks): Plan and execute Vite migration
- **Phase 3** (Ongoing): Regular security audits and updates

This migration will eliminate all current vulnerabilities while providing a more secure and performant development experience.
