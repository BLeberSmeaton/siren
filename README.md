# 🚨 SIREN - Support Signal Intelligence Response Engine

**An advanced AI-powered platform for intelligent support signal categorization, combining human expertise with machine intelligence for optimal support management.**

## 📋 **PROJECT OVERVIEW**

SIREN transforms chaotic support signals from multiple sources into organized, prioritized actionable insights. The platform combines advanced AI pattern recognition with human expertise, perfectly demonstrating the Innovation Day theme of "Human and Machine - Empowering teams using AI in conjunction with people."

### **🎯 Key Features**
- **AI-Powered Categorization**: Automatically categorize signals from multiple sources
- **Human+AI Collaboration**: Manual triage interface for strategic decision-making  
- **Real-time Dashboard**: Professional React interface with advanced analytics
- **Enterprise Ready**: Comprehensive testing, scalable architecture, and full documentation
- **Multiple Data Sources**: CSV files, Jira API integration, Teams integration ready

## 🏗️ **SYSTEM ARCHITECTURE**

```
┌─────────────────────────────────────────────────────┐
│ React Dashboard (TypeScript)    Port 3000          │
│ • Signal Table with filtering                      │
│ • Manual Triage Interface (Human+AI)               │  
│ • Real-time Analytics Dashboard                     │
└─────────────────────────────────────────────────────┘
                          ↕ HTTP API
┌─────────────────────────────────────────────────────┐
│ ASP.NET Core Web API            Port 5135          │
│ • Signals Management (CRUD + Triage)               │
│ • Categories & Statistics                           │
│ • OpenAPI/Swagger Documentation                     │
└─────────────────────────────────────────────────────┘
                          ↕ Service Layer
┌─────────────────────────────────────────────────────┐
│ SIREN.Core Business Logic                          │
│ • Enhanced Pattern Recognition Engine               │
│ • Manual Triage Service (Human+AI)                 │
│ • Multi-source Data Providers                      │
│ • 75 Tests • 90%+ Coverage                         │
└─────────────────────────────────────────────────────┘
```

> 📖 **Detailed Architecture**: See [ARCHITECTURE_OVERVIEW.md](Documentation/ARCHITECTURE_OVERVIEW.md) for comprehensive technical details

## 🚀 **QUICK START**

```bash
# Terminal 1: Start API
cd "Source"
dotnet run --project SIREN.API

# Terminal 2: Start Dashboard  
cd "Source/siren-dashboard"
npm start
```

**Result**: Dashboard opens at http://localhost:3000 with full functionality

> 📖 **Detailed Setup**: See [QUICK_START.md](Documentation/QUICK_START.md) for complete instructions and troubleshooting

## ✨ **KEY FEATURES**

### **🤖➕👥 Human+AI Collaboration**
- **AI Categorization**: Automatic signal classification with confidence scoring
- **Manual Triage**: Human experts add business context and priority
- **Strategic Override**: Manual category adjustments when needed
- **Collaborative Intelligence**: Best of both AI efficiency and human insight

### **📊 Professional Dashboard**
- **Real-time Analytics**: Visual charts showing category distribution
- **Signal Management**: Sortable, filterable signal table
- **Responsive Design**: Works across all devices
- **Enterprise UI**: Feelix-inspired professional design

## 🧪 **QUALITY ASSURANCE**

- **75 Tests** across frontend and backend
- **90%+ Code Coverage** on critical business logic
- **100% API Coverage** with error scenarios
- **Thread Safety** validation for concurrent operations

> 📖 **Testing Details**: See [TESTING_STRATEGY.md](Documentation/TESTING_STRATEGY.md) for comprehensive coverage metrics

## 🛠️ **TECHNOLOGY STACK**

- **Frontend**: React 19 + TypeScript + Feelix Design System
- **Backend**: ASP.NET Core 9.0 Web API  
- **Core Logic**: C# with plugin architecture
- **Testing**: xUnit + Jest + React Testing Library
- **Analytics**: Recharts for data visualization

## 🎉 **INNOVATION DAY DEMO**

**Perfect Human+AI Collaboration Showcase:**

1. **🎯 Live Dashboard** - Professional interface with real-time data
2. **🤖 AI in Action** - Watch automatic signal categorization  
3. **👥 Human Expertise** - Manual triage adding business context
4. **📊 Collaborative Intelligence** - Visual analytics showing combined value
5. **🏗️ Enterprise Quality** - Modern architecture with comprehensive testing

## 🔄 **CURRENT STATUS**

✅ **Ready for Innovation Day Demo** - All features implemented and tested  
✅ **Enterprise Architecture** - Scalable, maintainable, well-documented  
✅ **Human+AI Integration** - Perfect demonstration of collaborative intelligence  
✅ **Professional Quality** - 75 tests, 90%+ coverage, modern tech stack

## 📚 **DOCUMENTATION**

| Document | Purpose |
|----------|---------|
| **[🚀 QUICK_START.md](Documentation/QUICK_START.md)** | Get running in 2 minutes |
| **[🏗️ ARCHITECTURE_OVERVIEW.md](Documentation/ARCHITECTURE_OVERVIEW.md)** | Technical architecture & implementation |
| **[🧪 TESTING_STRATEGY.md](Documentation/TESTING_STRATEGY.md)** | Quality assurance & coverage metrics |
| **[📊 DIAGRAMS.md](Documentation/DIAGRAMS.md)** | Visual system architecture |
| **[📊 PROJECT_STATUS.md](Documentation/PROJECT_STATUS.md)** | Current implementation status |

### **Quick Help**
- **API Documentation**: http://localhost:5135/swagger (when running)
- **Test Everything**: `dotnet test && cd siren-dashboard && npm test`
- **Issues**: All 75 tests should pass ✅

---

**🚀 Built for Innovation Day - Demonstrating Human+AI Collaboration in Enterprise Support**