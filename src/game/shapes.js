/* =====================================================================
 * SHAPE LIBRARY — the tile silhouettes, 1 to 5 tiles.
 *
 * Each shape is a list of [row, col] offsets from its top-left corner.
 * Most are edge-connected polyominoes, but the engine treats a shape as
 * an arbitrary SET of tile offsets — nothing requires the tiles to touch —
 * so the library also holds diagonal steps (tiles meeting only at a
 * corner) and gapped clusters (tiles with an empty parcel between them).
 * Rotation, reflection, placement and both previews are all set-based, so
 * these fall out for free.
 *
 * Types share this geometry; only how strongly each type LEANS toward a
 * shape (SHAPE_WEIGHTS) and what a shape is CALLED (CARD_NAMES) vary by
 * type — both live in types.js.
 * ===================================================================== */

const SHAPES = {
  M1:[[0,0]],
  D2:[[0,0],[0,1]],
  I3:[[0,0],[0,1],[0,2]],
  L3:[[0,0],[1,0],[1,1]],
  I4:[[0,0],[0,1],[0,2],[0,3]],
  O4:[[0,0],[0,1],[1,0],[1,1]],
  T4:[[0,0],[0,1],[0,2],[1,1]],
  S4:[[0,1],[0,2],[1,0],[1,1]],
  L4:[[0,0],[1,0],[2,0],[2,1]],
  P5:[[0,0],[0,1],[1,0],[1,1],[2,0]],
  L5:[[0,0],[1,0],[2,0],[3,0],[3,1]],
  T5:[[0,0],[0,1],[0,2],[1,1],[2,1]],
  V5:[[0,0],[1,0],[2,0],[2,1],[2,2]],
  // Diagonal steps — tiles that meet only at a corner.
  X2:[[0,0],[1,1]],
  X3:[[0,0],[1,1],[2,2]],
};
