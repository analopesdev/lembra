const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
// expo-sqlite na web carrega o wa-sqlite (.wasm) como asset.
config.resolver.assetExts.push("wasm");

module.exports = config;
