# 🚀 SIREN Development Guide

## 📋 **Project Context & Background**

### **Developer Profile**
- Junior .NET C# developer learning enterprise patterns through practice
- Focus on **test-driven development** and **learning through building**
- Need both automated test feedback and visual UI feedback as we progress
- Want guidance on decisions, not just confirmation - help me understand trade-offs

### **Project Overview: "SIREN" (Support Signal Intelligence Response Engine)**
**Location**: `C:\src\test\Bolt Support Insights\`
**GitHub**: `https://github.com/BLeberSmeaton/siren.git`
**Innovation Theme**: Human+AI collaboration - AI handles heavy lifting, humans make strategic decisions

**Current Challenge**: Support teams manually analyze scattered signals across 8+ channels
**Solution**: Automated signal aggregation + human triage intelligence

---

## 🏗️ **Technical Architecture**

### **Core Components**
- `ISignalProvider` interface for pluggable data sources
- `SupportSignal` universal data model
- JSON-based storage (database migration path planned)
- Categorization engine (port from existing Python rules)
- Manual scoring system for human triage

### **Data Sources** (incremental implementation)
1. **CSV files** (existing categorized data) ✅
2. **Jira REST API** (eliminate manual exports) ✅
3. **Teams Graph API** (real-time signals) *planned*

### **COMPLETED CODEBASE STRUCTURE** ✅
```
Source/
├── SIREN.Core/                    # Domain logic (WORKING ✅)
│   ├── Interfaces/
│   │   ├── ISignalProvider.cs     # Plugin interface
│   │   └── ICategorizer.cs        # Categorization interface
│   ├── Models/
│   │   └── SupportSignal.cs       # Universal data model
│   ├── Providers/
│   │   └── CsvSignalProvider.cs   # CSV data source
│   └── Services/
│       └── CategoryEngine.cs      # Keyword categorization
├── SIREN.Core.Tests/              # Comprehensive test suite (33 tests ✅)
├── SIREN.Console/                 # Working demo application
├── SIREN.API/                     # ASP.NET Core Web API (NEW ✅)
│   ├── Controllers/
│   │   ├── SignalsController.cs       # Signals REST API
│   │   └── CategoriesController.cs    # Categories REST API
│   └── Program.cs                 # API configuration & DI setup
└── siren-dashboard/               # React Frontend (NEW ✅)
    ├── src/
    │   ├── components/           # React components
    │   │   ├── SignalTable.tsx       # Signal list with filtering
    │   │   ├── TriagePanel.tsx       # Manual triage interface ⭐
    │   │   └── DashboardSummary.tsx  # Analytics dashboard
    │   ├── pages/
    │   │   └── Dashboard.tsx         # Main dashboard page
    │   ├── services/
    │   │   └── api.ts               # HTTP client for API calls
    │   ├── types/
    │   │   └── index.ts             # TypeScript definitions
    │   └── __tests__/              # React Testing Library tests
    └── package.json              # Dependencies & scripts
```

---

## 🎯 **Dashboard UI Requirements**

### **PRIMARY GOALS** ✅ **ALL COMPLETED**
1. ✅ **Visual Interface** for support signal triage and analysis
2. ✅ **Real-time Feedback** showing categorization results
3. ✅ **Human Triage Capability** - manual scoring and priority adjustment
4. ✅ **Analytics View** - category breakdowns, trends, patterns
5. ✅ **Innovation Day Demo** - impressive, professional interface

### **User Personas & Needs**

**👨‍💻 Support Engineers** (Daily users):
- Quick signal overview and filtering
- Real-time categorization results
- Manual scoring interface
- Issue details and context

**👩‍💼 Engineering Managers** (Weekly users):
- Category breakdown analytics
- Team workload insights
- Trend analysis over time
- Export capabilities

**💼 Leadership** (Monthly users):
- High-level metrics and summaries
- ROI demonstration
- Strategic pattern insights

---

## 🏗️ **Technical Implementation**

### **CHOSEN STACK** ✅ **COMPLETED IMPLEMENTATION**
**React + Feelix Design System + ASP.NET Core Web API** (Implemented):
- ✅ **Modern SPA Architecture** - React with TypeScript for type safety
- ✅ **Professional UI** - Feelix-inspired design system with custom CSS
- ✅ **RESTful API** - ASP.NET Core Web API exposing existing services
- ✅ **Comprehensive Testing** - Jest + React Testing Library + existing xUnit tests
- ✅ **Scalable Architecture** - Component-based frontend, service-oriented backend

### **INTEGRATION WITH EXISTING CODE**
```csharp
// Your existing services work perfectly with web apps
public class SignalsController : ControllerBase
{
    private readonly ISignalProvider _signalProvider;
    private readonly ICategorizer _categorizer;
    
    public SignalsController(ISignalProvider signalProvider, ICategorizer categorizer)
    {
        _signalProvider = signalProvider;    // Already implemented!
        _categorizer = categorizer;          // Already working!
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SupportSignal>>> GetSignals()
    {
        var signals = await _signalProvider.GetSignalsAsync();
        var categorizedSignals = signals.Select(s => {
            s.Category ??= _categorizer.CategorizeSignal(s);
            return s;
        });
        
        return Ok(categorizedSignals);
    }
}
```

---

## 📊 **Dashboard Layout Design**

### **Main Dashboard Layout**
```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 SIREN - Support Signal Intelligence    [Settings] [Help] │
├─────────────────────────────────────────────────────────────┤
│ [Analytics] [Signals] [Triage] [Reports]                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │📊 Total     │ │🚩 Flagged   │ │✅ Resolved  │ │🏷️ Cats  │ │
│ │   47        │ │    12       │ │    35       │ │   8     │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📋 Signal List                            [Filter ▼]   │ │
│ │ ┌─ Certificate Expiry Issue            [Score: 🔴 H] ─┐ │
│ │ │  Auto: Certificate | Manual: High Priority         │ │
│ │ │  Last updated: 2 hours ago                         │ │
│ │ └─ [View Details] [Edit Score] [Mark Resolved] ──────┘ │
│ │ ┌─ API Rate Limiting Error             [Score: 🟡 M] ─┐ │
│ │ │  Auto: API | Manual: Medium Priority               │ │
│ │ │  Last updated: 4 hours ago                         │ │
│ │ └─ [View Details] [Edit Score] [Mark Resolved] ──────┘ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Manual Triage Interface** (Innovation Day Highlight)
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Manual Triage: Certificate Expiry Issue                 │
├─────────────────────────────────────────────────────────────┤
│ AI Analysis: "Certificate" (95% confidence)                │
│                                                             │
│ Human Assessment:                                           │
│ Severity:     ○ Low  ●● High  ○ Critical                   │ 
│ Impact:       ○ Single User  ●● Team  ○ All Customers      │
│ Business:     ○ Low  ●● High  ○ Strategic                  │
│                                                             │
│ Notes: [Affects major client relationship - high priority] │
│                                                             │
│ [💾 Save Scoring] [❌ Reset] [✅ Mark Resolved]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 **Learning Objectives**

### **Web Development Patterns**:
- **Component architecture** - React component composition
- **TypeScript integration** - Type safety in frontend development
- **API design** - RESTful service patterns
- **State management** - React hooks and context
- **Testing strategies** - Unit, integration, and component testing

### **UI/UX Concepts**:
- **Information hierarchy** - most important data prominent
- **User workflow** - logical flow between views
- **Visual feedback** - loading states, success messages
- **Accessibility** - proper HTML semantics and ARIA labels
- **Responsive design** - mobile-first approach

### **Integration Patterns**:
- **Service layer integration** - web app using domain services
- **Model transformation** - domain models to DTOs
- **Error handling** - graceful degradation in UI
- **Testing web apps** - controller testing, integration testing

---

## 🎯 **Success Criteria** ✅ **ALL ACHIEVED**

### **Minimum Viable Dashboard** ✅ **COMPLETED**:
- ✅ **Working signal list** showing categorized data
- ✅ **Manual scoring interface** for human triage
- ✅ **Category filtering** and basic search
- ✅ **Professional styling** using Feelix-inspired design
- ✅ **Responsive design** works on mobile/desktop

### **Innovation Day Ready** ✅ **COMPLETED**:
- ✅ **Live demo capability** - can show real categorization
- ✅ **Manual override demonstration** - human+AI collaboration
- ✅ **Visual impact** - professional, polished interface
- ✅ **Business story** - clear value proposition in UI

### **Stretch Goals** ✅ **COMPLETED**:
- ✅ **Advanced analytics** with charts/graphs (Recharts integration)
- ✅ **Export-ready data** via comprehensive REST API
- ✅ **Comprehensive testing** with React Testing Library
- ✅ **Professional architecture** ready for enterprise deployment

---

## 🔧 **Development Workflow**

### **Getting Started Prompt**
When starting a new development session, use this context:

```
I'm working on SIREN (Support Signal Intelligence Response Engine) for innovation day. 

I'm a junior .NET developer focused on:
- Test-driven development practices
- Learning enterprise patterns through building
- Human+AI collaboration theme
- Creating both automated tests and visual feedback

Current status: Dashboard complete and demo-ready
Ready to continue development or make enhancements. Where should we focus?
```

### **Key References**:
- **Categorization Rules**: `/Data/Config/IssueType.csv`
- **Sample Data**: `/Data/Processed/Jira_ARLive_categorized.csv`
- **Legacy Logic**: `/Legacy/dashboard.py` (for reference)

---

## 🚀 **Development Philosophy**

- **Start simple, build incrementally**
- **Test first, implement second**
- **Learn through doing, not just reading**
- **Make mistakes and understand why they're mistakes**
- **Build something that actually works**
- **Focus on user experience and business value**

**Current Status**: **FULLY IMPLEMENTED AND READY FOR DEMO** ✅

The foundation is **enterprise-grade** with comprehensive testing, modern architecture, and professional UI. The manual triage feature showcases perfect Human+AI collaboration for Innovation Day presentations.

---

## 💡 **KEY INTEGRATION POINTS**

### **Existing Services to Use**:
- **`ISignalProvider`** - Already provides data
- **`ICategorizer`** - Already working categorization
- **`SupportSignal`** - Perfect data model for views
- **Dependency Injection** - Already configured

### **Extensions Available**:
- **`ManualTriageService`** - Human triage data persistence
- **REST API Controllers** - Full CRUD operations
- **React Components** - Professional UI components
- **Testing Infrastructure** - Comprehensive test coverage

Your **foundation is solid** - the system integrates seamlessly with tested, proven services! 🚀

---

## 📚 **Related Documentation**

- **🚀 [Quick Start Guide](QUICK_START.md)** - Get running quickly (2-minute startup)
- **🏗️ [Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - Technical architecture and implementation details
- **📊 [Project Status](PROJECT_STATUS.md)** - Current status and demo readiness
- **🧪 [Testing Strategy](TESTING_STRATEGY.md)** - Comprehensive test coverage details
- **📊 [System Diagrams](DIAGRAMS.md)** - Visual architecture and data flow diagrams
