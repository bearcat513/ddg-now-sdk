/**
 * Design-time only. Bundles the word lists the generator draws from.
 *
 * Runs on your laptop, never on the instance: it reads the `@faker-js/faker`
 * locale definitions that are already a dev dependency of this repo and writes
 * a capped slice of each list into `src/server/generate/data/<locale>.ts`.
 *
 * Faker itself does not run on ServiceNow's Rhino runtime — it is on the
 * unsupported list — but its *data* is plain JSON under the MIT licence, and a
 * few hundred entries per list is what makes generated values read as real
 * rather than as `word-0417`. Capping is the point: faker ships megabytes
 * across every locale, and the whole bundle has to fit in a sys_module.
 *
 *   node tools/build-locale-data.mjs
 *
 * Re-run it when you add a locale to LOCALES, and commit the output.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { allFakers } from '@faker-js/faker'

/** Locales to bundle. Each one is roughly 40 KB of source. */
const LOCALES = ['en']

/** Entries kept per list. Past this the tail adds size, not realism. */
const CAP = 300

const take = (value, cap = CAP) => {
    if (!Array.isArray(value)) return []
    const seen = new Set()
    const out = []
    for (const entry of value) {
        if (typeof entry !== 'string') continue
        const text = entry.trim()
        if (!text || seen.has(text)) continue
        seen.add(text)
        out.push(text)
        if (out.length >= cap) break
    }
    return out
}

/** person.first_name is either a flat list or one keyed by sex. */
const flatten = (value) => {
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') return Object.values(value).flat()
    return []
}

function extract(locale) {
    const d = allFakers[locale].rawDefinitions
    const en = allFakers.en.rawDefinitions
    /** Fall back to `en` for any list a locale does not define. */
    const at = (path) => {
        const walk = (root) => path.split('.').reduce((cursor, key) => cursor?.[key], root)
        return walk(d) ?? walk(en)
    }

    const currencies = (at('finance.currency') ?? []).filter((c) => c?.code)
    const elements = (at('science.chemical_element') ?? []).filter((c) => c?.name)
    const units = (at('science.unit') ?? []).filter((u) => u?.name)
    const airlines = (at('airline.airline') ?? []).filter((a) => a?.iataCode)
    const airports = (at('airline.airport') ?? []).filter((a) => a?.iataCode)
    const countryCodes = (at('location.country_code') ?? []).map((c) => c?.alpha2).filter(Boolean)

    return {
        firstNamesFemale: take(flatten(at('person.first_name.female') ?? at('person.first_name'))),
        firstNamesMale: take(flatten(at('person.first_name.male') ?? at('person.first_name'))),
        lastNames: take(flatten(at('person.last_name'))),
        namePrefixes: take(flatten(at('person.prefix')), 40),
        sexes: take(at('person.sex'), 8),
        zodiacSigns: take(at('person.western_zodiac_sign'), 12),
        jobDescriptors: take(at('person.job_descriptor'), 60),
        jobAreas: take(at('person.job_area'), 60),
        jobTypes: take(at('person.job_type'), 40),
        bioParts: take(at('person.bio_part'), 60),
        bioSupporters: take(at('person.bio_supporter'), 40),

        cities: take(at('location.city_name')),
        citySuffixes: take(at('location.city_suffix'), 40),
        states: take(at('location.state'), 80),
        stateAbbrs: take(at('location.state_abbr'), 80),
        counties: take(at('location.county'), 80),
        countries: take(at('location.country')),
        countryCodes: take(countryCodes),
        streetNames: take(at('location.street_name')),
        streetSuffixes: take(at('location.street_suffix'), 60),
        secondaryAddresses: take(at('location.secondary_address'), 20),
        directions: take(flatten(at('location.direction')), 16),
        timeZones: take(at('location.time_zone') ?? at('date.time_zone')),
        phoneFormats: take(flatten(at('phone_number.format')).concat(at('cell_phone.formats') ?? []), 20),

        loremWords: take(at('lorem.word')),
        nouns: take(at('word.noun')),
        adjectives: take(at('word.adjective')),
        adverbs: take(at('word.adverb'), 100),
        verbs: take(at('word.verb'), 150),

        companyAdjectives: take(at('company.adjective'), 80),
        companyDescriptors: take(at('company.descriptor'), 80),
        companyNouns: take(at('company.noun'), 80),
        buzzAdjectives: take(at('company.buzz_adjective'), 60),
        buzzNouns: take(at('company.buzz_noun'), 60),
        buzzVerbs: take(at('company.buzz_verb'), 60),
        legalEntityTypes: take(at('company.legal_entity_type'), 20),

        departments: take(at('commerce.department'), 40),
        productNames: take(at('commerce.product_name.product'), 60),
        productAdjectives: take(at('commerce.product_name.adjective'), 60),
        productMaterials: take(at('commerce.product_name.material'), 40),
        productDescriptions: take(at('commerce.product_description'), 60),

        databaseColumns: take(at('database.column'), 40),
        databaseTypes: take(at('database.type'), 40),
        databaseEngines: take(at('database.engine'), 20),

        currencyCodes: currencies.map((c) => c.code).slice(0, CAP),
        currencyNames: currencies.map((c) => c.name).slice(0, CAP),
        currencySymbols: [...new Set(currencies.map((c) => c.symbol).filter(Boolean))].slice(0, CAP),
        transactionTypes: take(at('finance.transaction_type'), 20),

        hackerVerbs: take(at('hacker.verb'), 40),
        hackerNouns: take(at('hacker.noun'), 40),
        hackerAdjectives: take(at('hacker.adjective'), 40),
        hackerAbbreviations: take(at('hacker.abbreviation'), 40),
        hackerIngVerbs: take(at('hacker.ingverb'), 40),

        emojis: take(flatten(at('internet.emoji')), 120),
        domainSuffixes: take(at('internet.domain_suffix'), 30),
        freeEmailDomains: take(at('internet.free_email'), 20),

        musicGenres: take(at('music.genre'), 60),
        songNames: take(at('music.song_name')),
        artists: take(at('music.artist')),

        bookTitles: take(at('book.title')),
        bookAuthors: take(at('book.author')),
        bookGenres: take(at('book.genre'), 60),

        foodDishes: take(at('food.dish')),
        foodIngredients: take(at('food.ingredient')),

        animalTypes: take(at('animal.type'), 60),
        colorNames: take(at('color.human'), 60),

        vehicleManufacturers: take(at('vehicle.manufacturer'), 60),
        vehicleModels: take(at('vehicle.model'), 60),

        mimeTypes: take(Object.keys(at('system.mime_type') ?? {}), 120),
        directoryPaths: take(at('system.directory_path'), 60),

        airlineNames: airlines.map((a) => a.name).slice(0, CAP),
        airlineCodes: airlines.map((a) => a.iataCode).slice(0, CAP),
        airportCodes: airports.map((a) => a.iataCode).slice(0, CAP),

        chemicalElements: elements.map((e) => e.name).slice(0, CAP),
        siUnitNames: units.map((u) => u.name).slice(0, CAP),
        siUnitSymbols: units.map((u) => u.symbol).slice(0, CAP),
    }
}

mkdirSync('src/server/generate/data', { recursive: true })

for (const locale of LOCALES) {
    const data = extract(locale)
    const empty = Object.entries(data)
        .filter(([, v]) => !v.length)
        .map(([k]) => k)
    if (empty.length) console.warn(`[${locale}] empty lists: ${empty.join(', ')}`)

    const body = Object.entries(data)
        .map(([key, values]) => `    ${key}: ${JSON.stringify(values)},`)
        .join('\n')

    const source = `/**
 * GENERATED by tools/build-locale-data.mjs — do not edit by hand.
 *
 * Word lists for the "${locale}" locale, derived from @faker-js/faker's locale
 * definitions (MIT). Faker itself does not run on the ServiceNow server
 * runtime; only this data came across.
 */

import type { LocaleData } from './shape'

export const ${locale}: LocaleData = {
${body}
}
`
    writeFileSync(`src/server/generate/data/${locale}.ts`, source)
    const bytes = Buffer.byteLength(source)
    console.log(`wrote src/server/generate/data/${locale}.ts (${(bytes / 1024).toFixed(1)} KB)`)
}
