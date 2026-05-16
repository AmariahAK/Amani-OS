/**
 * Vite ESM shim for the CJS-only `partial-json` package (used by @mariozechner/pi-ai).
 * Relative import avoids Vite aliasing `partial-json/*` to this file.
 */
import * as mod from "../../node_modules/partial-json/dist/index.js";

type Pkg = {
  parse: (json: string, allowPartial?: number) => unknown;
  parseJSON: (json: string, allowPartial?: number) => unknown;
  Allow: Record<string, number>;
  PartialJSON: new (message?: string) => Error;
  MalformedJSON: new (message?: string) => Error;
};

function load(): Pkg {
  const m = mod as unknown as Pkg & { default?: Pkg };
  if (typeof m.parse === "function") return m;
  if (m.default && typeof m.default.parse === "function") return m.default;
  throw new Error("partial-json shim: could not load parse export");
}

const pkg = load();

export const parse = pkg.parse;
export const parseJSON = pkg.parseJSON;
export const Allow = pkg.Allow;
export const PartialJSON = pkg.PartialJSON;
export const MalformedJSON = pkg.MalformedJSON;
export default pkg;
