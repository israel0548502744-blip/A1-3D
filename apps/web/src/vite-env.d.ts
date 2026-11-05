/// <reference types="vite/client" />
declare module "occt-import-js" {
  interface OcctMesh {
    attributes: { position: { array: number[] }; normal?: { array: number[] } };
    index: { array: number[] };
  }
  interface OcctResult { success: boolean; meshes: OcctMesh[] }
  interface Occt { ReadStepFile(data: Uint8Array, params: unknown): OcctResult }
  const factory: (opts?: { locateFile?: (p: string) => string }) => Promise<Occt>;
  export default factory;
}
