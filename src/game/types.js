/* =====================================================================
 * IMPROVEMENT TYPES — the four things the council can build.
 *
 * Everything that varies per type lives here, in ONE entry per type:
 *   hex          — the colour it paints on the board
 *   groupName    — its name in the "largest group" instruction
 *   shapeWeights — how strongly it leans toward each silhouette
 *                  (farms toward strips, lakes toward blobs, forests
 *                  toward irregular clumps, cities toward compact blocks)
 *   cardNames    — the flavour name of each shape when built as this type
 *
 * To add an improvement, add one entry here — the derived tables below
 * and every downstream consumer pick it up automatically.
 * ===================================================================== */

const TYPES = [
  { id:"farm", name:"Farm", hex:"#D07F2E", groupName:"Bread Basket",   /* ochre */
    shapeWeights:{M1:.2, D2:1,   I3:1,  L3:.4, I4:1,   O4:.15, T4:.2, S4:.2, L4:1,  P5:.1, L5:.4, T5:.1},
    cardNames:{M1:"Windmill",      D2:"Beehives",       I3:"Berry Rows",     L3:"Hop Garden",
               I4:"Grain Silo Row", O4:"Dairy Paddock",  T4:"Orchard Cross",  S4:"Terraced Paddies",
               L4:"Cattle Run",     P5:"Homestead Farm", L5:"Irrigation Boom", T5:"Vineyard Estate"} },

  { id:"lake", name:"Lake", hex:"#4A86BC", groupName:"Great Lake",     /* washed prussian */
    shapeWeights:{M1:.4, D2:.4,  I3:.2, L3:.4, I4:.15, O4:1,   T4:.2, S4:1,  L4:.2, P5:1,  L5:.1, T5:.1},
    cardNames:{M1:"Spring Pool",   D2:"Duck Pond",      I3:"Canal Reach",    L3:"Creek Bend",
               I4:"River Run",      O4:"Mill Pond",      T4:"Estuary",        S4:"Meander",
               L4:"Marina",         P5:"Deep Basin",     L5:"Long Fjord",     T5:"Delta Fork"} },

  { id:"forest", name:"Forest", hex:"#578F55", groupName:"National Park", /* verdigris */
    shapeWeights:{M1:.4, D2:.4,  I3:.4, L3:1,  I4:.1,  O4:.15, T4:1,  S4:1,  L4:.2, P5:.2, L5:.1, T5:1},
    cardNames:{M1:"Lone Oak",      D2:"Twin Pines",     I3:"Windbreak",      L3:"Copse Corner",
               I4:"Shelter Belt",   O4:"Old Growth Stand",T4:"Ranger Junction",S4:"Wild Thicket",
               L4:"Timber Reserve", P5:"Deep Woods",     L5:"Ridge Forest",   T5:"Fern Gully"} },

  { id:"city", name:"City", hex:"#8E1914", groupName:"Metropolis",     /* brick red */
    shapeWeights:{M1:.15,D2:.2,  I3:.4, L3:.2, I4:.1,  O4:1,   T4:1,  S4:.2, L4:1,  P5:1,  L5:.1, T5:.4},
    cardNames:{M1:"Corner Store",  D2:"Row Houses",     I3:"Main Street",    L3:"Bus Depot",
               I4:"High Street",    O4:"Town Square",    T4:"Civic Centre",   S4:"Terrace Blocks",
               L4:"Rail Yard",      P5:"Market District", L5:"Ring Road",      T5:"Town Hall Precinct"} },
];

/* Derived lookups — same values the game has always used, keyed by type id. */
const TYPE_HEX      = Object.fromEntries(TYPES.map(t => [t.id, t.hex]));
const TYPE_NAME     = Object.fromEntries(TYPES.map(t => [t.id, t.name]));
const TYPE_GROUP_NAME = Object.fromEntries(TYPES.map(t => [t.id, t.groupName]));
const SHAPE_WEIGHTS = Object.fromEntries(TYPES.map(t => [t.id, t.shapeWeights]));
const CARD_NAMES    = Object.fromEntries(TYPES.map(t => [t.id, t.cardNames]));
