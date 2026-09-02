import { PosApi } from './index';

declare global {
  interface Window {
    posApi?: PosApi;
  }
}
