// Re-export the official in-memory AsyncStorage mock supplied by the library.
// Jest resolves this file instead of the native module, avoiding the
// "NativeModule: AsyncStorage is null" error in the test environment.
module.exports = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
