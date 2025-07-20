# 🔍 Grid Debug Guide

## 🚨 **Issue**: Grid overlay not visible on Adobe Express canvas

## 🛠️ **Debug Steps**

### **Step 1: Test the Debug Button**
1. **Load your add-on** in Adobe Express
2. **Look for the new "🔍 Debug Canvas" button** in the Visual Rulers & Grid section
3. **Click the Debug Canvas button**
4. **Expected Results**:
   - You should see a **bright red grid** overlay for 5 seconds
   - Check the **browser console** (F12) for debug information
   - Look for canvas detection info in the console

### **Step 2: Check Browser Console**
1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Click "🔍 Debug Canvas"**
4. **Look for these messages**:
   ```
   === CANVAS DEBUG INFO ===
   Window size: [width] x [height]
   Found canvas: [element info]
   Canvas rect: [position and size]
   ```

### **Step 3: Test Basic Grid Functionality**
1. **Click "🔲 Show Grid"** (should change to "Hide Grid")
2. **Check console** for any error messages
3. **Look for status messages** in the add-on panel
4. **Expected**: You should see either:
   - "Grid positioned over canvas" (success)
   - "Grid shown over entire window" (fallback)

### **Step 4: Manual Grid Test**
1. **Open browser console** (F12)
2. **Paste this code** to create a test grid:
   ```javascript
   // Create test grid
   const testGrid = document.createElement('div');
   testGrid.id = 'manual-test-grid';
   testGrid.style.cssText = `
       position: fixed !important;
       top: 0 !important;
       left: 0 !important;
       width: 100vw !important;
       height: 100vh !important;
       background-image: 
           linear-gradient(to right, rgba(255,0,0,0.8) 2px, transparent 2px),
           linear-gradient(to bottom, rgba(255,0,0,0.8) 2px, transparent 2px) !important;
       background-size: 30px 30px !important;
       pointer-events: none !important;
       z-index: 999999 !important;
   `;
   document.body.appendChild(testGrid);
   
   // Remove after 10 seconds
   setTimeout(() => testGrid.remove(), 10000);
   ```
3. **Expected**: You should see a red grid overlay for 10 seconds

## 🔧 **Troubleshooting**

### **If Debug Button Doesn't Appear**:
- Check if the add-on loaded properly
- Look for JavaScript errors in console
- Verify the HTML structure includes the grid section

### **If Red Test Grid Doesn't Show**:
- Adobe Express might be blocking overlays
- Try the manual test grid code above
- Check if z-index is being overridden

### **If Console Shows "No canvas found"**:
- Adobe Express canvas detection failed
- Grid will fall back to full-window overlay
- This is expected behavior

### **If Grid Shows But Not Over Canvas**:
- Canvas detection worked but positioning failed
- Grid should still be visible over entire window
- Check console for positioning info

## 📊 **Expected Debug Output**

### **Successful Canvas Detection**:
```
=== CANVAS DEBUG INFO ===
Window size: 1920 x 1080
Found canvas: <div class="...">
Canvas rect: DOMRect {x: 400, y: 100, width: 800, height: 600}
Canvas classes: canvas-container workspace-area
Canvas id: main-canvas
```

### **Failed Canvas Detection**:
```
=== CANVAS DEBUG INFO ===
Window size: 1920 x 1080
No canvas found
Large elements found:
- Element: DIV some-class {x: 0, y: 0, width: 1920, height: 1080}
```

## 🎯 **Quick Fixes**

### **Fix 1: Force Full-Window Grid**
If canvas detection fails, the grid should still show over the entire window. This is the fallback behavior.

### **Fix 2: Increase Grid Visibility**
1. **Increase grid opacity** to 100%
2. **Change grid size** to 50px for more visible lines
3. **Use the debug button** to see the red test grid

### **Fix 3: Check Adobe Express Restrictions**
Adobe Express might have restrictions on overlays. The grid system includes:
- High z-index (9999)
- `!important` CSS rules
- Multiple positioning strategies

## 🚀 **Next Steps Based on Results**

### **If Red Test Grid Shows**:
✅ **Overlay system works** - Issue is with regular grid styling
- Increase opacity in grid controls
- Try different grid colors
- Check CSS conflicts

### **If Red Test Grid Doesn't Show**:
❌ **Adobe Express blocks overlays** - Need alternative approach
- Consider iframe-based grid
- Use canvas-based drawing
- Implement as background pattern

### **If Canvas Detection Works**:
✅ **Positioning should work** - Check grid styling
- Verify background-image CSS
- Check opacity settings
- Ensure z-index is sufficient

### **If Canvas Detection Fails**:
⚠️ **Fallback mode active** - Grid over entire window
- This is expected behavior
- Grid should still be functional
- Consider improving detection logic

## 📝 **Report Template**

After testing, please report:

1. **Debug Button Results**: 
   - Did red test grid appear? (Yes/No)
   - Duration visible: _____ seconds

2. **Console Output**: 
   - Canvas detected? (Yes/No)
   - Canvas size: _____ x _____
   - Any error messages: _____

3. **Grid Toggle Results**:
   - Button changes to "Hide Grid"? (Yes/No)
   - Status message shown: _____
   - Grid visible? (Yes/No)

4. **Manual Test Results**:
   - Manual test grid visible? (Yes/No)
   - Any console errors: _____

This information will help determine the exact issue and implement the appropriate fix.