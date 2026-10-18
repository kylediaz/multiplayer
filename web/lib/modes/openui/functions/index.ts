import { colorFunctions } from "./colors"
import { dataFunctions } from "./data"
import { dateFunctions } from "./dates"
import { listFunctions } from "./lists"
import { numberFunctions } from "./numbers"
import { textFunctions } from "./text"

export const functions = [...listFunctions, ...numberFunctions, ...textFunctions, ...colorFunctions, ...dateFunctions, ...dataFunctions]
