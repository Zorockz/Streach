const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

module.exports = ({ config }) => {
  // Ensure Family Controls entitlement is on the main app target
  config = withEntitlementsPlist(config, (cfg) => {
    cfg.modResults['com.apple.developer.family-controls'] = true;
    cfg.modResults['com.apple.security.application-groups'] = [
      'group.com.zorockz.Yoga',
    ];
    return cfg;
  });

  // NSUserActivityTypes required by FamilyControls token resolution
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults['NSUserActivityTypes'] = [
      'com.apple.cocoaidentity.tokens',
    ];
    return cfg;
  });

  return config;
};
