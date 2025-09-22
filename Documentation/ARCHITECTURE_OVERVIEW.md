# SIREN Architecture Overview

## 🏗️ **System Architecture**

SIREN implements a **plugin-based architecture** that enables extensible support signal processing through clean interfaces and dependency injection.

### **Core Architecture Principles**

1. **Interface Segregation**: Each component has a single, well-defined responsibility
2. **Dependency Inversion**: High-level modules don't depend on low-level modules
3. **Open/Closed Principle**: System is open for extension, closed for modification
4. **Plugin Pattern**: New data sources can be added without changing existing code

### **Component Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    SIREN System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Data Sources   │    │   Interfaces    │                │
│  │                 │    │                 │                │
│  │ • CSV Files     │───▶│ ISignalProvider │                │
│  │ • Jira API      │    │ ICategorizer    │                │
│  │ • Teams API     │    │                 │                │
│  │ • Future...     │    │                 │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           ▼                       ▼                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Signal Provider │    │ Category Engine │                │
│  │                 │    │                 │                │
│  │ • Data Reading  │    │ • Keyword Match │                │
│  │ • Parsing       │    │ • Priority Rules│                │
│  │ • Normalization │    │ • Classification│                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           └───────┬───────────────┘                        │
│                   ▼                                        │
│         ┌─────────────────┐                                │
│         │ Support Signal  │                                │
│         │                 │                                │
│         │ • Unified Model │                                │
│         │ • Rich Metadata │                                │
│         │ • Categories    │                                │
│         └─────────────────┘                                │
│                   │                                        │
│                   ▼                                        │
│    ┌─────────────────────────────────────┐                 │
│    │          Output Systems             │                 │
│    │                                     │                 │
│    │ • Console Demo                      │                 │
│    │ • Dashboard UI (Tomorrow)           │                 │
│    │ • JSON Storage (Tomorrow)           │                 │
│    │ • Reports & Analytics               │                 │
│    └─────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 **Plugin Architecture Benefits**

### **Extensibility**
- **Add new data sources** by implementing `ISignalProvider`
- **Modify categorization logic** by implementing `ICategorizer`
- **No changes to existing code** when adding new providers

### **Testability**
- **Interface-based design** enables easy mocking
- **17 unit tests** with 100% pass rate
- **Test-driven development** approach throughout

### **Maintainability**
- **Single responsibility** per component
- **Clear boundaries** between concerns
- **Dependency injection** for loose coupling

## 📊 **Current Implementation Status**

### **✅ Completed Components**

| Component | Status | Test Coverage | Description |
|-----------|--------|---------------|-------------|
| `ISignalProvider` | ✅ Complete | 5 tests | Interface for data source plugins |
| `ICategorizer` | ✅ Complete | 4 tests | Interface for categorization logic |
| `SupportSignal` | ✅ Complete | 3 tests | Universal data model |
| `CsvSignalProvider` | ✅ Complete | 5 tests | CSV file data source |
| `CategoryEngine` | ✅ Complete | 4 tests | Keyword-based categorization |
| Dependency Injection | ✅ Complete | - | Service registration & resolution |

### **🔜 Planned Components**

| Component | Priority | Estimated Effort | Description |
|-----------|----------|------------------|-------------|
| `JiraSignalProvider` | High | 2-3 hours | Live Jira API integration |
| `TeamsSignalProvider` | Medium | 2-3 hours | Microsoft Graph API integration |
| JSON Storage Service | High | 1-2 hours | Historical data persistence |
| Dashboard UI | High | 3-4 hours | Web-based interface |
| Manual Scoring System | Medium | 1-2 hours | Human triage capabilities |

## 🧠 **Design Decisions & Rationale**

### **Why Plugin Architecture?**
- **Innovation Day Theme**: Demonstrates enterprise-level thinking
- **Business Need**: Support signals come from multiple, changing sources
- **Technical Benefit**: Easy to extend without breaking existing functionality

### **Why Interfaces Over Concrete Classes?**
- **Testability**: Can mock dependencies for unit testing
- **Flexibility**: Can swap implementations without changing consumers
- **SOLID Principles**: Dependency inversion and interface segregation

### **Why Async/Await Patterns?**
- **Scalability**: Non-blocking I/O for API calls and file operations
- **Future-Proofing**: Real-time providers (Teams, Slack) will benefit
- **Best Practices**: Modern .NET development standards

### **Why Dependency Injection?**
- **Loose Coupling**: Components don't directly instantiate dependencies
- **Configuration**: Easy to change behavior through registration
- **Enterprise Pattern**: Standard approach in professional applications

## 🎯 **Innovation Day Story**

This architecture **directly supports the Human+AI collaboration theme**:

- **AI Heavy Lifting**: Automated signal processing, categorization, pattern detection
- **Human Strategic Value**: Manual triage, business context, creative problem-solving
- **Extensible Foundation**: Ready to integrate new AI services (sentiment analysis, semantic similarity)
- **Enterprise Ready**: Proper patterns for scaling to organization-wide use

The plugin architecture ensures that **adding new AI capabilities or data sources requires minimal changes** to existing, tested code.

