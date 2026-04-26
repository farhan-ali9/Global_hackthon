/**
 * Hermes in React Native does not always expose DOMException globally.
 * Some dependencies check `instanceof DOMException` for abort handling.
 */
if (typeof globalThis.DOMException === "undefined") {
  class ReactNativeDOMException extends Error {
    constructor(message = "", name = "Error") {
      super(message);
      this.name = name;
    }
  }

  (globalThis as any).DOMException = ReactNativeDOMException;
}
