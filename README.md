# Support Signal Intelligence Response Engine

**Innovation Week Project**: "Support Signals, Smarter Decisions: Reducing Toil with AI"
aka 'siren' 

## 🎯 Project Overview
Transform scattered support signals into actionable intelligence and toil reduction opportunities through **Human+AI collaboration**. AI handles the heavy lifting of data aggregation and pattern detection, while humans focus on strategic triage and creative problem-solving.

## 🤖 Human+AI Collaboration Model
**AI Amplifies Human Capabilities:**
- **AI Does**: Automated categorization, pattern detection, trend analysis, data processing
- **Humans Do**: Strategic triage, business context, creative solutions, relationship management  
- **Together**: Transform reactive support into proactive improvement intelligence

## 📁 Project Structure

### `/Legacy/`
Original Python-based dashboard system (reference implementation)
- `dashboard.py` - Streamlit dashboard with basic categorization
- `requirements.txt` - Python dependencies

### `/Data/`
All data files organized by processing stage

#### `/Data/Config/`
- `IssueType.csv` - Categorization rules and keywords (shared by both systems)

#### `/Data/Raw/`
- `Jira (ARLive)1.csv` - Original Jira export
- `Jira (ARLive)1_cleaned.csv` - Cleaned data

#### `/Data/Processed/`
- `Jira_ARLive_categorized.csv` - Categorized output from Python system

### `/Source/`
C# Support Signal Intelligence Engine (SIREN) - Complete TDD Foundation
- `SIREN.Core/` - Core domain models and interfaces
- `SIREN.Core.Tests/` - Comprehensive test suite (17 tests)
- `SIREN.Console/` - Demonstration console application
- `SIREN.sln` - Visual Studio solution file

### `/Documentation/`
Project documentation and presentation materials
- Architecture diagrams
- Requirements documentation
- Presentation materials

## ⚡ Getting Started

### Prerequisites
- .NET 9.0 SDK or later
- Command line terminal (PowerShell, bash, etc.)

### Build the Solution
```bash
# Navigate to the Source directory
cd Source

# Restore packages and build the entire solution
dotnet build

# Or build a specific project
dotnet build SIREN.Core/SIREN.Core.csproj
```

### Run Tests
```bash
# Run all tests (from Source directory)
dotnet test

# Run tests with detailed output
dotnet test --verbosity normal

# Run tests for a specific project
dotnet test SIREN.Core.Tests/SIREN.Core.Tests.csproj
```

### Run the Console Application
```bash
# Run the demonstration console app (from Source directory)
dotnet run --project SIREN.Console

# Or navigate to the console project and run
cd SIREN.Console
dotnet run
```

### Expected Output
The console application demonstrates:
- ✅ Loading signals from CSV provider
- ✅ Categorization engine with your business rules
- ✅ Dependency injection working
- ✅ Complete TDD foundation (17 passing tests)

### Quick Verification
```bash
# Verify everything works in one command (from repository root)
cd Source && dotnet test && dotnet run --project SIREN.Console

# Or if already in Source directory:
dotnet test && dotnet run --project SIREN.Console
```

## 🎯 Current Status

### ✅ **Completed - TDD Foundation** 
- Core interfaces: `ISignalProvider`, `ICategorizer` with plugin architecture
- `SupportSignal` domain model with all required properties
- `CategoryEngine` with your complete CSV categorization rules and priority logic
- `CsvSignalProvider` for processing existing Jira exports
- Dependency injection setup with console demonstration
- **17 comprehensive tests** covering all core functionality

### 🔜 **Next Phase - Tomorrow's Development**
- JSON storage implementation for persistence
- Web dashboard UI with real-time feedback
- Jira REST API provider (eliminate manual exports)
- Manual scoring system for human triage
- Demo preparation for Innovation Day

## 🚀 Development Approach

1. **Phase 1**: ✅ CSV Provider (TDD foundation with plugin architecture)
2. **Phase 2**: 🔄 Jira API Provider (eliminate manual exports)
3. **Phase 3**: 📋 Teams Provider (real-time signal aggregation)

## 🏗️ Architecture Highlights

- Plugin-based provider system
- JSON-based storage with database migration path
- Multi-timeframe reporting (weekly, monthly, quarterly, yearly)
- Manual scoring/triage system
- Positive, actionable intelligence generation

## 📊 Business Value - Human+AI Synergy

**🔥 The Problem**: Support teams drowning in manual, repetitive analysis across 8+ disconnected channels

**🤖 AI Solution**: Automated heavy lifting
- Process 1000s of signals in seconds vs. hours of human analysis
- Detect patterns across months of data instantly
- Generate improvement opportunities automatically

**👥 Human Excellence**: Strategic decision-making
- Apply business context AI can't understand
- Make nuanced triage decisions based on relationships
- Create innovative solutions from AI-identified patterns
- Focus on high-value customer relationships

**🚀 Combined Impact**: 
- **70% time savings** on signal analysis (AI automation)
- **40% better prioritization** (human judgment + AI insights)
- **Proactive problem-solving** vs. reactive firefighting

---

**Innovation Day Goal**: Demonstrate how Human+AI collaboration transforms support from cost center to strategic improvement driver.
