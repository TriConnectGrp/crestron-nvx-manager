# DeviceLocate White Screen Fix

## Issue
The application was showing a white screen when accessing the locate functionality due to the following error:
```
TypeError: window.electronAPI.onLocateProgress is not a function
```

## Root Cause
The `DeviceLocate.tsx` component was still trying to use the old locate API methods that had been replaced with the new identify functionality:
- `window.electronAPI.onLocateProgress()` - No longer exists
- `window.electronAPI.removeLocateProgressListener()` - No longer exists  
- `window.electronAPI.locateDevice()` - Replaced with `identifyDevice()`
- `window.electronAPI.stopLocate()` - No longer needed (identify has duration)

## Solution
Updated `DeviceLocate.tsx` to use the new identify API:

### Changes Made:
1. **API Migration**: 
   - Replaced `locateDevice()` with `identifyDevice()`
   - Removed progress event listeners (not needed for identify)
   - Implemented local timer for progress tracking

2. **State Management**:
   - Changed from `isLocating` to `isIdentifying`
   - Replaced `progress` state with `timeRemaining`
   - Added local countdown timer using `useEffect`

3. **UI Updates**:
   - Changed "Locate Device" to "Identify Device"
   - Updated "Flash Duration" to "Identify Duration"
   - Changed "Flashing LEDs..." to "Identifying Device..."
   - Updated progress display to show time remaining
   - Modified help text to be more accurate

4. **Functionality**:
   - Identify automatically stops after duration (per Crestron API)
   - Manual stop just resets local state
   - Progress tracking now uses local countdown timer
   - More accurate messaging about device identification

## API Compliance
The updated component now properly uses the official Crestron DM NVX REST API `/Device/Identify` endpoint instead of custom LED flashing logic.

## Files Modified
- `src/components/DeviceLocate.tsx` - Complete rewrite to use identify API
- No changes needed to backend - identify handler already existed
- No changes needed to preload.js - identifyDevice already exposed
- No changes needed to types - identifyDevice already defined

## Testing
After the fix:
- ✅ No more white screen error
- ✅ Device identify functionality works correctly
- ✅ Progress tracking displays properly
- ✅ Duration setting and countdown timer work
- ✅ Proper error handling and user feedback
- ✅ TypeScript compilation successful

## Usage
The DeviceLocate component can now be safely integrated into the main application without causing white screen crashes. The identify functionality provides official API-compliant device identification. 