# 🚨 SIREN - Support Signal Intelligence Response Engine

**A modern React + ASP.NET Core dashboard for intelligent support signal categorization and human-AI collaborative triage.**

## 📋 **PROJECT OVERVIEW**

SIREN is an enterprise-grade solution that combines AI-powered categorization with human expertise for support signal management. Built with a React frontend and ASP.NET Core Web API backend, it showcases modern web development practices while preserving 100% of existing tested business logic.

### **🎯 Key Innovation: Human+AI Collaboration**
- **AI Categorization**: Automatic signal classification using keyword-based rules
- **Human Triage**: Manual scoring interface for business context and priority override
- **Visual Analytics**: Real-time dashboards showing collaborative insights
- **Enterprise Ready**: Professional UI with responsive design and comprehensive testing

## 🏗️ **ARCHITECTURE**

```
┌─────────────────────────────────────────────────────────────────┐
│ React Frontend (TypeScript)                    Port 3000       │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│ │   Dashboard     │ │  Signal Table   │ │  Triage Panel   │   │
│ │   Analytics     │ │   + Filtering   │ │ (Innovation!)   │   │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│ • Feelix-inspired design • Recharts • React Testing Library   │
└─────────────────────────────────────────────────────────────────┘
                                │ HTTP API Calls
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ ASP.NET Core Web API (.NET 9.0)               Port 5135       │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│ │ SignalsController│ │CategoriesController│ │  CORS + OpenAPI │   │
│ │ • GET/PUT       │ │ • Stats/Filter  │ │   Configured    │   │
│ │ • Manual Score  │ │ • Auto-Categorize│ │                 │   │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                │ Service Layer
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ SIREN.Core (Existing - 100% Preserved)                        │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│ │ ISignalProvider │ │  ICategorizer   │ │  SupportSignal  │   │
│ │ (Plugin Architecture) │ (Keyword Engine) │    (Models)     │   │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│ ✅ 17 Passing Tests • CSV Provider • Category Engine         │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 **GETTING STARTED**

### **Prerequisites**
- .NET 9.0 SDK
- Node.js (v16+ recommended)
- Visual Studio Code or Visual Studio 2022

### **1. Clone and Setup**
```bash
git clone https://github.com/BLeberSmeaton/siren.git
cd siren/Source
```

### **2. Start the API Server**
```bash
# Start the ASP.NET Core Web API
dotnet run --project SIREN.API

# API will be available at: http://localhost:5135
# OpenAPI docs at: http://localhost:5135/swagger
```

### **3. Start the React Frontend**
```bash
# In a new terminal window
cd siren-dashboard

# Install dependencies (first time only)
npm install

# Start the React development server
npm start

# Frontend will be available at: http://localhost:3000
```

### **4. Open the Dashboard**
Navigate to `http://localhost:3000` to see the full SIREN dashboard with real-time data!

## 📊 **DASHBOARD FEATURES**

### **🎯 Manual Triage (Innovation Day Highlight)**
Click "Triage" on any signal to access the human+AI collaboration interface:
- **AI Analysis**: Shows automatic categorization with confidence
- **Human Assessment**: Priority scoring slider (1-10 scale)
- **Category Override**: Manual category selection
- **Business Context**: Triage notes for decision rationale
- **Save & Track**: Persistent manual scoring

### **📈 Analytics Dashboard**
- **Summary Cards**: Total signals, categorized count, manual triage progress
- **Visual Charts**: Bar charts and pie charts showing category distribution
- **Category Statistics**: Detailed breakdown with average scores and latest activity
- **Real-time Updates**: Automatic refresh when data changes

### **📋 Signal Management**
- **Intelligent Table**: Sortable, filterable signal list
- **Category Badges**: Visual indicators for different signal types
- **Priority Scores**: Color-coded manual and automatic scoring
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🧪 **TESTING**

### **Backend Tests (Existing)**
```bash
# Run the comprehensive test suite (17 tests)
dotnet test SIREN.Core.Tests

# All tests should pass - foundation is solid! ✅
```

### **Frontend Tests (New)**
```bash
cd siren-dashboard

# Run React component tests
npm test

# Run tests once
npm test -- --watchAll=false

# Tests include Dashboard, API integration, and component rendering
```

## 📁 **PROJECT STRUCTURE**

```
Source/
├── SIREN.Core/                    # 🏗️ Domain Logic (Existing)
│   ├── Interfaces/               # Plugin contracts
│   ├── Models/                   # Domain models
│   ├── Providers/               # Data sources (CSV)
│   └── Services/                # Business logic
├── SIREN.Core.Tests/             # ✅ Test Suite (17 tests)
├── SIREN.API/                    # 🌐 Web API (New)
│   ├── Controllers/             # REST endpoints
│   │   ├── SignalsController.cs    # Signal operations
│   │   └── CategoriesController.cs # Category operations
│   └── Program.cs               # API configuration
├── SIREN.Console/               # 🖥️ CLI Demo (Existing)
└── siren-dashboard/             # ⚛️ React Frontend (New)
    ├── src/
    │   ├── components/          # React components
    │   │   ├── SignalTable.tsx      # Signal list view
    │   │   ├── TriagePanel.tsx      # Manual triage UI
    │   │   └── DashboardSummary.tsx # Analytics
    │   ├── pages/               # Page components
    │   ├── services/            # API integration
    │   ├── types/              # TypeScript definitions
    │   └── __tests__/          # Component tests
    └── package.json            # Dependencies
```

## 🎯 **API ENDPOINTS**

### **Signals**
- `GET /api/signals` - Get all categorized signals
- `GET /api/signals/{id}` - Get specific signal
- `PUT /api/signals/{id}/manual-score` - Update manual scoring
- `GET /api/signals/by-category/{category}` - Filter by category
- `GET /api/signals/summary` - Dashboard statistics

### **Categories**
- `GET /api/categories` - Get all categories
- `GET /api/categories/stats` - Category statistics
- `POST /api/categories/categorize/{id}` - Manual categorization

## 🔧 **CONFIGURATION**

### **API Settings**
- Default port: `5135` (configurable in `launchSettings.json`)
- CORS enabled for React development ports
- OpenAPI/Swagger documentation enabled in development

### **Frontend Settings**
- API base URL: `http://localhost:5135/api` (configurable in `api.ts`)
- Development port: `3000`
- Production build: `npm run build`

## 🚀 **DEPLOYMENT**

### **Production Build**
```bash
# Build the React frontend for production
cd siren-dashboard
npm run build

# Publish the API for deployment
cd ..
dotnet publish SIREN.API -c Release -o ./publish
```

### **Docker Support** (Future Enhancement)
Ready for containerization with Docker Compose for full-stack deployment.

## 📚 **TECHNOLOGY STACK**

### **Backend**
- **ASP.NET Core 9.0** - Modern web API framework
- **C#** - Type-safe business logic
- **Dependency Injection** - Clean architecture
- **OpenAPI/Swagger** - API documentation

### **Frontend**
- **React 19** - Modern UI framework
- **TypeScript** - Type safety and developer experience
- **Recharts** - Data visualization
- **Axios** - HTTP client for API calls
- **CSS Custom Properties** - Feelix-inspired design system

### **Testing**
- **xUnit** - Backend unit testing (existing)
- **Jest** - JavaScript unit testing
- **React Testing Library** - Component testing
- **MSW** - API mocking (future enhancement)

## 🎉 **INNOVATION DAY DEMO SCRIPT**

1. **Show the Dashboard** - Modern, professional interface
2. **Demonstrate Auto-Categorization** - AI working in real-time
3. **Manual Triage Feature** - Human expertise adding business context
4. **Analytics Insight** - Visual representation of human+AI collaboration
5. **Responsive Design** - Works across devices
6. **Enterprise Ready** - Full testing, documentation, and architecture

## 🤝 **CONTRIBUTING**

### **Development Workflow**
1. Backend changes in `SIREN.Core` or `SIREN.API`
2. Frontend changes in `siren-dashboard`
3. Run tests for both frontend and backend
4. Update documentation as needed

### **Code Standards**
- C# follows standard .NET conventions
- React components use TypeScript
- CSS follows BEM-like naming
- API follows REST principles

## 📈 **FUTURE ENHANCEMENTS**

- [ ] **Feelix Integration** - Replace placeholder components with actual Feelix library
- [ ] **Real-time Updates** - SignalR integration for live dashboard updates
- [ ] **Advanced Filtering** - Date ranges, multiple category selection
- [ ] **Export Capabilities** - PDF reports and CSV downloads
- [ ] **User Authentication** - Role-based access control
- [ ] **Multiple Data Sources** - Jira, Teams, ServiceNow integration
- [ ] **Machine Learning** - Enhanced categorization with ML models

## 📞 **SUPPORT**

For questions or support:
- **GitHub Issues**: [Create an issue](https://github.com/BLeberSmeaton/siren/issues)
- **Documentation**: Check `Documentation/` folder for detailed guides
- **Tests**: Run the test suite to verify your setup

---

**Built with ❤️ for Innovation Day - Showcasing the power of Human+AI Collaboration in Enterprise Support Management**