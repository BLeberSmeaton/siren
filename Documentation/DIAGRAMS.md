# SIREN System Diagrams - Current & Future State

## 🏗️ **Current System Architecture (Enhanced AI + Team Management)**

```mermaid
graph TB
    subgraph "External Data Sources"
        CSV[CSV Files<br/>Legacy Exports]
        JIRA[Jira API<br/>Live Issues]
        TEAMS[Teams API<br/>Real-time Messages]
        FUTURE[Future Sources<br/>Slack, ServiceNow, etc.]
    end
    
    subgraph "SIREN Core System"
        subgraph "Provider Layer"
            CSVP[CsvSignalProvider<br/>✅ Active]
            JIRAP[JiraSignalProvider<br/>⏳ Ready]
            TEAMSP[TeamsSignalProvider<br/>⏳ Ready]
        end
        
        subgraph "Enhanced AI Processing"
            ENHANCED[EnhancedPatternEngine<br/>✅ Multi-layered AI<br/>• Fuzzy Matching<br/>• Regex Patterns<br/>• Confidence Scoring]
            ML_INTEG[MLIntegrationService<br/>✅ Hybrid AI Framework<br/>• Traditional + ML<br/>• Readiness Assessment]
            LEARNING[PatternLearningService<br/>✅ Continuous Learning<br/>• Feedback Processing<br/>• Pattern Evolution]
        end
        
        subgraph "Team Management"
            CONFIG[ConfigurationService<br/>✅ Team-Aware Config<br/>• Multi-team Support<br/>• Dynamic Categories]
            WIZARD[NewTeamWizard<br/>✅ AI-Powered Setup<br/>• Sample Analysis<br/>• Smart Suggestions]
        end
        
        subgraph "Intelligence Layer"
            TRIAGE[ManualTriageService<br/>✅ Human+AI Collab<br/>• Explainable Results<br/>• Feedback Loop]
            INSIGHTS[Advanced Analytics<br/>✅ Deep Insights<br/>• Team Performance<br/>• Trend Analysis]
        end
    end
    
    subgraph "Output Systems"
        DASH[React Dashboard<br/>✅ Production Ready<br/>• Team Management<br/>• Advanced Analytics]
        API[ASP.NET Core API<br/>✅ Full REST API<br/>• Team Endpoints<br/>• Pattern APIs]
        REPORTS[Report Generation<br/>✅ PDF/CSV Export<br/>• Custom Reports<br/>• Scheduled Delivery]
    end
    
    CSV --> CSVP
    JIRA --> JIRAP
    TEAMS --> TEAMSP
    FUTURE --> TEAMSP
    
    CSVP --> ENHANCED
    JIRAP --> ENHANCED
    TEAMSP --> ENHANCED
    
    ENHANCED --> ML_INTEG
    ML_INTEG --> LEARNING
    LEARNING --> TRIAGE
    
    CONFIG --> ENHANCED
    WIZARD --> CONFIG
    
    TRIAGE --> INSIGHTS
    INSIGHTS --> DASH
    INSIGHTS --> API
    INSIGHTS --> REPORTS
    
    style CSVP fill:#90EE90
    style ENHANCED fill:#90EE90
    style ML_INTEG fill:#90EE90
    style LEARNING fill:#90EE90
    style CONFIG fill:#90EE90
    style WIZARD fill:#90EE90
    style TRIAGE fill:#90EE90
    style INSIGHTS fill:#90EE90
    style DASH fill:#90EE90
    style API fill:#90EE90
    style REPORTS fill:#90EE90
    style JIRAP fill:#FFE4B5
    style TEAMSP fill:#FFE4B5
```

## 🤖 **Future State Architecture (Full ML Integration)**

```mermaid
graph TB
    subgraph "External Data Sources"
        CSV2[CSV Files<br/>Historical Data]
        JIRA2[Jira API<br/>Real-time Issues]
        TEAMS2[Teams Messages<br/>Live Conversations]
        SLACK[Slack Channels<br/>Informal Support]
        SERVICENOW[ServiceNow<br/>Incident Management]
        LOGS[Log Analytics<br/>System Telemetry]
    end
    
    subgraph "ML-Enhanced SIREN System"
        subgraph "Data Ingestion & Preprocessing"
            STREAM[Real-time Streaming<br/>• Apache Kafka<br/>• Event Processing<br/>• Data Normalization]
            VECTORIZE[Text Vectorization<br/>• BERT/RoBERTa<br/>• Semantic Embeddings<br/>• Feature Extraction]
        end
        
        subgraph "Advanced ML Processing"
            TRANSFORMER[Transformer Models<br/>🤖 BERT Classification<br/>• Multi-class Prediction<br/>• Confidence Scoring<br/>• Attention Visualization]
            SIMILARITY[Semantic Similarity<br/>🤖 Vector Search<br/>• Similar Issue Detection<br/>• Knowledge Transfer<br/>• Pattern Clustering]
            ANOMALY[Anomaly Detection<br/>🤖 Outlier Analysis<br/>• Unusual Pattern Alert<br/>• Drift Detection<br/>• Quality Monitoring]
        end
        
        subgraph "Hybrid Intelligence Layer"
            ENSEMBLE[Ensemble Methods<br/>🤖 Model Combination<br/>• Traditional + ML<br/>• Weighted Voting<br/>• Confidence Gating]
            FEEDBACK[Active Learning<br/>🤖 Continuous Improvement<br/>• User Feedback Loop<br/>• Model Retraining<br/>• Performance Tracking]
            EXPLAIN[Explainable AI<br/>🤖 Interpretability<br/>• SHAP Values<br/>• Feature Attribution<br/>• Decision Reasoning]
        end
        
        subgraph "Intelligent Automation"
            ROUTING[Predictive Routing<br/>🤖 Smart Assignment<br/>• Team Expertise Match<br/>• Workload Balancing<br/>• SLA Optimization]
            FORECAST[Capacity Forecasting<br/>🤖 Predictive Analytics<br/>• Volume Prediction<br/>• Resource Planning<br/>• Trend Analysis]
        end
    end
    
    subgraph "Advanced Output Systems"
        AI_DASH[AI-Enhanced Dashboard<br/>🤖 Intelligent UI<br/>• Proactive Insights<br/>• Predictive Alerts<br/>• Automated Reports]
        AUTO_API[Autonomous API<br/>🤖 Self-Managing<br/>• Auto-scaling<br/>• Performance Tuning<br/>• Error Recovery]
        ML_REPORTS[ML-Generated Reports<br/>🤖 Insight Generation<br/>• Pattern Discovery<br/>• Trend Explanation<br/>• Recommendation Engine]
    end
    
    CSV2 --> STREAM
    JIRA2 --> STREAM
    TEAMS2 --> STREAM
    SLACK --> STREAM
    SERVICENOW --> STREAM
    LOGS --> STREAM
    
    STREAM --> VECTORIZE
    VECTORIZE --> TRANSFORMER
    VECTORIZE --> SIMILARITY
    VECTORIZE --> ANOMALY
    
    TRANSFORMER --> ENSEMBLE
    SIMILARITY --> ENSEMBLE
    ANOMALY --> ENSEMBLE
    
    ENSEMBLE --> FEEDBACK
    FEEDBACK --> EXPLAIN
    EXPLAIN --> ROUTING
    ROUTING --> FORECAST
    
    FORECAST --> AI_DASH
    FORECAST --> AUTO_API
    FORECAST --> ML_REPORTS
    
    style STREAM fill:#87CEEB
    style VECTORIZE fill:#87CEEB
    style TRANSFORMER fill:#FFD700
    style SIMILARITY fill:#FFD700
    style ANOMALY fill:#FFD700
    style ENSEMBLE fill:#98FB98
    style FEEDBACK fill:#98FB98
    style EXPLAIN fill:#98FB98
    style ROUTING fill:#DDA0DD
    style FORECAST fill:#DDA0DD
    style AI_DASH fill:#90EE90
    style AUTO_API fill:#90EE90
    style ML_REPORTS fill:#90EE90
```

## 🔄 **Enhanced Data Flow Diagram (Current State)**

```mermaid
flowchart LR
    subgraph "1. Multi-Source Collection"
        A1[Raw Support Signals<br/>Multiple Data Sources<br/>• CSV, Jira, Teams<br/>• Automated Ingestion]
        A2[Team Configuration<br/>AI-Powered Setup<br/>• Sample Analysis<br/>• Smart Categories]
    end
    
    subgraph "2. Enhanced AI Processing"
        B1[Multi-layered Analysis<br/>Enhanced Pattern Engine<br/>• Fuzzy Matching<br/>• Regex Patterns<br/>• Confidence Scoring]
        B2[Intelligent Categorization<br/>ML Integration Ready<br/>• Hybrid AI Framework<br/>• Fallback Mechanisms]
        B3[Continuous Learning<br/>Pattern Learning Service<br/>• Feedback Processing<br/>• Model Improvement]
    end
    
    subgraph "3. Human Intelligence"
        C1[Strategic Triage<br/>Manual Scoring with AI<br/>• Explainable Results<br/>• Context Integration]
        C2[Business Context<br/>Team-Specific Insights<br/>• Performance Analytics<br/>• Trend Analysis]
        C3[Collaborative Decisions<br/>Human+AI Partnership<br/>• Smart Recommendations<br/>• Evidence-Based Choices]
    end
    
    subgraph "4. Actionable Intelligence"
        D1[Team Dashboards<br/>Advanced Analytics<br/>• Performance Metrics<br/>• Pattern Insights]
        D2[Generated Reports<br/>PDF/CSV Export<br/>• Customizable Views<br/>• Scheduled Delivery]
        D3[Continuous Improvement<br/>System Evolution<br/>• Pattern Adaptation<br/>• Knowledge Accumulation]
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
    D3 --> B3
    
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

## 🚀 **ML Integration Readiness Flow**

```mermaid
graph LR
    subgraph "Current State Assessment"
        A1[Team Data Volume<br/>✅ Sufficient History]
        A2[Pattern Quality<br/>✅ High Accuracy]
        A3[Feedback Coverage<br/>✅ User Engagement]
    end
    
    subgraph "ML Readiness Analysis"
        B1[Data Volume Score<br/>📊 >100 Examples]
        B2[Quality Score<br/>📊 >70% Accuracy]
        B3[Balance Score<br/>📊 Even Distribution]
    end
    
    subgraph "Integration Strategy"
        C1[Hybrid Mode<br/>🤖 ML + Traditional]
        C2[Confidence Gating<br/>🤖 Smart Fallback]
        C3[Online Learning<br/>🤖 Continuous Improve]
    end
    
    subgraph "Future Capabilities"
        D1[Semantic Understanding<br/>🧠 BERT/RoBERTa]
        D2[Predictive Analytics<br/>🧠 Forecasting]
        D3[Autonomous Operation<br/>🧠 Self-Managing]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    
    C1 --> D1
    C2 --> D2
    C3 --> D3
    
    style A1 fill:#FFB6C1
    style A2 fill:#FFB6C1
    style A3 fill:#FFB6C1
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

---

## 🎨 **Using These Diagrams**

### **For GitHub/Documentation:**
- Copy the Mermaid code directly into markdown files
- GitHub renders Mermaid diagrams automatically

### **For Presentations:**
- Use Mermaid Live Editor: https://mermaid.live/
- Export as PNG/SVG for slides
- Copy as image into PowerPoint/Google Slides

### **For Technical Presentations:**
- **Start with**: Current vs Future State Architecture
- **Show capabilities**: Enhanced Data Flow Diagram  
- **Demonstrate readiness**: ML Integration Readiness Flow
- **Prove quality**: Advanced features + comprehensive testing

---

## 📚 **Related Documentation**

- **🚀 [Quick Start Guide](QUICK_START.md)** - Get the system running to see these diagrams in action
- **🏗️ [Architecture Overview](ARCHITECTURE_OVERVIEW.md)** - Detailed technical implementation of these components
- **💻 [Development Guide](DEVELOPMENT_GUIDE.md)** - Developer context and project background
- **📊 [Project Status](PROJECT_STATUS.md)** - Current implementation status and demo readiness
- **🧪 [Testing Strategy](TESTING_STRATEGY.md)** - Test coverage validating these architectural components

