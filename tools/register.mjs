/** Registers the TypeScript resolve hook. Used via `node --import`. */
import { registerHooks } from 'node:module'
import { resolve } from './ts-resolve.mjs'

registerHooks({ resolve })
