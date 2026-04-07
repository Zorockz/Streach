# Streach Gate — Native iOS Build & Screen Time Setup

This document covers every step required to make Screen Time / Family Controls
work in production. None of this is needed for the JS/Expo Go experience, but
ALL of it is required for real blocking behavior.

---

## What's done in code (this repo)

| Done | Item |
|------|------|
| ✅ | `modules/family-controls/ios/FamilyControlsModule.swift` — Swift native module |
| ✅ | `modules/family-controls/ios/FamilyActivityPickerView.swift` — Native picker UI |
| ✅ | `modules/family-controls/expo-module.config.json` — Expo module registration |
| ✅ | `extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift` — Monitor extension |
| ✅ | `extensions/DeviceActivityMonitor/Info.plist` — Extension plist |
| ✅ | `extensions/DeviceActivityMonitor/DeviceActivityMonitor.entitlements` — Extension entitlements |
| ✅ | `plugins/withFamilyControls.js` — Config plugin (entitlements + extension target) |
| ✅ | `app.json` — Plugin wired, Family Controls entitlement, App Groups, usage string |
| ✅ | `services/familyControls.ts` — Full JS bridge with all methods |

---

## Step 1 — Apple Developer Portal

### 1a. Enable Family Controls capability
1. Go to developer.apple.com → Certificates, IDs & Profiles → Identifiers
2. Select `com.zorockz.Yoga`
3. Enable **Family Controls** (requires Apple approval — submit request if not already done)
4. Save

### 1b. Create the App Group
1. Still in Identifiers, click **+** → App Groups
2. Create group ID: `group.com.zorockz.Yoga`
3. Go back to `com.zorockz.Yoga` → enable **App Groups** → add `group.com.zorockz.Yoga`

### 1c. Register the Monitor extension identifier
1. Create a new App ID: `com.zorockz.Yoga.DeviceActivityMonitor`
2. Enable **Family Controls** on it
3. Enable **App Groups** → add `group.com.zorockz.Yoga`

### 1d. Provisioning profiles
- Create a **Development** profile for `com.zorockz.Yoga` (includes Family Controls)
- Create a **Development** profile for `com.zorockz.Yoga.DeviceActivityMonitor`
- Download both and add to Xcode

---

## Step 2 — Generate the Xcode project

```bash
cd artifacts/mobile
pnpm install                    # links family-controls local module
npx expo prebuild --platform ios
```

This generates `ios/` and runs `withFamilyControls.js` which:
- Adds Family Controls + App Groups entitlements to the main target
- Copies extension source files into `ios/DeviceActivityMonitor/`
- Adds the DeviceActivity Monitor extension target to the Xcode project

---

## Step 3 — Xcode manual steps (one-time)

Open `ios/Streach Gate.xcworkspace` in Xcode:

### Main app target (`Streach Gate`)
1. **Signing & Capabilities** → Team: set your Apple Developer Team
2. **Signing & Capabilities** → verify `Family Controls` capability is listed
3. **Signing & Capabilities** → verify `App Groups` → `group.com.zorockz.Yoga`
4. Provisioning Profile: select the profile you created in Step 1d

### DeviceActivityMonitor extension target
1. Select `DeviceActivityMonitor` target
2. **Signing & Capabilities** → Team: same team
3. **Signing & Capabilities** → Add `Family Controls`
4. **Signing & Capabilities** → Add `App Groups` → `group.com.zorockz.Yoga`
5. **Build Settings** → `IPHONEOS_DEPLOYMENT_TARGET` = 16.0
6. **Build Settings** → `SWIFT_VERSION` = 5.0
7. **Frameworks, Libraries** → add:
   - `DeviceActivity.framework`
   - `ManagedSettings.framework`
   - `FamilyControls.framework`
8. Provisioning Profile: select the extension profile from Step 1d

---

## Step 4 — EAS Build (development build)

Update `eas.json` → `submit.production` with your real Apple credentials, then:

```bash
eas build --platform ios --profile development
```

Install the `.ipa` on your real device via EAS or TestFlight.

> ⚠️ Screen Time APIs are completely unavailable on the iOS Simulator.
> You MUST test on a real iPhone.

---

## Step 5 — Runtime QA checklist

Run through this checklist on a real iPhone running the development build:

- [ ] App launches without crash
- [ ] Onboarding: PermissionsStep — "Grant Screen Time Access" shows Apple's system dialog
- [ ] Settings: Screen Time row shows "Active" after granting
- [ ] Settings: "Choose with Screen Time" opens `FamilyActivityPicker` (native Apple UI)
- [ ] After selecting apps and tapping Save, the selection is persisted
- [ ] DeviceActivity schedule: enabling a schedule starts `stretchgate.lock` monitoring
- [ ] During scheduled lock window: selected apps show the Screen Time shield
- [ ] After scheduled window ends: shield is removed automatically
- [ ] Unlock window logic: completely absent from all screens ✅ (already removed)
- [ ] Support email: `simodigitalagency@gmail.com` ✅
- [ ] Privacy Policy URL: `https://www.termsfeed.com/live/ee6484bf-6c19-4aca-baed-79f084570331` ✅

---

## Limitations

| Limitation | Reason |
|------------|--------|
| Cannot test Screen Time on Simulator | Apple restriction — real device only |
| DeviceActivity extension requires separate Xcode target | Cannot be done in Expo Go |
| FamilyActivityPicker shows only apps/categories Apple approves | By design — Apple controls the UI |
| `ManagedSettingsStore` only shields in the same "account context" | Works for individual (not family/child) authorization |
| App must be installed from a signed build | Expo Go cannot run native modules |
| Schedule callbacks require the extension to be installed | Monitor extension must be built + signed |

---

## What happens without native build

In Expo Go / web:
- `isNativeAvailable()` returns `false`
- All Screen Time functions silently no-op
- The app fallback to the JS app picker (cosmetic only — no actual blocking)
- Onboarding PermissionsStep skips Screen Time request gracefully
