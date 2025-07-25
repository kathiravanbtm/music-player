const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for web compatibility
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Add alias for web to avoid React Native internal modules
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  // Alias problematic React Native modules for web
  'react-native': 'react-native-web',
};

// Web-specific configuration
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
