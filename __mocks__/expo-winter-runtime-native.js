// No-op mock for expo/src/winter/runtime.native
// This prevents the lazy __ExpoImportMetaRegistry getter from failing in jest
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
    value: { url: 'http://localhost/' },
    configurable: true,
    writable: true,
  });
}
