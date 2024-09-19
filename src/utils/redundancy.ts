import { RedundancyLevel } from '..'

const mediumTable = [
  [94, 68, 46, 28, 14, 5, 1],
  [9, 8, 7, 6, 5, 4, 3],
]
const encMediumTable = [
  [47, 34, 23, 14, 7, 2],
  [9, 8, 7, 6, 5, 4],
]
const strongTable = [
  [104, 95, 86, 77, 69, 61, 53, 46, 39, 32, 26, 20, 15, 10, 6, 3, 1],
  [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5],
]
const encStrongTable = [
  [52, 47, 43, 38, 34, 30, 26, 23, 19, 16, 13, 10, 7, 5, 3, 1],
  [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
]
const insaneTable = [
  [92, 87, 82, 77, 73, 68, 63, 59, 54, 50, 45, 41, 37, 33, 29, 26, 22, 19, 16, 13, 10, 8, 5, 3, 2, 1],
  [31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
]
const encInsaneTable = [
  [46, 43, 41, 38, 36, 34, 31, 29, 27, 25, 22, 20, 18, 16, 14, 13, 11, 9, 8, 6, 5, 4, 2, 1],
  [31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 7],
]
const paranoidTable = [
  [
    37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9,
    8, 7, 6, 5, 4, 3, 2, 1,
  ],
  [
    90, 88, 87, 85, 84, 82, 81, 79, 77, 76, 74, 72, 71, 69, 67, 66, 64, 62, 60, 59, 57, 55, 53, 51, 49, 48, 46, 44, 41,
    39, 37, 35, 32, 30, 27, 24, 20,
  ],
]
const encParanoidTable = [
  [18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  [88, 85, 82, 79, 76, 72, 69, 66, 62, 59, 55, 51, 48, 44, 39, 35, 30, 24],
]

const tables = {
  [RedundancyLevel.MEDIUM]: [mediumTable, encMediumTable],
  [RedundancyLevel.STRONG]: [strongTable, encStrongTable],
  [RedundancyLevel.INSANE]: [insaneTable, encInsaneTable],
  [RedundancyLevel.PARANOID]: [paranoidTable, encParanoidTable],
}

/**
 * Returns an approximate multiplier for the overhead of a given redundancy level.
 * Redundancy level is a tradeoff between storage overhead and fault tolerance.
 * Use this number to estimate the amount of chunks that will be stored for a given
 * redundancy level.
 */
export function approximateOverheadForRedundancyLevel(chunks: number, level: RedundancyLevel, encrypted: boolean) {
  const tableType =
    level === RedundancyLevel.MEDIUM
      ? tables[RedundancyLevel.MEDIUM]
      : level === RedundancyLevel.STRONG
      ? tables[RedundancyLevel.STRONG]
      : level === RedundancyLevel.INSANE
      ? tables[RedundancyLevel.INSANE]
      : tables[RedundancyLevel.PARANOID]
  const table = encrypted ? tableType[1] : tableType[0]
  const [supportedChunks, parities] = table

  for (let i = 0; i < supportedChunks.length; i++) {
    if (chunks >= supportedChunks[i]) {
      return parities[i] / supportedChunks[i]
    }
  }

  return parities[parities.length - 1] / supportedChunks[supportedChunks.length - 1]
}

interface RedundancyStats {
  label: string
  value: RedundancyLevel
  errorTolerance: number
}

const medium = {
  label: 'medium',
  value: RedundancyLevel.MEDIUM,
  errorTolerance: 0.01,
}
const strong = {
  label: 'strong',
  value: RedundancyLevel.STRONG,
  errorTolerance: 0.05,
}
const insane = {
  label: 'insane',
  value: RedundancyLevel.INSANE,
  errorTolerance: 0.1,
}
const paranoid = {
  label: 'paranoid',
  value: RedundancyLevel.PARANOID,
  errorTolerance: 0.5,
}

export function getRedundancyStats(): {
  medium: RedundancyStats
  strong: RedundancyStats
  insane: RedundancyStats
  paranoid: RedundancyStats
} {
  return {
    medium,
    strong,
    insane,
    paranoid,
  }
}

export function getRedundancyStat(level?: string | RedundancyLevel): RedundancyStats {
  if (typeof level === 'string') {
    switch (level.toLowerCase()) {
      case 'medium':
        return medium
      case 'strong':
        return strong
      case 'insane':
        return insane
      case 'paranoid':
        return paranoid
      default:
        throw new Error(`Unknown redundancy level '${level}'`)
    }
  }

  switch (level) {
    case RedundancyLevel.MEDIUM:
      return medium
    case RedundancyLevel.STRONG:
      return strong
    case RedundancyLevel.INSANE:
      return insane
    case RedundancyLevel.PARANOID:
      return paranoid
    default:
      throw new Error(`Unknown redundancy level '${level}'`)
  }
}
