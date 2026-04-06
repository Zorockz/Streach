const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// Fix: @superwall/react-native-superwall@2.1.7 incorrectly resolves
// require('../package.json') from lib/module/ → redirects to actual root package.json
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "../package.json" &&
    context.originModulePath &&
    context.originModulePath.includes("@superwall/react-native-superwall") &&
    context.originModulePath.includes("/lib/module/")
  ) {
    const pkgPath = path.resolve(
      path.dirname(context.originModulePath),
      "../../package.json"
    );
    if (fs.existsSync(pkgPath)) {
      return { type: "sourceFile", filePath: pkgPath };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
