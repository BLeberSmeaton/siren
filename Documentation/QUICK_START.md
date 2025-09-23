# 🚀 SIREN Dashboard - Quick Start Guide

**Get the SIREN Dashboard running in 2 minutes!**

## ⚡ **Instant Startup**

### **Step 1: Start the API Server** (30 seconds)
```bash
# Open PowerShell and navigate to project
cd "C:\src\test\Bolt Support Insights\Source"

# Start the ASP.NET Core Web API
dotnet run --project SIREN.API
```

**✅ You should see**: `Now listening on: http://localhost:5135`

### **Step 2: Start the React Frontend** (30 seconds)
```bash
# Open a NEW PowerShell window
cd "C:\src\test\Bolt Support Insights\Source\siren-dashboard"

# Start the React development server
npm start
```

**✅ You should see**: Browser automatically opens to `http://localhost:3000`

### **Result**
- ✅ **API**: http://localhost:5135 (with Swagger docs)
- ✅ **Dashboard**: http://localhost:3000 (opens automatically)
- ✅ **Full Integration**: React → API → SIREN.Core services

---

## 🎯 **Demo the Innovation**

### **🎯 Try the Manual Triage Feature (Innovation Day Highlight)**
1. **View Signals**: See auto-categorized support signals in the table
2. **Click "Triage"**: Opens the human+AI collaboration interface
3. **Adjust Priority**: Use the slider to set manual priority (1-10)
4. **Override Category**: Change AI categorization if needed
5. **Save Triage**: Click "Save Triage" to persist your decisions

### **📊 Explore the Analytics**
- **Summary Cards**: Total signals, categorized count, manual triage progress
- **Visual Charts**: Bar chart and pie chart showing category distribution
- **Category Filter**: Use the dropdown to filter signals by category

---

## 🛠️ **Troubleshooting**

### **API Not Starting?**
```bash
# Make sure you're in the right directory
cd "C:\src\test\Bolt Support Insights\Source"

# Check if .NET 9.0 is installed
dotnet --version

# Build the project first if needed
dotnet build SIREN.API
```

### **React Not Starting?**
```bash
# Install dependencies if first time
npm install

# Clear cache if having issues
npm start -- --reset-cache
```

### **Can't Connect to API?**
- ✅ **Check API is running** on http://localhost:5135
- ✅ **Check CORS settings** in SIREN.API/Program.cs
- ✅ **Verify API URL** in `siren-dashboard/src/services/api.ts`

---

## ✅ **Verification Checklist**

- [ ] API server running on port 5135
- [ ] React app running on port 3000
- [ ] Dashboard loads with signal data
- [ ] Triage panel opens when clicking "Triage"
- [ ] Charts display category distribution
- [ ] No console errors in browser dev tools

---

## 🎭 **Demo Script (30 seconds)**

**Perfect for showing to stakeholders:**

1. **"This is SIREN - our Human+AI collaboration platform for support signal management"**
2. **Show the dashboard**: *"Watch as signals are automatically categorized by our AI engine"*
3. **Click Triage on a signal**: *"But humans add the crucial business context"*
4. **Use the slider**: *"Priority scoring based on business impact"*
5. **Show the analytics**: *"Real-time view of our collaborative intelligence"*

---

## 🔄 **Development Commands**

### **For Testing**
```bash
# Run backend tests
dotnet test SIREN.Core.Tests

# Run frontend tests  
cd siren-dashboard && npm test
```

### **For Production**
```bash
# Build for deployment
cd siren-dashboard && npm run build
cd .. && dotnet publish SIREN.API -c Release
```

---

## 📞 **Need Help?**

- **API Documentation**: Navigate to http://localhost:5135/swagger when API is running
- **Test Status**: All tests should pass: `dotnet test`
- **Project Architecture**: See [`ARCHITECTURE_OVERVIEW.md`](ARCHITECTURE_OVERVIEW.md)
- **Testing Details**: See [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md)
- **Development Context**: See [`DEVELOPMENT_GUIDE.md`](DEVELOPMENT_GUIDE.md)
- **Project Status**: See [`PROJECT_STATUS.md`](PROJECT_STATUS.md)
- **System Diagrams**: See [`DIAGRAMS.md`](DIAGRAMS.md)

---

## 🎉 **You're Ready!**

**🚀 Both servers running? Dashboard loaded? You're ready to demo the future of Human+AI collaboration in support management!**

The SIREN Dashboard showcases:
- ✅ Modern full-stack development (React + .NET)
- ✅ Enterprise-grade architecture  
- ✅ Human+AI collaboration innovation
- ✅ Professional UI/UX design
- ✅ Comprehensive testing and documentation

**Perfect for Innovation Day presentations!** 🏆
