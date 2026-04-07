// DeviceActivityMonitorExtension.swift
// DeviceActivity Monitor Extension for Streach Gate
// Bundle ID: com.zorockz.Yoga.DeviceActivityMonitor
//
// This extension runs in the background and responds to DeviceActivity schedule events.
// It shields / unshields apps using ManagedSettings when the scheduled lock period
// starts and ends — WITHOUT requiring the main app to be running.
//
// REQUIRES (Xcode):
//   - Separate "DeviceActivity Monitor Extension" target in Xcode
//   - com.apple.developer.family-controls entitlement on this target
//   - com.apple.security.application-groups = ["group.com.zorockz.Yoga"] on this target
//   - TARGETED_DEVICE_FAMILY = 1 (iPhone)
//   - IPHONEOS_DEPLOYMENT_TARGET = 16.0

import Foundation
import DeviceActivity
import ManagedSettings
import FamilyControls

// MARK: - Constants (must match FamilyControlsModule.swift)
private let kAppGroup     = "group.com.zorockz.Yoga"
private let kSelectionKey = "stretchgate.familyActivitySelection"

// MARK: - Monitor

@available(iOS 16.0, *)
class StretchGateMonitor: DeviceActivityMonitor {

  // Each extension instance gets its own ManagedSettingsStore.
  // The store name must match what the main app uses.
  private let store = ManagedSettingsStore()

  // Called when the scheduled lock period STARTS (e.g. 22:00 every night).
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    guard activity.rawValue == "stretchgate.lock" else { return }
    applyShield()
  }

  // Called when the scheduled lock period ENDS (e.g. 08:00 next morning).
  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    guard activity.rawValue == "stretchgate.lock" else { return }
    removeShield()
  }

  // Called when the user exceeds a usage threshold (optional — we don't use threshold).
  override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
    super.eventDidReachThreshold(event, activity: activity)
  }

  // MARK: - Shield helpers

  private func applyShield() {
    guard let selection = loadStoredSelection() else { return }
    store.shield.applications = selection.applications.isEmpty
      ? nil : selection.applications
    store.shield.applicationCategories = selection.categories.isEmpty
      ? nil : ShieldSettings.ActivityCategoryPolicy.specific(selection.categories)
    store.shield.webDomains = selection.webDomains.isEmpty
      ? nil : selection.webDomains
  }

  private func removeShield() {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
  }

  // MARK: - Storage (App Group UserDefaults — shared with main app)

  private func loadStoredSelection() -> FamilyActivitySelection? {
    let defaults = UserDefaults(suiteName: kAppGroup) ?? UserDefaults.standard
    guard let data = defaults.data(forKey: kSelectionKey) else { return nil }
    return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
  }
}
