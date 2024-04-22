import { Types } from 'cafe-utility'

export const getReadinessShape = {
    code: Types.isNumber,
    message: Types.isString,
    reasons: (x: any) => Types.asArray(x).map(Types.isString).every((y: boolean) => y === true),
}
