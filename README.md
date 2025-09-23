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
│ ✅ 75 Tests (90.52% Coverage) • CSV • Category • API        │
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

## 🧪 **COMPREHENSIVE TESTING** 

### **🎯 Test Coverage Overview**

| **Test Project** | **Tests** | **Coverage** | **Focus Area** |
|------------------|-----------|--------------|----------------|
| **SIREN.Core.Tests** | **33 tests** | **90.52% line**, **70.27% branch** | Business logic & services |
| **SIREN.API.Tests** | **33 tests** | **100% endpoints** | REST API controllers |
| **siren-dashboard** | **9 tests** | **Components & integration** | React UI & API calls |
| **🎯 TOTAL** | **✅ 75 TESTS** | **Enterprise-grade coverage** | Full-stack testing |

### **Backend Tests (Enhanced)**
```bash
# Run all backend tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test projects
dotnet test SIREN.Core.Tests        # 33 tests - Core business logic
dotnet test SIREN.API.Tests         # 33 tests - API controllers

# All 66 backend tests pass with excellent coverage! ✅
```

### **Frontend Tests**
```bash
cd siren-dashboard

# Run React component tests (9 tests)
npm test

# Run with coverage (limited by Create React App)
npm test -- --coverage --watchAll=false

# Tests cover Dashboard, API integration, and UI components ✅
```

### **🔍 Test Coverage Highlights**
- **ManualTriageService**: 86.44% coverage (16 comprehensive tests)
- **CategoryEngine**: 93.33% coverage with edge case handling
- **API Controllers**: 100% endpoint coverage with error scenarios
- **React Components**: Integration and rendering tests
- **Thread Safety**: Concurrent operation testing

## 📁 **PROJECT STRUCTURE**

```
Source/
├── SIREN.Core/                    # 🏗️ Domain Logic (Existing)
│   ├── Interfaces/               # Plugin contracts + IManualTriageService
│   ├── Models/                   # Domain models  
│   ├── Providers/               # Data sources (CSV)
│   └── Services/                # Business logic + ManualTriageService
├── SIREN.Core.Tests/             # ✅ Core Test Suite (33 tests)
│   ├── Interfaces/              # Interface compliance tests
│   ├── Models/                  # Model validation tests
│   ├── Providers/               # Data provider tests
│   └── Services/                # Service logic tests (16 ManualTriage tests)
├── SIREN.API/                    # 🌐 Web API (New)
│   ├── Controllers/             # REST endpoints
│   │   ├── SignalsController.cs    # Signal operations + manual triage
│   │   └── CategoriesController.cs # Category stats + manual categorization
│   └── Program.cs               # API configuration + DI setup
├── SIREN.API.Tests/              # ✅ API Test Suite (33 tests)
│   └── Controllers/             # Controller integration tests
│       ├── SignalsControllerTests.cs    # 21 comprehensive tests
│       └── CategoriesControllerTests.cs # 12 comprehensive tests
├── SIREN.Console/               # 🖥️ CLI Demo (Existing)
└── siren-dashboard/             # ⚛️ React Frontend (New)
    ├── src/
    │   ├── components/          # React components
    │   │   ├── SignalTable.tsx      # Signal list view
    │   │   ├── TriagePanel.tsx      # Manual triage UI (**Innovation**)
    │   │   └── DashboardSummary.tsx # Analytics charts
    │   ├── pages/               # Page components
    │   ├── services/            # API integration with caching
    │   ├── types/              # TypeScript definitions  
    │   └── __tests__/          # Component tests (9 tests)
    └── package.json            # Dependencies + Jest config
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

### **Testing (Enterprise-Grade)**
- **xUnit + Moq** - 66 comprehensive backend tests (90.52% coverage)
- **Jest + React Testing Library** - 9 frontend component tests
- **Integration Testing** - Full API controller test coverage
- **Thread Safety Testing** - Concurrent operation validation
- **Code Coverage** - XPlat Code Coverage collection with reports

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

## 📞 **SUPPORT & DOCUMENTATION**

### **📚 Quick Access Documentation**
- **🚀 [Quick Start Guide](Documentation/QUICK_START.md)** - Get running in 2 minutes
- **📊 [Project Status](Documentation/PROJECT_STATUS.md)** - Current status and demo readiness
- **🏗️ [Architecture Overview](Documentation/ARCHITECTURE_OVERVIEW.md)** - Complete technical details
- **💻 [Development Guide](Documentation/DEVELOPMENT_GUIDE.md)** - Developer context and setup
- **🧪 [Testing Strategy](Documentation/TESTING_STRATEGY.md)** - Test coverage and quality metrics
- **📊 [System Diagrams](Documentation/DIAGRAMS.md)** - Visual architecture and flow diagrams

### **Getting Help**
- **GitHub Issues**: [Create an issue](https://github.com/BLeberSmeaton/siren/issues)
- **Tests**: Run the test suite to verify your setup
- **API Docs**: Visit `http://localhost:5135/swagger` when running

---

**Built with ❤️ for Innovation Day - Showcasing the power of Human+AI Collaboration in Enterprise Support Management**