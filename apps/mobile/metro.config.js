const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Allow importing from outside the project
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Resolve packages from workspace
config.resolver.disableHierarchicalLookup = true;

// Handle @poa/shared package
config.resolver.extraNodeModules = {
  '@poa/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

module.exports = config;
