/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the backend REST API once it's available, e.g. https://api.theedunest.com */
  readonly VITE_API_BASE_URL?: string;
  /** Socket.IO server URL once real-time features are available. */
  readonly VITE_SOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
