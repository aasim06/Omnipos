import { PosApi, PosLicenseGate, PosSupportContact, PosUpdateApi, PosUpdateProgress } from './index';

declare global {
  interface Window {
    posApi?: PosApi;
  }
}

export type { PosApi, PosLicenseGate, PosSupportContact, PosUpdateApi, PosUpdateProgress };
