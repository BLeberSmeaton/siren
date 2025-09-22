# Support Signal Intelligence Engine

**Innovation Week Project**: "Support Signals, Smarter Decisions: Reducing Toil with AI"

## 🎯 Project Overview
Transform scattered support signals into actionable intelligence and toil reduction opportunities through AI-powered aggregation and analysis.

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
New C# Support Signal Intelligence Engine (to be created)
- Will contain the .NET solution with plugin architecture

### `/Documentation/`
Project documentation and presentation materials
- Architecture diagrams
- Requirements documentation
- Presentation materials

## 🚀 Development Approach

1. **Phase 1**: CSV Provider (port Python logic to C# plugin architecture)
2. **Phase 2**: Jira API Provider (eliminate manual exports)
3. **Phase 3**: Teams Provider (real-time signal aggregation)

## 🏗️ Architecture Highlights

- Plugin-based provider system
- JSON-based storage with database migration path
- Multi-timeframe reporting (weekly, monthly, quarterly, yearly)
- Manual scoring/triage system
- Positive, actionable intelligence generation

## 📊 Business Value

Transform support from reactive firefighting to proactive improvement through:
- Cross-platform signal aggregation
- Automated pattern detection
- Toil reduction opportunity identification
- Data-driven resource allocation

---

**Innovation Day Goal**: Demonstrate enterprise-grade scalable architecture with compelling business case for continued investment.
