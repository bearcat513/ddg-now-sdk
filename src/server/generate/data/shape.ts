/**
 * The shape every bundled locale file fills in.
 *
 * Kept separate from the generated files so adding a list is one edit here and
 * one in `tools/build-locale-data.mjs`, and so a locale that is missing a list
 * fails at compile time rather than handing the generator an `undefined` to
 * index into.
 */

export type LocaleData = {
    firstNamesFemale: string[]
    firstNamesMale: string[]
    lastNames: string[]
    namePrefixes: string[]
    sexes: string[]
    zodiacSigns: string[]
    jobDescriptors: string[]
    jobAreas: string[]
    jobTypes: string[]
    bioParts: string[]
    bioSupporters: string[]

    cities: string[]
    citySuffixes: string[]
    states: string[]
    stateAbbrs: string[]
    counties: string[]
    countries: string[]
    countryCodes: string[]
    streetNames: string[]
    streetSuffixes: string[]
    secondaryAddresses: string[]
    directions: string[]
    timeZones: string[]
    phoneFormats: string[]

    loremWords: string[]
    nouns: string[]
    adjectives: string[]
    adverbs: string[]
    verbs: string[]

    companyAdjectives: string[]
    companyDescriptors: string[]
    companyNouns: string[]
    buzzAdjectives: string[]
    buzzNouns: string[]
    buzzVerbs: string[]
    legalEntityTypes: string[]

    departments: string[]
    productNames: string[]
    productAdjectives: string[]
    productMaterials: string[]
    productDescriptions: string[]

    databaseColumns: string[]
    databaseTypes: string[]
    databaseEngines: string[]

    currencyCodes: string[]
    currencyNames: string[]
    currencySymbols: string[]
    transactionTypes: string[]

    hackerVerbs: string[]
    hackerNouns: string[]
    hackerAdjectives: string[]
    hackerAbbreviations: string[]
    hackerIngVerbs: string[]

    emojis: string[]
    domainSuffixes: string[]
    freeEmailDomains: string[]

    musicGenres: string[]
    songNames: string[]
    artists: string[]

    bookTitles: string[]
    bookAuthors: string[]
    bookGenres: string[]

    foodDishes: string[]
    foodIngredients: string[]

    animalTypes: string[]
    colorNames: string[]

    vehicleManufacturers: string[]
    vehicleModels: string[]

    mimeTypes: string[]
    directoryPaths: string[]

    airlineNames: string[]
    airlineCodes: string[]
    airportCodes: string[]

    chemicalElements: string[]
    siUnitNames: string[]
    siUnitSymbols: string[]
}
