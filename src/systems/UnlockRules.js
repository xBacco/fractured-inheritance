// Regole di sblocco. Ogni regola: { unlocks: 'id', requires: (runs) => boolean }
// `runs` è l'oggetto runs dello store DOPO l'incremento del run appena finito.
//
// Criterio del "run valido" e mapping degli unlock sono TBD nella spec.
// Popolare questo array quando confermati — niente refactor altrove.
//
// Esempio:
// export const UNLOCK_RULES = [
//   { unlocks: 'mira',   requires: (runs) => (runs.aetherion?.total ?? 0) >= 3 },
//   { unlocks: 'silas',  requires: (runs) => (runs.korvan?.total ?? 0) >= 3 },
// ]

export const UNLOCK_RULES = []
