# 🚨 SIREN Dashboard - Startup Instructions

## 🏃‍♂️ **Quick Start (2 Commands)**

### **Terminal 1: API Server**
```bash
cd "C:\src\test\Bolt Support Insights\Source"
dotnet run --project SIREN.API
```

### **Terminal 2: React Frontend**
```bash
cd "C:\src\test\Bolt Support Insights\Source\siren-dashboard"
npm start
```

### **Result**
- ✅ **API**: http://localhost:5135 (with Swagger docs)
- ✅ **Dashboard**: http://localhost:3000 (opens automatically)
- ✅ **Full Integration**: React → API → SIREN.Core services

---

## 🎯 **Demo the Innovation**

1. **View Auto-Categorized Signals**: See AI categorization working
2. **Click "Triage" button**: Opens manual triage interface
3. **Adjust Priority Slider**: Human scoring (1-10 scale) 
4. **Override Category**: Manual classification override
5. **View Analytics**: Charts showing human+AI collaboration

---

## ✅ **Verification Checklist**

- [ ] API server running on port 5135
- [ ] React app running on port 3000
- [ ] Dashboard loads with signal data
- [ ] Triage panel opens when clicking "Triage"
- [ ] Charts display category distribution
- [ ] No console errors in browser dev tools

---

**🎉 Ready for Innovation Day demo!**
