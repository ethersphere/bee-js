import { z } from 'zod'

export const HexStringSchema = z
  .string()
  .regex(/^(?:0x)?[0-9a-fA-F]*$/i, 'expected hex string')
  .refine(s => s.replace(/^0x/i, '').length % 2 === 0, 'expected even-length hex string')
