# 🔧 Phase 1 Troubleshooting Guide

## 🚨 **Current Issues Identified**

Based on the console errors, here are the main issues and solutions:

### **Issue 1: `selectLayerById is not a function`**
**Cause**: The new Phase 1 backend methods aren't loaded yet
**Solution**: Reload the add-on to load the new API methods

### **Issue 2: Network Errors (ERR_BLOCKED_BY_CLIENT)**
**Cause**: Browser extensions or ad blockers blocking requests
**Solution**: Disable ad blockers for Adobe Express

---

## 🛠️ **Step-by-Step Fix Process**

### **Step 1: Reload the Add-on** ⭐ **MOST IMPORTANT**
1. **Close the add-on panel** in Adobe Express
2. **Refresh the Adobe Express page** (Ctrl+F5 or Cmd+Shift+R)
3. **Reopen your add-on**
4. **Wait for it to fully load**

**Why**: The new backend methods I added need to be loaded fresh

### **Step 2: Test API Availability**
1. **Look for the new "🧪 Test API" button** in the Visual Rulers & Grid section
2. **Click "🧪 Test API"**
3. **Check the popup results**:
   - ✅ **All green checkmarks**: API is working
   - ❌ **Red X marks**: API methods missing (reload again)
   - ⚠️ **Mixed results**: Partial loading (reload again)

### **Step 3: Test Grid System**
1. **Click "🔍 Debug Canvas"** - should show red test grid for 5 seconds
2. **Click "🔲 Show Grid"** - should show blue grid lines
3. **Check browser console** (F12) for any errors

### **Step 4: Test Layer Management**
1. **Add some elements** to your Adobe Express canvas (text, shapes)
2. **Click "🔄 Refresh Layers"** in the Layer Management section
3. **Expected**: Layer list should populate with your elements
4. **Try clicking "Select" on a layer** - should select the element

---

## 🔍 **Diagnostic Tools Added**

### **🧪 Test API Button**
- **Location**: Visual Rulers & Grid section
- **Purpose**: Checks if all Phase 1 backend methods are available
- **Results**: Shows popup with ✅/❌ for each API method

### **🔍 Debug Canvas Button**
- **Location**: Visual Rulers & Grid section  
- **Purpose**: Tests grid overlay system and canvas detection
- **Results**: Shows red test grid + console debug info

### **Enhanced Error Messages**
- All buttons now show helpful error messages
- Console logging for debugging
- "Reload add-on" suggestions when methods are missing

---

## 📊 **Expected Results After Reload**

### **API Test Results (🧪 Test API)**
```
getAllLayers: ✅
selectLayerById: ✅
deleteLayerById: ✅
toggleLayerVisibility: ✅
createBlankLayer: ✅
duplicateSelectedElements: ✅
alignToCanvasCenter: ✅
distributeElementsEvenly: ✅
alignToMargins: ✅
getAllLayers call: ✅ Success (X layers)
```

### **Grid Test Results (🔍 Debug Canvas)**
- Red test grid visible for 5 seconds
- Console shows canvas detection info
- Status message confirms grid positioning

### **Layer Management Results**
- Layer list populates with canvas elements
- Layer selection works without errors
- No "not a function" errors in console

---

## 🚨 **If Issues Persist**

### **Problem: API methods still missing after reload**
**Solution**: 
1. Check if `present_document.js` was saved properly
2. Try hard refresh (Ctrl+Shift+F5)
3. Clear browser cache for Adobe Express

### **Problem: Grid still not visible**
**Solution**:
1. Use "🔍 Debug Canvas" to test overlay system
2. If red test grid shows, increase grid opacity to 100%
3. Try different grid sizes (50px, 100px)

### **Problem: Console shows network errors**
**Solution**:
1. Disable browser ad blockers
2. Disable browser extensions temporarily
3. Try in incognito/private browsing mode

### **Problem: Add-on won't load at all**
**Solution**:
1. Check browser console for JavaScript errors
2. Verify all files are saved properly
3. Try refreshing Adobe Express completely

---

## 🎯 **Quick Test Checklist**

After reloading the add-on:

- [ ] **🧪 Test API button appears** in grid section
- [ ] **🔍 Debug Canvas button appears** in grid section  
- [ ] **Click 🧪 Test API** → Shows popup with ✅ checkmarks
- [ ] **Click 🔍 Debug Canvas** → Shows red grid for 5 seconds
- [ ] **Click 🔲 Show Grid** → Shows blue grid lines
- [ ] **Add elements to canvas** → Create text/shapes
- [ ] **Click 🔄 Refresh Layers** → Layer list populates
- [ ] **Click Select on a layer** → Element gets selected
- [ ] **No console errors** → Check F12 console

---

## 📞 **If You Need Help**

If the issues persist after following this guide, please provide:

1. **Screenshot of the 🧪 Test API results popup**
2. **Screenshot of browser console** (F12) after testing
3. **Confirmation that you reloaded the add-on**
4. **Browser and version** you're using

The diagnostic tools I've added will give us exact information about what's working and what isn't, making it much easier to fix any remaining issues.

---

## ✅ **Success Indicators**

You'll know everything is working when:
- ✅ **API Test shows all green checkmarks**
- ✅ **Grid overlay is visible** (blue lines)
- ✅ **Layer list populates** with your canvas elements
- ✅ **No console errors** when using features
- ✅ **Status messages appear** for all actions

**The most important step is reloading the add-on to load the new backend methods!** 🔄