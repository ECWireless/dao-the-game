import { Buffer as BrowserBuffer } from 'buffer';

const browserGlobals = globalThis as typeof globalThis & {
  Buffer?: typeof BrowserBuffer;
};

if (!browserGlobals.Buffer) {
  browserGlobals.Buffer = BrowserBuffer;
}
