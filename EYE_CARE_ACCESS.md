# How to Access Eye Care Module

## 🎯 Quick Access Steps

1. **Start the application**
   ```bash
   npm run dev
   ```
   Then open http://localhost:3000 in your browser

2. **Login** (if required)

3. **Select or Create a Patient**
   - Click on a patient name in the left sidebar
   - OR click "New Person" to add a new patient

4. **Scroll down the patient details page**
   - The Eye Care Module appears below "Current Medications"
   - Look for the **👁️ Eye Care Records** heading

## 📍 Exact Location

When viewing a patient's details, you'll see sections in this order:

```
Patient Info (name, DOB, contact)
    ↓
Health Insights
    ↓
Current Medications
    ↓
👁️ EYE CARE RECORDS ← HERE
    ↓
Medical History Summary
```

## ✅ Verification

The Eye Care Module is present if you see:
- A section with heading "Eye Care Records"  
- Three tabs: **Prescriptions** | **Tests** | **Conditions**
- Blue "+ Add Prescription" button (or similar for active tab)

## 🔧 If Module Is Not Visible

1. **Check you're viewing a patient**
   - The sidebar must have a patient selected (highlighted)

2. **Scroll down**
   - The module is not at the top of the page
   - It's after "Current Medications"

3. **Check browser console**
   - Press F12 to open developer tools
   - Look for any errors in the Console tab

4. **Refresh the page**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

5. **Clear cache and rebuild**
   ```bash
   rm -rf dist node_modules/.vite
   npm run build
   npm run dev
   ```

## What You Can Do

### Prescriptions Tab
- Add new eye prescriptions (glasses or contacts)
- Track sphere, cylinder, axis values
- Record visual acuity (20/20, etc.)
- Set pupillary distance (PD)
- Mark current glasses/contacts
- Schedule next checkup

### Tests Tab
- Record eye tests:
  - Routine checkup
  - Glaucoma test
  - Retina exam
  - Cataract screening
  - LASIK screening
- Track IOP (Intraocular Pressure)
- Save findings and diagnosis
- Add recommendations

### Conditions Tab
- Track eye conditions (Myopia, Glaucoma, etc.)
- Monitor severity (mild/moderate/severe)
- Record which eye is affected
- Update treatment status
- Mark as active/monitoring/resolved

## Features

✅ Dark mode support  
✅ Auto-saves all data  
✅ No additional navigation needed  
✅ Integrated with patient records  
✅ Delete protection (confirmation required)  

## Location in App

```
Home
 └─ Select Patient (sidebar)
     └─ Patient Details Page
         ├─ Basic Info
         ├─ Health Insights
         ├─ Current Medications
         └─ 👁️ Eye Care Module ← HERE
             ├─ Prescriptions Tab
             ├─ Tests Tab
             └─ Conditions Tab
```

## Tips

- Eye Care Module initializes automatically when you add your first prescription/test/condition
- All data is encrypted and stored locally
- Use the "Set as Current" button to mark your active glasses/contacts prescription
- Each patient has their own independent eye care record
