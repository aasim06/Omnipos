import { PosApi, PosLicenseGate, PosSupportContact } from './index';

declare global {
  interface Window {
    posApi?: PosApi;
  }
}

export type { PosApi, PosLicenseGate, PosSupportContact };
