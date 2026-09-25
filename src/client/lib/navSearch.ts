/**
 * The nav's global search: one box over everything the left-hand nav lists.
 *
 * Ported from the Bun app's `lib/navSearch.ts`, minus the one list that did not
 * come across — there are no notes to search any more.
 *
 * Matching goes past the names deliberately. The thing someone remembers about
 * a schema is often not what it is called — it is the column they added, the
 * ticket number they put in its metadata, or the line of the script template
 * they are looking for — so each record is searched across the text it
 * carries, and a hit that was not on the name says which text it was, because
 * a result whose title does not contain what you typed otherwise looks like a
 * bug in the search.
 *
 * Plain case-insensitive substring matching, over lists that are tens of items
 * long, held entirely in memory. No index, no fuzzy distance, nothing to keep
 * in step with the server: what the nav is showing is what is searched.
 *
 * One thing is searched from a summary rather than from the record. The list
 * endpoint sends each configuration's field *names* but not its fields, so a
 * search reaches every column name without the nav having to load every
 * schema — and `fieldNames` is capped server-side, which is why a hit on the
 * sixtieth column of a very wide schema will only turn up once it is open.
 */

import type { Dataset } from '../../server/lib/types'
import type { ScriptTemplate } from '../../server/lib/scriptTemplate'
import type { ConfigSummary } from './api'

/** One surviving item, and why it survived when the reason is not its name. */
export type Match<T> = {
    item: T
    /** Absent when the name itself matched — the row already shows the reason. */
    hint?: string
}

export type NavResults = {
    configs: Match<ConfigSummary>[]
    templates: Match<ScriptTemplate>[]
    datasets: Match<Dataset>[]
    /** Everything that matched, across every list. */
    total: number
}

/** Characters either side of a body hit, so the snippet has some context. */
const SNIPPET_PAD = 24

export const normalizeQuery = (query: string): string => query.trim().toLowerCase()

/** The line a hit is on, trimmed to something that fits a nav row. */
function snippet(body: string, needle: string): string {
    const at = body.toLowerCase().indexOf(needle)
    const from = Math.max(0, at - SNIPPET_PAD)
    const to = Math.min(body.length, at + needle.length + SNIPPET_PAD)
    const text = body.slice(from, to).replace(/\s+/g, ' ').trim()
    return `${from > 0 ? '…' : ''}${text}${to < body.length ? '…' : ''}`
}

const has = (haystack: string | undefined, needle: string): boolean =>
    Boolean(haystack) && haystack!.toLowerCase().includes(needle)

function matchConfig(config: ConfigSummary, needle: string): Match<ConfigSummary> | null {
    if (has(config.name, needle)) return { item: config }
    if (has(config.description, needle)) return { item: config, hint: `description: ${config.description}` }

    // `fields` is populated only for the configuration that is open; the rest
    // are searched through the name list the summary carries.
    const names = config.fields?.length ? config.fields.map((field) => field.name) : (config.fieldNames ?? [])
    const field = names.find((name) => has(name, needle))
    if (field) return { item: config, hint: `field: ${field}` }

    for (const [key, value] of Object.entries(config.metadata ?? {})) {
        if (has(key, needle) || has(value, needle)) return { item: config, hint: `${key}: ${value}` }
    }

    if (has(config.locale, needle)) return { item: config, hint: `locale: ${config.locale}` }
    return null
}

/** A template matches on its name, or anywhere in the script itself. */
function matchTemplate(template: ScriptTemplate, needle: string): Match<ScriptTemplate> | null {
    if (has(template.name, needle)) return { item: template }
    if (has(template.body, needle)) return { item: template, hint: snippet(template.body, needle) }
    return null
}

function matchDataset(dataset: Dataset, needle: string): Match<Dataset> | null {
    return has(dataset.name, needle) ? { item: dataset } : null
}

/**
 * Filters every list at once. An empty query passes everything through
 * untouched, so the caller renders one code path whether or not it is
 * searching.
 */
export function searchNav(
    query: string,
    lists: { configs: ConfigSummary[]; templates: ScriptTemplate[]; datasets: Dataset[] },
): NavResults {
    const needle = normalizeQuery(query)

    if (!needle) {
        return {
            configs: lists.configs.map((item) => ({ item })),
            templates: lists.templates.map((item) => ({ item })),
            datasets: lists.datasets.map((item) => ({ item })),
            total: lists.configs.length + lists.templates.length + lists.datasets.length,
        }
    }

    // Name hits first within each list, since a match on the title is what
    // someone typing a name is looking for; ties keep the list's own order.
    const byNameFirst = <T>(matches: Match<T>[]): Match<T>[] => [
        ...matches.filter((match) => !match.hint),
        ...matches.filter((match) => match.hint),
    ]

    const hit = <T>(items: T[], test: (item: T, needle: string) => Match<T> | null): Match<T>[] =>
        byNameFirst(items.map((item) => test(item, needle)).filter((match): match is Match<T> => match !== null))

    const configs = hit(lists.configs, matchConfig)
    const templates = hit(lists.templates, matchTemplate)
    const datasets = hit(lists.datasets, matchDataset)

    return { configs, templates, datasets, total: configs.length + templates.length + datasets.length }
}
