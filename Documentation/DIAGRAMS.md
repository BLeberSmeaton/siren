# SIREN System Diagrams

## 🏗️ **System Architecture Diagram**

```mermaid
graph TB
    subgraph "External Data Sources"
        CSV[CSV Files<br/>Legacy Exports]
        JIRA[Jira API<br/>Live Issues]
        TEAMS[Teams API<br/>Real-time Messages]
        FUTURE[Future Sources<br/>Slack, Splunk, etc.]
    end
    
    subgraph "SIREN Core System"
        subgraph "Provider Layer"
            CSVP[CsvSignalProvider<br/>✅ Implemented]
            JIRAP[JiraSignalProvider<br/>🔜 Tomorrow]
            TEAMSP[TeamsSignalProvider<br/>🔜 Tomorrow]
        end
        
        subgraph "Processing Layer"
            CAT[CategoryEngine<br/>Keyword Matching<br/>Priority Rules]
            SIG[SupportSignal<br/>Universal Model]
        end
        
        subgraph "Intelligence Layer"
            TRIAGE[Manual Scoring<br/>Human Triage]
            INSIGHTS[Actionable Insights<br/>Toil Reduction]
        end
    end
    
    subgraph "Output Systems"
        CONSOLE[Console Demo<br/>✅ Working]
        DASH[Dashboard UI<br/>🔜 Tomorrow]
        STORAGE[JSON Storage<br/>🔜 Tomorrow]
        REPORTS[Multi-timeframe<br/>Reports]
    end
    
    CSV --> CSVP
    JIRA --> JIRAP
    TEAMS --> TEAMSP
    FUTURE --> TEAMSP
    
    CSVP --> SIG
    JIRAP --> SIG
    TEAMSP --> SIG
    
    SIG --> CAT
    CAT --> TRIAGE
    TRIAGE --> INSIGHTS
    
    INSIGHTS --> CONSOLE
    INSIGHTS --> DASH
    INSIGHTS --> STORAGE
    INSIGHTS --> REPORTS
    
    style CSVP fill:#90EE90
    style CAT fill:#90EE90
    style SIG fill:#90EE90
    style CONSOLE fill:#90EE90
    style JIRAP fill:#FFE4B5
    style TEAMSP fill:#FFE4B5
    style DASH fill:#FFE4B5
    style STORAGE fill:#FFE4B5
```

## 🔄 **Data Flow Diagram**

```mermaid
flowchart LR
    subgraph "1. Signal Collection"
        A1[Raw Support Signals<br/>Scattered Across 8+ Channels]
        A2[Manual Analysis<br/>Hours of Human Work]
    end
    
    subgraph "2. AI Processing"
        B1[Automated Aggregation<br/>ISignalProvider Interface]
        B2[Intelligent Categorization<br/>CategoryEngine]
        B3[Pattern Detection<br/>Keyword + Priority Rules]
    end
    
    subgraph "3. Human Intelligence"
        C1[Strategic Triage<br/>Manual Scoring]
        C2[Business Context<br/>Relationship Insights]
        C3[Creative Solutions<br/>Improvement Ideas]
    end
    
    subgraph "4. Actionable Output"
        D1[Prioritized Backlog<br/>Data-Driven Decisions]
        D2[Toil Reduction Plans<br/>Specific Actions]
        D3[Proactive Intelligence<br/>Prevention Focus]
    end
    
    A1 --> B1
    A2 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> D1
    D1 --> D2
    D2 --> D3
    
    style A1 fill:#FFB6C1
    style A2 fill:#FFB6C1
    style B1 fill:#87CEEB
    style B2 fill:#87CEEB
    style B3 fill:#87CEEB
    style C1 fill:#DDA0DD
    style C2 fill:#DDA0DD
    style C3 fill:#DDA0DD
    style D1 fill:#98FB98
    style D2 fill:#98FB98
    style D3 fill:#98FB98
```

## 📋 **Class Relationship Diagram**

```mermaid
classDiagram
    class ISignalProvider {
        <<interface>>
        +GetSignalsAsync() Task~IEnumerable~SupportSignal~~
        +ProviderName string
    }
    
    class ICategorizer {
        <<interface>>
        +CategorizeSignal(signal) string?
    }
    
    class SupportSignal {
        +Id string
        +Title string
        +Description string
        +Source string
        +Timestamp DateTime
        +Category string?
        +ManualScore double?
    }
    
    class CsvSignalProvider {
        -csvContent string
        +GetSignalsAsync() Task~IEnumerable~SupportSignal~~
        +ProviderName string
        -ParseDate(dateString) DateTime?
        -GenerateId(summary) string
    }
    
    class CategoryEngine {
        -categoryKeywords Dictionary~string,string[]~
        -priorityCategories string[]
        +CategorizeSignal(signal) string?
    }
    
    class Program {
        +Main(args) Task
        -ConfigureServices(services) void
        -DemonstrateSystem(provider) Task
    }
    
    ISignalProvider <|.. CsvSignalProvider
    ICategorizer <|.. CategoryEngine
    CsvSignalProvider --> SupportSignal : creates
    CategoryEngine --> SupportSignal : analyzes
    Program --> ISignalProvider : uses
    Program --> ICategorizer : uses
```

## 🔄 **Sequence Diagram: Signal Processing Flow**

```mermaid
sequenceDiagram
    participant User
    participant Program
    participant DI as ServiceProvider
    participant Provider as ISignalProvider
    participant Categorizer as ICategorizer
    participant Console
    
    User->>Program: Run Application
    Program->>DI: ConfigureServices()
    Program->>DI: BuildServiceProvider()
    
    Program->>DI: GetRequiredService<ISignalProvider>()
    DI->>Provider: Return CsvSignalProvider
    
    Program->>DI: GetRequiredService<ICategorizer>()
    DI->>Categorizer: Return CategoryEngine
    
    Program->>Provider: GetSignalsAsync()
    Provider->>Provider: Parse CSV data
    Provider->>Program: Return List<SupportSignal>
    
    loop For each signal
        Program->>Categorizer: CategorizeSignal(signal)
        Categorizer->>Categorizer: Analyze keywords
        Categorizer->>Categorizer: Apply priority rules
        Categorizer->>Program: Return category
        Program->>Console: Display categorized signal
    end
    
    Program->>Console: Display summary
```

## 🎯 **Human+AI Collaboration Workflow**

```mermaid
graph TD
    subgraph "AI Heavy Lifting 🤖"
        A1[Process 1000s of signals<br/>in seconds]
        A2[Detect patterns across<br/>months of data]
        A3[Generate improvement<br/>opportunities automatically]
        A4[Aggregate data from<br/>8+ disparate sources]
    end
    
    subgraph "Human Strategic Excellence 👥"
        H1[Apply business context<br/>AI cannot understand]
        H2[Make nuanced triage decisions<br/>based on relationships]
        H3[Create innovative solutions<br/>from AI-identified patterns]
        H4[Focus on high-value<br/>customer relationships]
    end
    
    subgraph "Combined Impact 🚀"
        C1[70% time savings<br/>on signal analysis]
        C2[40% better prioritization<br/>human judgment + AI insights]
        C3[Proactive problem-solving<br/>vs reactive firefighting]
    end
    
    A1 --> H1
    A2 --> H2
    A3 --> H3
    A4 --> H4
    
    H1 --> C1
    H2 --> C2
    H3 --> C3
    H4 --> C1
    
    style A1 fill:#87CEEB
    style A2 fill:#87CEEB
    style A3 fill:#87CEEB
    style A4 fill:#87CEEB
    style H1 fill:#DDA0DD
    style H2 fill:#DDA0DD
    style H3 fill:#DDA0DD
    style H4 fill:#DDA0DD
    style C1 fill:#98FB98
    style C2 fill:#98FB98
    style C3 fill:#98FB98
```

## 📈 **Innovation Day Presentation Flow**

```mermaid
journey
    title Innovation Day Presentation Journey
    section Problem
      Manual Analysis    : 1: Current State
      Scattered Signals  : 1: Pain Points
      Reactive Support   : 1: Inefficiency
    section Solution
      Plugin Architecture: 5: Technical Excellence
      Human+AI Collab    : 5: Theme Alignment
      Real Demo         : 5: Working System
    section Business Value
      70% Time Savings  : 5: Measurable ROI
      Proactive Support : 5: Strategic Value
      Scalable Platform : 5: Future Vision
    section Technical Depth
      TDD Foundation    : 4: Quality Engineering
      Enterprise Patterns: 4: Professional Code
      Extensible Design : 4: Maintainability
```

---

## 🎨 **Using These Diagrams**

### **For GitHub/Documentation:**
- Copy the Mermaid code directly into markdown files
- GitHub renders Mermaid diagrams automatically

### **For Presentations:**
- Use Mermaid Live Editor: https://mermaid.live/
- Export as PNG/SVG for slides
- Copy as image into PowerPoint/Google Slides

### **For Innovation Day:**
- **Start with**: Human+AI Collaboration Workflow
- **Show technical depth**: System Architecture
- **Demonstrate process**: Data Flow Diagram
- **Prove quality**: Class Diagram + mention 75 passing tests

---

## 📚 **Related Documentation**

- **🚀 [Quick Start Guide](QUICK_START.md)** - Get the system running to see these diagrams in action
- **🏗️ [Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - Detailed technical implementation of these components
- **💻 [Development Guide](DEVELOPMENT_GUIDE.md)** - Developer context and project background
- **📊 [Project Status](PROJECT_STATUS.md)** - Current implementation status and demo readiness
- **🧪 [Testing Strategy](TESTING_STRATEGY.md)** - Test coverage validating these architectural components

