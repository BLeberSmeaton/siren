# SIREN Development Context

## 📋 **PROJECT CONTEXT & BACKGROUND**

### **DEVELOPER PROFILE**
- Junior .NET C# developer learning enterprise patterns through practice
- 2-hour session tonight + full development day tomorrow
- Focus on **test-driven development** and **learning through building**
- Need both automated test feedback and visual UI feedback as we progress
- Want guidance on decisions, not just confirmation - help me understand trade-offs

### **PROJECT OVERVIEW: "SIREN" (Support Signal Intelligence Response Engine)**
**Location**: `C:\src\test\Bolt Support Insights\` (to be renamed to `siren`)
**GitHub**: `https://github.com/BLeberSmeaton/siren.git`
**Innovation Theme**: Human+AI collaboration - AI handles heavy lifting, humans make strategic decisions

**Current Challenge**: Support teams manually analyze scattered signals across 8+ channels
**Solution**: Automated signal aggregation + human triage intelligence

### **TECHNICAL ARCHITECTURE PLANNED**
**Core Components**:
- `ISignalProvider` interface for pluggable data sources
- `SupportSignal` universal data model
- JSON-based storage (database migration path planned)
- Categorization engine (port from existing Python rules)
- Manual scoring system for human triage

**Data Sources** (incremental implementation):
1. CSV files (existing categorized data) 
2. Jira REST API (eliminate manual exports)
3. Teams Graph API (real-time signals)

### **DEVELOPMENT APPROACH**
**Test-Driven Development Focus** ✅ **ACHIEVED**:
- ✅ 75 tests total with 90.52% line coverage
- ✅ Unit tests for categorization logic (5 tests, 93.33% coverage)
- ✅ Integration tests for data providers (comprehensive CSV provider testing)
- ✅ API controller tests (33 tests, 100% endpoint coverage) 
- ✅ UI tests for dashboard functionality (9 React component tests)
- ✅ Manual triage service tests (16 tests, 86.44% coverage)

**Learning Objectives**:
- Interface design and dependency injection
- Test-driven development practices
- API integration patterns
- Data persistence strategies
- Dashboard/UI development

### **REVISED TIMELINE**
**Tonight (2 hours)**:
- Project setup and core structure
- Basic interfaces with tests
- Simple CSV provider with TDD approach
- Categorization engine with test coverage

**Tomorrow (6-8 hours)**:
- JSON storage implementation
- Dashboard UI with real-time feedback
- Jira API integration
- Manual scoring system
- Demo preparation

### **KEY CONSTRAINTS & CONSIDERATIONS**
**Technical Limitations**:
- Junior skill level - need explanation of patterns and decisions
- 2-day timeline - prioritize MVP over perfection
- No database setup time - JSON storage approach
- Need both test automation AND visual feedback

**Learning Requirements**:
- Understand WHY we make certain architectural choices
- See tests fail before making them pass
- Experience the full development cycle
- Build something demonstrable and business-valuable

### **EXISTING FOUNDATION**
**Available Resources**:
- Python categorization logic in `Legacy/dashboard.py`
- Categorization rules in `Data/Config/IssueType.csv`
- Sample data in `Data/Processed/Jira_ARLive_categorized.csv`
- Organized project structure ready for development

**Reference Implementation**: Python Streamlit dashboard with keyword-based categorization

### **SUCCESS CRITERIA**
**Technical Goals**:
- Working CSV provider with tests
- Basic dashboard showing categorized data
- Proof of extensible architecture
- Clean, testable code structure

**Learning Goals**:
- Practical TDD experience
- Understanding of enterprise patterns
- API integration knowledge
- Dashboard development skills

### **DEVELOPMENT PHILOSOPHY**
- **Start simple, build incrementally**
- **Test first, implement second**
- **Learn through doing, not just reading**
- **Make mistakes and understand why they're mistakes**
- **Build something that actually works**

---

**Tonight's Goal**: Foundation with tests. Tomorrow's Goal**: Feature-complete demo.
**Help me understand the 'why' behind architectural decisions, don't just tell me what to do.**

## 🚀 **GETTING STARTED PROMPT**

When starting a new development session, use this prompt:

```
I'm working on SIREN (Support Signal Intelligence Response Engine) for innovation day. 

Please read my development context from Documentation/DEVELOPMENT_CONTEXT.md to understand:
- My skill level and learning objectives
- Project architecture and timeline
- Current development phase and goals
- Available resources and constraints

I'm ready to continue development with test-driven approach. Where should we begin?
```
