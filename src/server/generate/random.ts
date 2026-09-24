/**
 * The seeded random source the generator draws every value from.
 *
 * `@faker-js/faker` is on ServiceNow's *unsupported* third-party list, so it
 * cannot come across. What replaces it is deliberately not a general-purpose
 * fake-data library: it is exactly the surface `generate.ts` already calls,
 * with the same property-bag shape (`r.number.int`, `r.person.firstName`), so
 * the generator ports by changing one import and one type annotation rather
 * than at 232 call sites.
 *
 * Two thirds of what faker was doing here was arithmetic and string assembly
 * over a random stream — that needs no library at all, only one PRNG. The rest
 * needed *data*, which is bundled under `./data` and swapped per locale.
 *
 * `chance` is on the supported list and would have covered `person` and
 * `address`, but mixing it in would mean two random streams and two seeding
 * mechanisms, and reproducibility is the one property this file exists to
 * guarantee. One stream, one seed.
 */

import { en } from './data/en.ts'
import type { LocaleData } from './data/shape.ts'

/** Every locale the app bundles word lists for. */
const LOCALES: Record<string, LocaleData> = { en }

/** The data a run draws from. An unknown code falls back rather than failing. */
export function localeData(locale: string | undefined): LocaleData {
    const code = (locale ?? '').trim()
    if (!code) return en
    return LOCALES[code] ?? LOCALES[code.replace('-', '_')] ?? LOCALES[code.split(/[-_]/)[0] ?? ''] ?? en
}

/** Stable 32-bit hash so a text seed maps to a reproducible numeric seed. */
export function hashSeed(seed: string): number {
    let h = 2166136261
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i)
        h = Math.imul(h, 16777619)
    }
    return h >>> 0
}

/** mulberry32 — deterministic, four lines, no dependency. */
function mulberry32(seed: number): () => number {
    let state = seed >>> 0
    return function next() {
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** faker accepts a bare count or a `{ min, max }` range wherever a length goes. */
export type Length = number | { min: number; max: number }

export type Casing = 'lower' | 'upper' | 'mixed'

const DIGITS = '0123456789'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const HEX_LOWER = '0123456789abcdef'
const HEX_UPPER = '0123456789ABCDEF'

/**
 * A handful of real user-agent strings.
 *
 * faker builds these from a grammar; a fixed pool is a fraction of the code
 * and, for a field whose only job is to look like a user agent in a log line,
 * indistinguishable in use.
 */
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0',
    'curl/8.6.0',
    'python-requests/2.31.0',
]

/** Issuer prefixes and lengths, so a generated card number passes Luhn. */
const CARD_ISSUERS: Record<string, { prefixes: string[]; length: number }> = {
    visa: { prefixes: ['4'], length: 16 },
    mastercard: { prefixes: ['51', '52', '53', '54', '55'], length: 16 },
    american_express: { prefixes: ['34', '37'], length: 15 },
    discover: { prefixes: ['6011', '65'], length: 16 },
    jcb: { prefixes: ['3528', '3538', '3556'], length: 16 },
    diners_club: { prefixes: ['300', '301', '36', '38'], length: 14 },
}

const CRON_MINUTES = ['0', '15', '30', '45', '*', '*/5', '*/10']
const CRON_HOURS = ['0', '1', '3', '6', '9', '12', '18', '*', '*/2', '*/6']
const CRON_DOM = ['*', '1', '15', '*/2']
const CRON_MONTH = ['*', '1', '6', '*/3']
const CRON_DOW = ['*', '0', '1-5', '6']

const GIT_COMMIT_VERBS = ['fix', 'add', 'remove', 'update', 'refactor', 'rename', 'bump', 'handle', 'revert', 'document']

/** Luhn check digit over a numeric body. Shared with the generator's ids. */
function luhn(digits: string): number {
    let sum = 0
    let double = true
    for (let i = digits.length - 1; i >= 0; i--) {
        let digit = Number(digits[i])
        if (double) {
            digit *= 2
            if (digit > 9) digit -= 9
        }
        sum += digit
        double = !double
    }
    return (10 - (sum % 10)) % 10
}

export class Random {
    /** The underlying stream. Reassigned by `seed()`, never read elsewhere. */
    private next: () => number

    /** The word lists this instance draws from. */
    readonly data: LocaleData

    constructor(locale?: string, seed?: number) {
        this.data = localeData(locale)
        this.next = mulberry32(seed ?? Math.floor(Math.random() * 2 ** 32))
    }

    /**
     * Restarts the stream. A number replays exactly; no argument takes a fresh
     * unpredictable seed, which is what an unseeded run wants.
     */
    seed(value?: number): void {
        this.next = mulberry32(value ?? Math.floor(Math.random() * 2 ** 32))
    }

    /* --------------------------- primitives --------------------------- */

    /** Raw draw in [0, 1). Everything else is built on this one call. */
    private unit(): number {
        return this.next()
    }

    private int(min: number, max: number): number {
        if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return Math.floor(min) || 0
        return Math.floor(this.unit() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min)
    }

    private pick<T>(items: readonly T[]): T {
        return items[Math.floor(this.unit() * items.length)] as T
    }

    /** A `Length` resolved to a concrete count. */
    private len(length: Length | undefined, fallback: number): number {
        if (typeof length === 'number') return Math.max(0, Math.floor(length))
        if (length && typeof length === 'object') return this.int(length.min, length.max)
        return fallback
    }

    private chars(alphabet: string, count: number): string {
        let out = ''
        for (let i = 0; i < count; i++) out += alphabet.charAt(Math.floor(this.unit() * alphabet.length))
        return out
    }

    private cased(casing: Casing | undefined, lower: string, upper: string): string {
        if (casing === 'upper') return upper
        if (casing === 'lower') return lower
        return lower + upper
    }

    /* ----------------------------- number ----------------------------- */

    readonly number = {
        int: (o: { min: number; max: number }): number => this.int(o.min, o.max),
        float: (o: { min: number; max: number; fractionDigits?: number }): number => {
            const value = this.unit() * (o.max - o.min) + o.min
            if (o.fractionDigits === undefined) return value
            const factor = 10 ** Math.min(Math.max(o.fractionDigits, 0), 10)
            return Math.round(value * factor) / factor
        },
    }

    /* ----------------------------- string ----------------------------- */

    readonly string = {
        uuid: (): string => {
            // v4 shape, drawn from the seeded stream so a seed replays it.
            const hex = this.chars(HEX_LOWER, 32).split('')
            hex[12] = '4'
            hex[16] = '89ab'.charAt(Math.floor(this.unit() * 4))
            const s = hex.join('')
            return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
        },

        nanoid: (length: Length = 21): string =>
            this.chars(`${LOWER}${UPPER}${DIGITS}_-`, this.len(length, 21)),

        ulid: (): string => {
            // Crockford base32: 10 chars of timestamp, 16 of randomness.
            const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
            let time = Date.now()
            let head = ''
            for (let i = 0; i < 10; i++) {
                head = ALPHABET.charAt(time % 32) + head
                time = Math.floor(time / 32)
            }
            return head + this.chars(ALPHABET, 16)
        },

        numeric: (o: Length | { length?: Length; allowLeadingZeros?: boolean } = 1): string => {
            const options = typeof o === 'number' || 'min' in (o as object) ? { length: o as Length } : (o as { length?: Length; allowLeadingZeros?: boolean })
            const count = this.len(options.length, 1)
            if (count <= 0) return ''
            const allowLeadingZeros = options.allowLeadingZeros !== false
            const first = allowLeadingZeros ? this.chars(DIGITS, 1) : String(this.int(1, 9))
            return first + this.chars(DIGITS, count - 1)
        },

        alpha: (o: Length | { length?: Length; casing?: Casing } = 1): string => {
            const options = typeof o === 'number' || 'min' in (o as object) ? { length: o as Length } : (o as { length?: Length; casing?: Casing })
            return this.chars(this.cased(options.casing, LOWER, UPPER), this.len(options.length, 1))
        },

        alphanumeric: (o: Length | { length?: Length; casing?: Casing } = 1): string => {
            const options = typeof o === 'number' || 'min' in (o as object) ? { length: o as Length } : (o as { length?: Length; casing?: Casing })
            return this.chars(this.cased(options.casing, LOWER, UPPER) + DIGITS, this.len(options.length, 1))
        },

        hexadecimal: (o: { length?: Length; casing?: Casing; prefix?: string } = {}): string => {
            const body = this.chars(o.casing === 'upper' ? HEX_UPPER : HEX_LOWER, this.len(o.length, 1))
            return `${o.prefix ?? '0x'}${body}`
        },
    }

    /* ----------------------------- helpers ----------------------------- */

    readonly helpers = {
        arrayElement: <T>(items: readonly T[]): T => this.pick(items),

        /** `count` distinct entries, in a shuffled order — faker's semantics. */
        arrayElements: <T>(items: readonly T[], count: number): T[] => {
            const pool = items.slice()
            const wanted = Math.min(Math.max(count, 0), pool.length)
            for (let i = pool.length - 1; i > 0; i--) {
                const j = this.int(0, i)
                const swap = pool[i] as T
                pool[i] = pool[j] as T
                pool[j] = swap
            }
            return pool.slice(0, wanted)
        },

        weightedArrayElement: <T>(entries: readonly { value: T; weight: number }[]): T => {
            const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0)
            if (total <= 0) return this.pick(entries).value
            let roll = this.unit() * total
            for (const entry of entries) {
                roll -= Math.max(0, entry.weight)
                if (roll <= 0) return entry.value
            }
            return entries[entries.length - 1]!.value
        },

        multiple: <T>(fn: () => T, o: { count: number }): T[] => {
            const out: T[] = []
            for (let i = 0; i < Math.max(0, o.count); i++) out.push(fn())
            return out
        },

        /** Punctuation and whitespace to hyphens; accents stripped where cheap. */
        slugify: (text: string): string =>
            text
                .normalize('NFKD')
                .replace(/[̀-ͯ]/g, '')
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-+|-+$/g, ''),
    }

    /* ---------------------------- datatype ----------------------------- */

    readonly datatype = {
        boolean: (o: { probability?: number } = {}): boolean => this.unit() < (o.probability ?? 0.5),
    }

    /* ------------------------------ date ------------------------------- */

    readonly date = {
        between: (o: { from: Date; to: Date }): Date => {
            const from = o.from.getTime()
            const to = o.to.getTime()
            return new Date(from + this.unit() * Math.max(0, to - from))
        },
        past: (o: { years?: number } = {}): Date => {
            const span = (o.years ?? 1) * 365 * 24 * 3600 * 1000
            return new Date(Date.now() - 1 - this.unit() * span)
        },
        future: (o: { years?: number } = {}): Date => {
            const span = (o.years ?? 1) * 365 * 24 * 3600 * 1000
            return new Date(Date.now() + 1 + this.unit() * span)
        },
        recent: (o: { days?: number } = {}): Date => {
            const span = (o.days ?? 1) * 24 * 3600 * 1000
            return new Date(Date.now() - 1 - this.unit() * span)
        },
        birthdate: (): Date => {
            const now = new Date()
            const year = now.getFullYear() - this.int(18, 80)
            return new Date(year, this.int(0, 11), this.int(1, 28))
        },
    }

    /* ----------------------------- person ------------------------------ */

    readonly person = {
        sexType: (): 'female' | 'male' => (this.unit() < 0.5 ? 'female' : 'male'),

        sex: (): string => this.pick(this.data.sexes),

        firstName: (sex?: string): string => {
            if (sex === 'female') return this.pick(this.data.firstNamesFemale)
            if (sex === 'male') return this.pick(this.data.firstNamesMale)
            return this.unit() < 0.5 ? this.pick(this.data.firstNamesFemale) : this.pick(this.data.firstNamesMale)
        },

        // Last names do not vary by sex in the bundled locales; the parameter
        // is accepted so call sites match faker's and stay portable.
        lastName: (_sex?: string): string => this.pick(this.data.lastNames),

        fullName: (o: { firstName?: string; lastName?: string; sex?: string } = {}): string => {
            const first = o.firstName ?? this.person.firstName(o.sex)
            const last = o.lastName ?? this.person.lastName(o.sex)
            return `${first} ${last}`
        },

        prefix: (): string => this.pick(this.data.namePrefixes),

        jobTitle: (): string =>
            `${this.pick(this.data.jobDescriptors)} ${this.pick(this.data.jobAreas)} ${this.pick(this.data.jobTypes)}`,

        bio: (): string => {
            const part = this.pick(this.data.bioParts)
            return this.unit() < 0.5 ? part : `${part}, ${this.pick(this.data.bioSupporters)}`
        },

        zodiacSign: (): string => this.pick(this.data.zodiacSigns),
    }

    /* ---------------------------- location ----------------------------- */

    readonly location = {
        city: (): string => this.pick(this.data.cities),
        state: (o: { abbreviated?: boolean } = {}): string =>
            o.abbreviated ? this.pick(this.data.stateAbbrs) : this.pick(this.data.states),
        county: (): string => this.pick(this.data.counties),
        country: (): string => this.pick(this.data.countries),
        countryCode: (): string => this.pick(this.data.countryCodes),
        zipCode: (): string => this.string.numeric({ length: 5, allowLeadingZeros: true }),
        buildingNumber: (): string => String(this.int(1, 9999)),
        streetAddress: (): string =>
            `${this.location.buildingNumber()} ${this.pick(this.data.streetNames)} ${this.pick(this.data.streetSuffixes)}`,
        secondaryAddress: (): string =>
            this.pick(this.data.secondaryAddresses).replace(/#+/g, (run) => this.chars(DIGITS, run.length)),
        direction: (): string => this.pick(this.data.directions),
        timeZone: (): string => this.pick(this.data.timeZones),
        latitude: (): number => Math.round((this.unit() * 180 - 90) * 1e4) / 1e4,
        longitude: (): number => Math.round((this.unit() * 360 - 180) * 1e4) / 1e4,
    }

    /* ------------------------------ phone ------------------------------ */

    readonly phone = {
        // `style` is accepted and ignored: the bundled formats are national.
        number: (_o: { style?: string } = {}): string =>
            this.pick(this.data.phoneFormats)
                .replace(/!/g, () => String(this.int(2, 9)))
                .replace(/#/g, () => this.chars(DIGITS, 1)),
    }

    /* ---------------------------- internet ----------------------------- */

    readonly internet = {
        domainWord: (): string => this.helpers.slugify(`${this.pick(this.data.adjectives)}-${this.pick(this.data.nouns)}`).toLowerCase(),

        domainName: (): string => `${this.internet.domainWord()}.${this.pick(this.data.domainSuffixes)}`,

        url: (): string => `https://${this.internet.domainName()}`,

        username: (o: { firstName?: string; lastName?: string } = {}): string => {
            const first = o.firstName ?? this.person.firstName()
            const last = o.lastName ?? this.person.lastName()
            const joiner = this.pick(['.', '_', ''])
            return `${this.helpers.slugify(first)}${joiner}${this.helpers.slugify(last)}${this.int(0, 99)}`
        },

        email: (o: { firstName?: string; lastName?: string } = {}): string =>
            `${this.internet.username(o)}@${this.pick(this.data.freeEmailDomains)}`,

        password: (o: { length?: number } = {}): string =>
            this.chars(`${LOWER}${UPPER}${DIGITS}!@#$%^&*`, Math.max(1, o.length ?? 15)),

        ipv4: (o: { network?: 'private-a' | 'private-b' | 'private-c' } = {}): string => {
            const octet = () => this.int(0, 255)
            switch (o.network) {
                case 'private-a':
                    return `10.${octet()}.${octet()}.${octet()}`
                case 'private-b':
                    return `172.${this.int(16, 31)}.${octet()}.${octet()}`
                case 'private-c':
                    return `192.168.${octet()}.${octet()}`
                default:
                    return `${this.int(1, 255)}.${octet()}.${octet()}.${octet()}`
            }
        },

        ipv6: (): string => {
            const groups: string[] = []
            for (let i = 0; i < 8; i++) groups.push(this.chars(HEX_LOWER, 4))
            return groups.join(':')
        },

        mac: (): string => {
            const groups: string[] = []
            for (let i = 0; i < 6; i++) groups.push(this.chars(HEX_LOWER, 2))
            return groups.join(':')
        },

        userAgent: (): string => this.pick(USER_AGENTS),

        emoji: (): string => this.pick(this.data.emojis),

        httpMethod: (): string => this.pick(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),

        jwt: (): string => {
            // Shape only — three base64url segments. Never a signed token.
            const segment = (length: number) => this.chars(`${LOWER}${UPPER}${DIGITS}-_`, length)
            return `${segment(36)}.${segment(this.int(60, 140))}.${segment(43)}`
        },
    }

    /* ----------------------------- company ----------------------------- */

    readonly company = {
        name: (): string => {
            switch (this.int(0, 2)) {
                case 0:
                    return `${this.person.lastName()} ${this.pick(this.data.legalEntityTypes)}`
                case 1:
                    return `${this.person.lastName()} - ${this.person.lastName()}`
                default:
                    return `${this.person.lastName()}, ${this.person.lastName()} and ${this.person.lastName()}`
            }
        },

        catchPhrase: (): string =>
            `${this.pick(this.data.companyAdjectives)} ${this.pick(this.data.companyDescriptors)} ${this.pick(this.data.companyNouns)}`,

        buzzPhrase: (): string =>
            `${this.pick(this.data.buzzVerbs)} ${this.pick(this.data.buzzAdjectives)} ${this.pick(this.data.buzzNouns)}`,
    }

    /* ---------------------------- commerce ----------------------------- */

    readonly commerce = {
        department: (): string => this.pick(this.data.departments),
        productName: (): string =>
            `${this.pick(this.data.productAdjectives)} ${this.pick(this.data.productMaterials)} ${this.pick(this.data.productNames)}`,
        productAdjective: (): string => this.pick(this.data.productAdjectives),
        productMaterial: (): string => this.pick(this.data.productMaterials),
        productDescription: (): string => this.pick(this.data.productDescriptions),
        isbn: (): string => {
            // ISBN-13: 978 prefix plus a modulo-10 check over alternating 1/3.
            const body = `978${this.string.numeric({ length: 9, allowLeadingZeros: true })}`
            let sum = 0
            for (let i = 0; i < body.length; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
            return `${body}${(10 - (sum % 10)) % 10}`
        },
    }

    /* ----------------------------- finance ----------------------------- */

    readonly finance = {
        creditCardIssuer: (): string => this.pick(Object.keys(CARD_ISSUERS)),

        creditCardNumber: (o: { issuer?: string } = {}): string => {
            const issuer = CARD_ISSUERS[o.issuer ?? ''] ?? CARD_ISSUERS[this.finance.creditCardIssuer()]!
            const prefix = this.pick(issuer.prefixes)
            const body = prefix + this.chars(DIGITS, issuer.length - prefix.length - 1)
            return `${body}${luhn(body)}`
        },

        creditCardCVV: (): string => this.string.numeric({ length: 3, allowLeadingZeros: true }),

        currencyCode: (): string => this.pick(this.data.currencyCodes),
        currencyName: (): string => this.pick(this.data.currencyNames),
        currencySymbol: (): string => this.pick(this.data.currencySymbols),

        accountNumber: (): string => this.string.numeric({ length: 8, allowLeadingZeros: true }),

        routingNumber: (): string => {
            // ABA: eight digits plus a weighted 3-7-1 check digit.
            const body = this.string.numeric({ length: 8, allowLeadingZeros: true })
            const weights = [3, 7, 1, 3, 7, 1, 3, 7]
            let sum = 0
            for (let i = 0; i < 8; i++) sum += Number(body[i]) * weights[i]!
            return `${body}${(10 - (sum % 10)) % 10}`
        },

        bic: (): string =>
            `${this.string.alpha({ length: 4, casing: 'upper' })}${this.pick(this.data.countryCodes)}${this.string.alphanumeric({ length: 2, casing: 'upper' })}`,

        iban: (): string =>
            `${this.pick(this.data.countryCodes)}${this.string.numeric({ length: 2, allowLeadingZeros: true })}${this.string.alphanumeric({ length: 18, casing: 'upper' })}`,

        transactionType: (): string => this.pick(this.data.transactionTypes),

        bitcoinAddress: (): string =>
            `${this.pick(['1', '3'])}${this.chars('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz', this.int(25, 33))}`,

        ethereumAddress: (): string => `0x${this.chars(HEX_LOWER, 40)}`,
    }

    /* ------------------------------ lorem ------------------------------ */

    readonly lorem = {
        word: (): string => this.pick(this.data.loremWords),

        words: (o: Length | { min: number; max: number } = { min: 2, max: 5 }): string => {
            const count = this.len(typeof o === 'number' ? o : o, 3)
            const out: string[] = []
            for (let i = 0; i < Math.max(1, count); i++) out.push(this.lorem.word())
            return out.join(' ')
        },

        sentence: (o: { min?: number; max?: number } = {}): string => {
            const count = this.int(o.min ?? 3, Math.max(o.min ?? 3, o.max ?? 10))
            const words: string[] = []
            for (let i = 0; i < Math.max(1, count); i++) words.push(this.lorem.word())
            const text = words.join(' ')
            return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
        },

        paragraph: (): string => {
            const out: string[] = []
            for (let i = 0; i < this.int(3, 6); i++) out.push(this.lorem.sentence({ min: 4, max: 12 }))
            return out.join(' ')
        },

        paragraphs: (o: { min?: number; max?: number } | number = 3, separator = '\n'): string => {
            const count = typeof o === 'number' ? o : this.int(o.min ?? 1, Math.max(o.min ?? 1, o.max ?? 3))
            const out: string[] = []
            for (let i = 0; i < Math.max(1, count); i++) out.push(this.lorem.paragraph())
            return out.join(separator)
        },

        slug: (): string => {
            const out: string[] = []
            for (let i = 0; i < this.int(2, 4); i++) out.push(this.lorem.word())
            return this.helpers.slugify(out.join(' ')).toLowerCase()
        },
    }

    /* ------------------------------- word ------------------------------ */

    readonly word = {
        noun: (): string => this.pick(this.data.nouns),
        adjective: (): string => this.pick(this.data.adjectives),
        adverb: (): string => this.pick(this.data.adverbs),
        verb: (): string => this.pick(this.data.verbs),
    }

    /* ------------------------------ system ----------------------------- */

    readonly system = {
        semver: (): string => `${this.int(0, 9)}.${this.int(0, 20)}.${this.int(0, 20)}`,
        mimeType: (): string => this.pick(this.data.mimeTypes),
        fileExt: (): string => this.pick(['js', 'ts', 'json', 'csv', 'pdf', 'png', 'jpg', 'txt', 'md', 'xml', 'zip', 'html']),
        fileName: (): string => `${this.lorem.slug()}.${this.system.fileExt()}`,
        commonFileName: (extension?: string): string => `${this.lorem.slug()}.${extension ?? this.system.fileExt()}`,
        filePath: (): string => `${this.pick(this.data.directoryPaths)}/${this.system.fileName()}`,
        cron: (): string =>
            `${this.pick(CRON_MINUTES)} ${this.pick(CRON_HOURS)} ${this.pick(CRON_DOM)} ${this.pick(CRON_MONTH)} ${this.pick(CRON_DOW)}`,
    }

    /* -------------------------------- git ------------------------------ */

    readonly git = {
        commitSha: (): string => this.chars(HEX_LOWER, 40),
        branch: (): string => `${this.pick(['feature', 'fix', 'chore', 'release'])}/${this.helpers.slugify(`${this.word.verb()}-${this.word.noun()}`).toLowerCase()}`,
        commitMessage: (): string => `${this.pick(GIT_COMMIT_VERBS)} ${this.word.adjective()} ${this.word.noun()}`,
    }

    /* ------------------------------ image ------------------------------ */

    readonly image = {
        url: (o: { width?: number; height?: number } = {}): string =>
            `https://picsum.photos/seed/${this.chars(`${LOWER}${DIGITS}`, 10)}/${o.width ?? 640}/${o.height ?? 480}`,
        avatar: (): string => `https://avatars.example.com/${this.chars(`${LOWER}${DIGITS}`, 16)}.jpg`,
        dataUri: (o: { width?: number; height?: number } = {}): string => {
            const width = o.width ?? 32
            const height = o.height ?? 32
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#${this.chars(HEX_LOWER, 6)}"/></svg>`
            // Deliberately not base64: there is no `btoa` on the server runtime,
            // and a URL-encoded SVG data URI is valid everywhere one is used.
            return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
        },
    }

    /* ------------------------------ color ------------------------------ */

    readonly color = {
        human: (): string => this.pick(this.data.colorNames),
        rgb: (o: { format?: 'hex' | 'css'; casing?: Casing } = {}): string => {
            if (o.format === 'css') return `rgb(${this.int(0, 255)}, ${this.int(0, 255)}, ${this.int(0, 255)})`
            const hex = this.chars(o.casing === 'upper' ? HEX_UPPER : HEX_LOWER, 6)
            return `#${hex}`
        },
        hsl: (o: { format?: 'css' } = {}): string => {
            const [h, s, l] = [this.int(0, 360), this.int(0, 100), this.int(0, 100)]
            return o.format === 'css' ? `hsl(${h}, ${s}%, ${l}%)` : `${h},${s},${l}`
        },
    }

    /* ----------------------------- database ---------------------------- */

    readonly database = {
        column: (): string => this.pick(this.data.databaseColumns),
        type: (): string => this.pick(this.data.databaseTypes),
        engine: (): string => this.pick(this.data.databaseEngines),
        mongodbObjectId: (): string => this.chars(HEX_LOWER, 24),
    }

    /* ----------------------------- science ----------------------------- */

    readonly science = {
        chemicalElement: (): { name: string } => ({ name: this.pick(this.data.chemicalElements) }),
        unit: (): { name: string; symbol: string } => {
            const index = this.int(0, this.data.siUnitNames.length - 1)
            return { name: this.data.siUnitNames[index]!, symbol: this.data.siUnitSymbols[index] ?? '' }
        },
    }

    /* ------------------------------ hacker ----------------------------- */

    readonly hacker = {
        verb: (): string => this.pick(this.data.hackerVerbs),
        noun: (): string => this.pick(this.data.hackerNouns),
        adjective: (): string => this.pick(this.data.hackerAdjectives),
        phrase: (): string =>
            `If we ${this.hacker.verb()} the ${this.pick(this.data.hackerNouns)}, we can get to the ${this.pick(this.data.hackerAbbreviations)} ${this.pick(this.data.hackerNouns)} through the ${this.pick(this.data.hackerAdjectives)} ${this.pick(this.data.hackerAbbreviations)} ${this.pick(this.data.hackerNouns)}!`,
    }

    /* ----------------------------- vehicle ----------------------------- */

    readonly vehicle = {
        manufacturer: (): string => this.pick(this.data.vehicleManufacturers),
        model: (): string => this.pick(this.data.vehicleModels),
        vin: (): string =>
            // I, O and Q are excluded from a real VIN precisely to avoid 1/0 confusion.
            this.chars('ABCDEFGHJKLMNPRSTUVWXYZ0123456789', 17),
        vrm: (): string => `${this.string.alpha({ length: 2, casing: 'upper' })}${this.string.numeric({ length: 2, allowLeadingZeros: true })}${this.string.alpha({ length: 3, casing: 'upper' })}`,
    }

    /* ----------------------------- airline ----------------------------- */

    readonly airline = {
        airline: (): { name: string; iataCode: string } => {
            const index = this.int(0, this.data.airlineNames.length - 1)
            return { name: this.data.airlineNames[index]!, iataCode: this.data.airlineCodes[index] ?? 'XX' }
        },
        airport: (): { iataCode: string } => ({ iataCode: this.pick(this.data.airportCodes) }),
        flightNumber: (o: { length?: Length } = {}): string =>
            this.string.numeric({ length: o.length ?? 4, allowLeadingZeros: false }),
        seat: (): string => `${this.int(1, 60)}${this.pick(['A', 'B', 'C', 'D', 'E', 'F'])}`,
    }

    /* ------------------------------- book ------------------------------ */

    readonly book = {
        title: (): string => this.pick(this.data.bookTitles),
        author: (): string => this.pick(this.data.bookAuthors),
        genre: (): string => this.pick(this.data.bookGenres),
    }

    /* ------------------------------- food ------------------------------ */

    readonly food = {
        dish: (): string => this.pick(this.data.foodDishes),
        ingredient: (): string => this.pick(this.data.foodIngredients),
    }

    /* ------------------------------ music ------------------------------ */

    readonly music = {
        genre: (): string => this.pick(this.data.musicGenres),
        songName: (): string => this.pick(this.data.songNames),
        artist: (): string => this.pick(this.data.artists),
    }

    /* ------------------------------ animal ----------------------------- */

    readonly animal = {
        type: (): string => this.pick(this.data.animalTypes),
    }
}

/**
 * The `Random` a run draws from, bound to its locale.
 *
 * Named for what it replaces: `fakerFor()` was the one place `generate.ts`
 * chose its source, and keeping the seam there is what let the rest of the
 * file port untouched.
 */
export function randomFor(locale: string | undefined): Random {
    return new Random(locale)
}
