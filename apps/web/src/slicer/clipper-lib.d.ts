// Minimal typings for the parts of clipper-lib we use.
declare module "clipper-lib" {
  export interface IntPoint {
    X: number;
    Y: number;
  }
  export enum JoinType {
    jtSquare,
    jtRound,
    jtMiter,
  }
  export enum EndType {
    etClosedPolygon,
    etClosedLine,
    etOpenButt,
    etOpenSquare,
    etOpenRound,
  }
  export enum PolyType {
    ptSubject,
    ptClip,
  }
  export enum ClipType {
    ctIntersection,
    ctUnion,
    ctDifference,
    ctXor,
  }
  export enum PolyFillType {
    pftEvenOdd,
    pftNonZero,
    pftPositive,
    pftNegative,
  }
  export class PolyTree {}
  export class ClipperOffset {
    constructor(miterLimit?: number, arcTolerance?: number);
    AddPaths(paths: IntPoint[][], jt: JoinType, et: EndType): void;
    Execute(solution: IntPoint[][], delta: number): void;
  }
  export class Clipper {
    AddPaths(paths: IntPoint[][], pt: PolyType, closed: boolean): boolean;
    Execute(
      clipType: ClipType,
      solution: IntPoint[][] | PolyTree,
      subjFill?: PolyFillType,
      clipFill?: PolyFillType,
    ): boolean;
    static SimplifyPolygons(polys: IntPoint[][], fill: PolyFillType): IntPoint[][];
    static CleanPolygons(polys: IntPoint[][], distance: number): IntPoint[][];
    static OpenPathsFromPolyTree(tree: PolyTree): IntPoint[][];
    static ClosedPathsFromPolyTree(tree: PolyTree): IntPoint[][];
  }
  const ClipperLib: {
    JoinType: typeof JoinType;
    EndType: typeof EndType;
    PolyType: typeof PolyType;
    ClipType: typeof ClipType;
    PolyFillType: typeof PolyFillType;
    PolyTree: typeof PolyTree;
    ClipperOffset: typeof ClipperOffset;
    Clipper: typeof Clipper;
  };
  export default ClipperLib;
}
