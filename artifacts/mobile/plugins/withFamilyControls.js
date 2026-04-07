/**
 * withFamilyControls.js
 * Expo config plugin for Streach Gate — Family Controls / Screen Time
 *
 * This plugin runs during `expo prebuild` (or EAS Build) and modifies the
 * generated Xcode project to:
 *
 *  1. Add Family Controls entitlement to main app target
 *  2. Add App Groups entitlement to main app target (needed for extension ↔ app data sharing)
 *  3. Copy DeviceActivity Monitor extension source files into the ios/ folder
 *  4. Add the DeviceActivity Monitor extension target to the Xcode project
 *  5. Configure extension build settings, frameworks, and entitlements
 *
 * After `expo prebuild`:
 *  - You still need to open Xcode once to:
 *    a) Set signing team on BOTH targets
 *    b) Register the App Group in your Apple Developer portal
 *    c) Enable Family Controls capability on BOTH targets in Xcode Signing & Capabilities
 *  See NATIVE_SETUP.md for the complete checklist.
 */

const {
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
  withDangerousMod,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ── Constants ───────────────────────────────────────────────────────────────
const APP_BUNDLE_ID       = 'com.zorockz.Yoga';
const APP_GROUP           = 'group.com.zorockz.Yoga';
const EXT_NAME            = 'DeviceActivityMonitor';
const EXT_BUNDLE_ID       = `${APP_BUNDLE_ID}.DeviceActivityMonitor`;
const EXT_DEPLOYMENT_VER  = '16.0';
const SWIFT_VERSION       = '5.0';

// ── 1. Main app entitlements ────────────────────────────────────────────────
function withMainAppEntitlements(config) {
  return withEntitlementsPlist(config, (c) => {
    c.modResults['com.apple.developer.family-controls'] = true;
    c.modResults['com.apple.security.application-groups'] = [APP_GROUP];
    return c;
  });
}

// ── 2. Copy extension source files into ios/<ExtName>/ ───────────────────────
function withCopyExtensionFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (c) => {
      const iosDir      = path.join(c.modRequest.projectRoot, 'ios');
      const extDir      = path.join(iosDir, EXT_NAME);
      const sourceDir   = path.join(c.modRequest.projectRoot, 'extensions', EXT_NAME);

      if (!fs.existsSync(sourceDir)) {
        console.warn(`[withFamilyControls] Extension source not found at ${sourceDir}. Skipping copy.`);
        return c;
      }

      fs.mkdirSync(extDir, { recursive: true });

      for (const file of fs.readdirSync(sourceDir)) {
        fs.copyFileSync(path.join(sourceDir, file), path.join(extDir, file));
      }

      console.log(`[withFamilyControls] Copied extension files to ${extDir}`);
      return c;
    },
  ]);
}

// ── 3. Add extension target to Xcode project ────────────────────────────────
function withExtensionTarget(config) {
  return withXcodeProject(config, (c) => {
    const xcodeProject = c.modResults;

    // Idempotency check — don't add twice
    const targets = xcodeProject.pbxNativeTargetSection();
    const alreadyExists = Object.values(targets).some(
      (t) => t && typeof t === 'object' && t.name === EXT_NAME
    );
    if (alreadyExists) {
      console.log('[withFamilyControls] Extension target already exists. Skipping.');
      return c;
    }

    const projectName = c.modRequest.projectName ?? 'StretchGate';
    const iosDir      = path.join(c.modRequest.projectRoot, 'ios');
    const extDir      = path.join(iosDir, EXT_NAME);

    // ── UUIDs ──────────────────────────────────────────────────────
    const uuid = () => {
      let result = '';
      const chars = '0123456789ABCDEF';
      for (let i = 0; i < 24; i++) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    };

    const targetUUID          = uuid();
    const buildConfigListUUID = uuid();
    const debugConfigUUID     = uuid();
    const releaseConfigUUID   = uuid();
    const sourceBuildPhaseUUID = uuid();
    const framesBuildPhaseUUID = uuid();
    const resBuildPhaseUUID   = uuid();
    const groupUUID           = uuid();
    const swiftFileUUID       = uuid();
    const plistFileUUID       = uuid();
    const entitlementsUUID    = uuid();
    const containerItemUUID   = uuid();

    // ── Source files ───────────────────────────────────────────────
    const swiftFileName       = 'DeviceActivityMonitorExtension.swift';
    const plistFileName       = 'Info.plist';
    const entitlementsFileName = 'DeviceActivityMonitor.entitlements';

    // PBX file references
    xcodeProject.addToPbxFileReferenceSection({
      uuid: swiftFileUUID,
      basename: swiftFileName,
      group: EXT_NAME,
      type: 'sourcecode.swift',
      path: `${EXT_NAME}/${swiftFileName}`,
      sourceTree: '"<group>"',
    });
    xcodeProject.addToPbxFileReferenceSection({
      uuid: plistFileUUID,
      basename: plistFileName,
      group: EXT_NAME,
      type: '"text.plist.xml"',
      path: `${EXT_NAME}/${plistFileName}`,
      sourceTree: '"<group>"',
    });
    xcodeProject.addToPbxFileReferenceSection({
      uuid: entitlementsUUID,
      basename: entitlementsFileName,
      group: EXT_NAME,
      type: 'text.plist.entitlements',
      path: `${EXT_NAME}/${entitlementsFileName}`,
      sourceTree: '"<group>"',
    });

    // ── Build phases ───────────────────────────────────────────────
    // Sources
    const sourceBuildFileUUID = uuid();
    xcodeProject.addToPbxBuildFileSection({
      uuid: sourceBuildFileUUID,
      fileRef: swiftFileUUID,
      basename: swiftFileName,
      group: EXT_NAME,
    });

    const sourcesPhase = {
      isa: 'PBXSourcesBuildPhase',
      buildActionMask: 2147483647,
      files: [`${sourceBuildFileUUID} /* ${swiftFileName} in Sources */`],
      runOnlyForDeploymentPostprocessing: 0,
    };

    // Frameworks
    const deviceActivityFrameworkUUID = uuid();
    const managedSettingsFrameworkUUID = uuid();
    const familyControlsFrameworkUUID = uuid();

    const framesPhase = {
      isa: 'PBXFrameworksBuildPhase',
      buildActionMask: 2147483647,
      files: [
        `${deviceActivityFrameworkUUID} /* DeviceActivity.framework */`,
        `${managedSettingsFrameworkUUID} /* ManagedSettings.framework */`,
        `${familyControlsFrameworkUUID} /* FamilyControls.framework */`,
      ],
      runOnlyForDeploymentPostprocessing: 0,
    };

    // Resources (plist)
    const plistBuildFileUUID = uuid();
    xcodeProject.addToPbxBuildFileSection({
      uuid: plistBuildFileUUID,
      fileRef: plistFileUUID,
      basename: plistFileName,
      group: EXT_NAME,
    });
    const resourcesPhase = {
      isa: 'PBXResourcesBuildPhase',
      buildActionMask: 2147483647,
      files: [`${plistBuildFileUUID} /* ${plistFileName} in Resources */`],
      runOnlyForDeploymentPostprocessing: 0,
    };

    xcodeProject.hash.project.objects['PBXSourcesBuildPhase'] = xcodeProject.hash.project.objects['PBXSourcesBuildPhase'] || {};
    xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'] = xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'] || {};
    xcodeProject.hash.project.objects['PBXResourcesBuildPhase'] = xcodeProject.hash.project.objects['PBXResourcesBuildPhase'] || {};

    xcodeProject.hash.project.objects['PBXSourcesBuildPhase'][sourceBuildPhaseUUID] = sourcesPhase;
    xcodeProject.hash.project.objects['PBXFrameworksBuildPhase'][framesBuildPhaseUUID] = framesPhase;
    xcodeProject.hash.project.objects['PBXResourcesBuildPhase'][resBuildPhaseUUID] = resourcesPhase;

    // ── Build configurations ───────────────────────────────────────
    const commonBuildSettings = {
      CLANG_ANALYZER_NONNULL: 'YES',
      CLANG_ENABLE_MODULES: 'YES',
      CODE_SIGN_ENTITLEMENTS: `"${EXT_NAME}/${entitlementsFileName}"`,
      CODE_SIGN_STYLE: 'Automatic',
      CURRENT_PROJECT_VERSION: 1,
      GENERATE_INFOPLIST_FILE: 'NO',
      INFOPLIST_FILE: `"${EXT_NAME}/Info.plist"`,
      IPHONEOS_DEPLOYMENT_TARGET: EXT_DEPLOYMENT_VER,
      MARKETING_VERSION: '1.0',
      PRODUCT_BUNDLE_IDENTIFIER: `"${EXT_BUNDLE_ID}"`,
      PRODUCT_NAME: `"$(TARGET_NAME)"`,
      SKIP_INSTALL: 'YES',
      SWIFT_EMIT_LOC_STRINGS: 'YES',
      SWIFT_VERSION: SWIFT_VERSION,
      TARGETED_DEVICE_FAMILY: '"1"',
    };

    xcodeProject.hash.project.objects['XCBuildConfiguration'] = xcodeProject.hash.project.objects['XCBuildConfiguration'] || {};
    xcodeProject.hash.project.objects['XCBuildConfiguration'][debugConfigUUID] = {
      isa: 'XCBuildConfiguration',
      buildSettings: { ...commonBuildSettings, DEBUG_INFORMATION_FORMAT: 'dwarf' },
      name: 'Debug',
    };
    xcodeProject.hash.project.objects['XCBuildConfiguration'][releaseConfigUUID] = {
      isa: 'XCBuildConfiguration',
      buildSettings: { ...commonBuildSettings, DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"', VALIDATE_PRODUCT: 'YES' },
      name: 'Release',
    };

    xcodeProject.hash.project.objects['XCConfigurationList'] = xcodeProject.hash.project.objects['XCConfigurationList'] || {};
    xcodeProject.hash.project.objects['XCConfigurationList'][buildConfigListUUID] = {
      isa: 'XCConfigurationList',
      buildConfigurations: [
        `${debugConfigUUID} /* Debug */`,
        `${releaseConfigUUID} /* Release */`,
      ],
      defaultConfigurationIsVisible: 0,
      defaultConfigurationName: 'Release',
    };

    // ── Native target ──────────────────────────────────────────────
    xcodeProject.hash.project.objects['PBXNativeTarget'] = xcodeProject.hash.project.objects['PBXNativeTarget'] || {};
    xcodeProject.hash.project.objects['PBXNativeTarget'][targetUUID] = {
      isa: 'PBXNativeTarget',
      buildConfigurationList: buildConfigListUUID,
      buildPhases: [
        `${sourceBuildPhaseUUID} /* Sources */`,
        `${framesBuildPhaseUUID} /* Frameworks */`,
        `${resBuildPhaseUUID} /* Resources */`,
      ],
      buildRules: [],
      dependencies: [],
      name: EXT_NAME,
      packageProductDependencies: [],
      productName: EXT_NAME,
      productReference: plistFileUUID,
      productType: '"com.apple.product-type.app-extension"',
    };

    // ── Add target to project targets array ────────────────────────
    const projectSection = xcodeProject.pbxProjectSection();
    const projectKey = Object.keys(projectSection).find((k) => !k.endsWith('_comment'));
    if (projectKey) {
      const proj = projectSection[projectKey];
      if (proj.targets && Array.isArray(proj.targets)) {
        proj.targets.push(`${targetUUID} /* ${EXT_NAME} */`);
      }

      // Add container item proxy + target dependency on main app target
      if (proj.targets.length > 1) {
        const mainTargetRef = proj.targets[0];
        const mainTargetUUID = typeof mainTargetRef === 'string'
          ? mainTargetRef.split(' ')[0]
          : null;

        if (mainTargetUUID) {
          const proxyUUID = uuid();
          const depUUID   = uuid();

          xcodeProject.hash.project.objects['PBXContainerItemProxy'] = xcodeProject.hash.project.objects['PBXContainerItemProxy'] || {};
          xcodeProject.hash.project.objects['PBXContainerItemProxy'][proxyUUID] = {
            isa: 'PBXContainerItemProxy',
            containerPortal: projectKey,
            proxyType: 1,
            remoteGlobalIDString: targetUUID,
            remoteInfo: `"${EXT_NAME}"`,
          };

          xcodeProject.hash.project.objects['PBXTargetDependency'] = xcodeProject.hash.project.objects['PBXTargetDependency'] || {};
          xcodeProject.hash.project.objects['PBXTargetDependency'][depUUID] = {
            isa: 'PBXTargetDependency',
            target: `${targetUUID} /* ${EXT_NAME} */`,
            targetProxy: `${proxyUUID} /* PBXContainerItemProxy */`,
          };

          // Add dependency to main target
          const nativeTargets = xcodeProject.pbxNativeTargetSection();
          const mainTarget = nativeTargets[mainTargetUUID];
          if (mainTarget && mainTarget.dependencies) {
            mainTarget.dependencies.push(`${depUUID} /* PBXTargetDependency */`);
          }
        }
      }
    }

    // ── Group for extension files ──────────────────────────────────
    xcodeProject.hash.project.objects['PBXGroup'] = xcodeProject.hash.project.objects['PBXGroup'] || {};
    xcodeProject.hash.project.objects['PBXGroup'][groupUUID] = {
      isa: 'PBXGroup',
      children: [
        `${swiftFileUUID} /* ${swiftFileName} */`,
        `${plistFileUUID} /* ${plistFileName} */`,
        `${entitlementsUUID} /* ${entitlementsFileName} */`,
      ],
      name: `"${EXT_NAME}"`,
      path: `"${EXT_NAME}"`,
      sourceTree: '"<group>"',
    };

    // Add group to main project group
    const groupSection = xcodeProject.hash.project.objects['PBXGroup'];
    const mainGroupKey = Object.keys(groupSection).find((k) => {
      const g = groupSection[k];
      return g && g.children && typeof g.children === 'object'
        && g.children.some((child) => typeof child === 'string' && child.includes(projectName));
    });
    if (mainGroupKey) {
      groupSection[mainGroupKey].children.push(`${groupUUID} /* ${EXT_NAME} */`);
    }

    console.log(`[withFamilyControls] Added DeviceActivityMonitor extension target (${targetUUID})`);
    return c;
  });
}

// ── Main plugin export ───────────────────────────────────────────────────────
/**
 * @param {import('@expo/config-plugins').ExpoConfig} config
 */
module.exports = function withFamilyControls(config) {
  config = withMainAppEntitlements(config);
  config = withCopyExtensionFiles(config);
  config = withExtensionTarget(config);
  return config;
};
