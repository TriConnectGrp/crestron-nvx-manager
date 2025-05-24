# Device Discovery LAN and GLOBE Removal

## Changes Made

### 1. Removed "Network Scan" (LAN) Discovery Option
**Location**: `src/components/DeviceDiscovery.tsx` - Advanced Discovery Options

**What was removed**:
- Network Scan checkbox from the discovery methods
- Associated `enableNetworkScan` state handling
- Network range scanning functionality

**Before**:
```jsx
<label className="flex items-center">
  <input
    type="checkbox"
    checked={discoveryOptions.enableNetworkScan}
    onChange={(e) => setDiscoveryOptions(prev => ({ 
      ...prev, 
      enableNetworkScan: e.target.checked 
    }))}
    className="mr-2"
  />
  <span className="text-sm text-gray-700 dark:text-gray-300">Network Scan</span>
</label>
```

**After**: Checkbox completely removed

### 2. Removed Globe Icon (GLOBE) for Offline Status
**Location**: `src/components/DeviceDiscovery.tsx` - Device Status Icons

**What was removed**:
- Globe icon import from lucide-react
- Globe icon usage for offline device status

**Before**:
```jsx
case 'offline': return <Globe className="w-4 h-4" />;
```

**After**:
```jsx
case 'offline': return <Monitor className="w-4 h-4" />;
```

## Remaining Discovery Methods
After the removal, the following discovery methods are still available:

1. **mDNS** - Multicast DNS discovery
2. **SSDP** - Simple Service Discovery Protocol  
3. **Crestron Protocol** - Native Crestron discovery
4. **Manual IP Entry** - Direct IP address addition

## UI Changes
- **Advanced Options**: Network Scan checkbox no longer appears
- **Device Status**: Offline devices now show Monitor icon instead of Globe icon
- **Discovery Methods**: Only mDNS, SSDP, and Crestron Protocol remain as automatic discovery options

## Impact
- **Functionality**: Network scanning capability removed from automatic discovery
- **Performance**: Potentially faster discovery without network range scanning
- **UI Simplification**: Cleaner interface with fewer discovery options
- **Visual Consistency**: Offline devices now use Monitor icon like default status

## Files Modified
- `src/components/DeviceDiscovery.tsx`
  - Removed Globe import
  - Removed Network Scan checkbox and state handling
  - Changed offline status icon from Globe to Monitor

## Testing
- ✅ Build completes successfully
- ✅ Discovery interface displays correctly
- ✅ Remaining discovery methods (mDNS, SSDP, Crestron) still functional
- ✅ Manual IP entry still works
- ✅ Device status icons display consistently 