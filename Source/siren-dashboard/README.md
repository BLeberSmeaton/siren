# SIREN Dashboard - React Frontend

A modern React TypeScript dashboard for the SIREN Support Signal Intelligence system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 📋 Prerequisites

- Node.js 16+ (see `.nvmrc` for exact version)
- SIREN API running on `http://localhost:5135`

## 🏗️ Architecture

- **React 19** with TypeScript
- **Feelix-inspired** design system
- **Recharts** for data visualization
- **Axios** for API communication
- **Jest + React Testing Library** for testing

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── SignalTable.tsx      # Signal list with filtering
│   ├── TriagePanel.tsx      # Manual triage interface
│   └── DashboardSummary.tsx # Analytics dashboard
├── pages/               # Page components  
├── services/            # API integration
├── types/              # TypeScript definitions
├── utils/              # Utility functions
│   └── csvUtils.ts         # Native CSV operations
└── __tests__/          # Component tests
```

## 🎯 Key Features

### Manual Triage (Innovation Feature)
- Human+AI collaborative interface
- Priority scoring (1-10 scale)
- Category override capabilities
- Business context notes

### Analytics Dashboard
- Real-time signal statistics
- Category distribution charts
- Triage progress tracking
- Visual data representation

### Signal Management
- Sortable, filterable signal table
- Category-based filtering
- Responsive design
- Real-time updates

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false

# Run specific test file
npm test SignalTable.test.tsx
```

## 🔧 Configuration

### Environment Variables
```bash
# API base URL (optional, defaults to localhost:5135)
REACT_APP_API_BASE_URL=http://localhost:5135/api
```

### Development Server
- **Port**: 3000 (configurable)
- **API Proxy**: Automatically proxies to backend API
- **Hot Reload**: Enabled for development

## 🏭 Production Build

```bash
# Create optimized production build
npm run build

# Serve locally for testing
npx serve -s build
```

The build creates optimized static files in the `build/` directory ready for deployment.

## 🛡️ Security

- **Native CSV utilities** - No external parsing dependencies
- **Localhost development** - Dev server restricted to 127.0.0.1
- **Production secure** - All builds use secure, tested code
- See main `SECURITY.md` for full security policy

## 📚 Related Documentation

- **[Main Project README](../../README.md)** - Full project overview
- **[Security Policy](./SECURITY.md)** - Security measures and policies
- **[Vite Migration Guide](./vite-migration-guide.md)** - Future enhancement path

## 🤝 Development

### Adding New Components
1. Create component in `src/components/`
2. Add TypeScript types in `src/types/`
3. Write tests in `src/__tests__/`
4. Update this README if needed

### API Integration
- Use `src/services/api.ts` for all API calls
- Follow existing patterns for error handling
- Add response type definitions

### Styling
- Use CSS custom properties for theming
- Follow Feelix-inspired design patterns
- Ensure responsive design principles

---

**Part of the SIREN Support Signal Intelligence Response Engine**