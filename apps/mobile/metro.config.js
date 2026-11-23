const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
// expo-sqlite na web carrega o wa-sqlite (.wasm) como asset.
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, { input: "./global.css" });
