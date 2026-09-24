/**
 * Shared types between the server (generator, storage) and the React UI.
 */

import type { Metadata } from "./metadata";

/** Shape of the draw for a numeric field. */
export type Distribution = "uniform" | "normal" | "lognormal" | "pareto";

/** A correlated set of columns emitted from one coherent draw. */
export type BundleKind = "person" | "address" | "card" | "device" | "company";

/** How a reference field walks the pool it draws from. */
export type ReferenceMode = "random" | "cycle" | "unique";

export type FieldOptions = {
  /** integer / float / price / array length / lorem count */
  min?: number;
  max?: number;
  /** float / price */
  decimals?: number;
  /** enum: the pool of allowed values */
  values?: string[];
  /** enum: relative weights, aligned with `values`. Equal weight when absent. */
  weights?: number[];
  /** enum: where the pool comes from. Defaults to the static `values` list. */
  valuesFrom?: "list" | "script";
  /** enum: async JS body returning the choices, run once per generation. */
  script?: string;
  /** date types: ISO bounds */
  from?: string;
  to?: string;
  /** date output shape */
  format?: "iso" | "datetime" | "date" | "time" | "unix";
  /** template type: "ORD-{{number:1000-9999}}-{{word}}" */
  pattern?: string;
  /** applied to the stringified value */
  prefix?: string;
  suffix?: string;
  /** array type: the element field type */
  arrayOf?: FieldType;
  /** boolean: chance of `true`, 0-100 */
  truePercent?: number;
  /** computed: arithmetic over other numeric fields, e.g. "quantity * unit_price" */
  expression?: string;
  /** nowQuery: the table the query runs against, e.g. "incident" */
  table?: string;
  /** nowQuery: the encoded query, e.g. "active=true^priority=1" */
  query?: string;
  /** nowQuery: upper bound for the row count; the value drawn is 1..limit */
  limit?: number;

  /* ------------------------ distributions ------------------------ */

  /** numeric types: the shape of the draw. Uniform when absent. */
  distribution?: Distribution;
  /** normal: the centre. lognormal: the median, in real units. */
  mean?: number;
  /** normal: the spread. lognormal: sigma of the underlying normal. */
  stddev?: number;
  /** pareto: the tail index — smaller means a heavier tail. */
  shape?: number;

  /* -------------------- correlation & structure ------------------- */

  /** email / username / slug / initials: the field this value is built from. */
  derivesFrom?: string;
  /** bundle: which correlated column set to emit. */
  bundle?: BundleKind;
  /** object, and array with `arrayOf: "object"`: the child fields. */
  fields?: Field[];

  /** reference: the dataset drawn from. */
  refDataset?: string;
  /** reference: the column within that dataset. */
  refField?: string;
  /** reference: how rows walk the pool. */
  refMode?: ReferenceMode;
  /**
   * reference: the values themselves, loaded from that column just before
   * generation. Never edited by hand and never saved — it is filled in per run
   * so a numeric key stays a number rather than arriving as text.
   */
  refPool?: unknown[];

  /** sequentialDate: seconds between consecutive rows. */
  step?: number;
  /** sequentialDate: ± percentage of jitter applied to each step. */
  jitter?: number;
  /** sequentialDate: keep every timestamp inside Mon-Fri 09:00-17:00. */
  businessHours?: boolean;

  /** date types: the field whose timestamp this value must follow. */
  after?: string;
  /** any type: a predicate that must hold, or the value comes back null. */
  when?: string;

  /** edgeCase / apiKey / nowRecordNumber: which flavour of the type to emit. */
  variant?: string;
  /** embedding: how many dimensions the vector has. */
  dimensions?: number;
};

export type Field = {
  id: string;
  /** Dot path: "user.address.city" nests in JSON, stays flat in CSV. */
  name: string;
  type: FieldType;
  /** 0-100 chance the value comes back null. */
  nullPercent?: number;
  /** Best-effort uniqueness across the generated rows. */
  unique?: boolean;
  options?: FieldOptions;
};

/**
 * One cross-configuration link: a field in this schema takes its values from a
 * column of another configuration's data.
 *
 * Mappings live on the configuration rather than on the field because that is
 * how they are read — "what does this schema borrow, and from where" is one
 * question about the schema, not a property scattered across its fields. At
 * generation time each one is resolved against the newest dataset generated
 * from `fromConfig` and folded into the target field, which then draws from
 * that pool exactly as a `reference` field does.
 */
export type FieldMapping = {
  id: string;
  /** The field in this schema that receives the values. A name, not an id:
   *  a mapping survives the field being retyped or moved. */
  field: string;
  /** The configuration the values are drawn from. */
  fromConfig: string;
  /** That configuration's name when the mapping was written, so an export
   *  still says what it pointed at on an instance that has no such id. */
  fromConfigName?: string;
  /** The column of that configuration's newest dataset. */
  fromField: string;
  /** How rows walk the pool — the same three modes a reference field has. */
  mode: ReferenceMode;
};

export type SchemaConfig = {
  id: string;
  name: string;
  description: string;
  fields: Field[];
  /** Fields here that draw from another configuration. Empty for most. */
  mappings: FieldMapping[];
  rowCount: number;
  /** Seed for reproducible output; empty means random each run. */
  seed?: string;
  /** Faker locale for every name, address and phone in the schema. */
  locale?: string;
  /** Free-form key/value pairs: what this schema is for. */
  metadata?: Metadata;
  /** The account that owns it. Compare with your own id to know if it's yours. */
  ownerId: string;
  /** Accounts it is shared with, read-only. Only the owner is told. */
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
};

export type Dataset = {
  id: string;
  configId: string | null;
  name: string;
  rowCount: number;
  fieldCount: number;
  /** Generated data is never shared, so this is always the caller. */
  ownerId: string;
  createdAt: string;
};

export type DatasetWithRows = Dataset & { rows: Record<string, unknown>[] };

export type FieldType =
  // identity
  | "uuid"
  | "autoIncrement"
  | "objectId"
  | "nanoid"
  | "ulid"
  // person
  | "firstName"
  | "lastName"
  | "fullName"
  | "username"
  | "email"
  | "phone"
  | "avatarUrl"
  | "jobTitle"
  | "bio"
  | "gender"
  | "birthDate"
  | "age"
  | "namePrefix"
  | "zodiacSign"
  // location
  | "streetAddress"
  | "city"
  | "state"
  | "stateAbbr"
  | "zipCode"
  | "country"
  | "countryCode"
  | "latitude"
  | "longitude"
  | "timezone"
  | "fullAddress"
  | "secondaryAddress"
  | "county"
  | "direction"
  // internet
  | "url"
  | "domain"
  | "ipv4"
  | "ipv6"
  | "macAddress"
  | "password"
  | "slug"
  | "userAgent"
  | "hexColor"
  | "emoji"
  | "filePath"
  | "mimeType"
  // company & commerce
  | "companyName"
  | "department"
  | "catchPhrase"
  | "productName"
  | "productDescription"
  | "sku"
  | "price"
  | "currencyCode"
  | "creditCardNumber"
  | "iban"
  | "accountNumber"
  // text
  | "word"
  | "words"
  | "sentence"
  | "paragraph"
  // primitives
  | "integer"
  | "float"
  | "boolean"
  // dates
  | "date"
  | "pastDate"
  | "futureDate"
  | "recentDate"
  | "sequentialDate"
  // custom
  | "enum"
  | "template"
  | "array"
  | "computed"
  | "object"
  | "bundle"
  // relational
  | "reference"
  // observability
  | "httpMethod"
  | "httpStatus"
  | "logLevel"
  | "latencyMs"
  | "traceId"
  | "spanId"
  | "traceparent"
  | "stackTrace"
  | "semver"
  | "gitSha"
  | "gitBranch"
  | "gitCommitMessage"
  | "cveId"
  | "k8sPod"
  | "k8sNamespace"
  | "cronExpression"
  | "duration"
  | "fileName"
  | "fileExtension"
  // finance
  | "bic"
  | "routingNumber"
  | "tickerSymbol"
  | "isin"
  | "cusip"
  | "merchantCategoryCode"
  | "cardBrand"
  | "cardExpiry"
  | "cardCvv"
  | "cryptoAddress"
  | "transactionAmount"
  | "transactionType"
  | "currencyName"
  | "currencySymbol"
  // commerce
  | "upc"
  | "ean"
  | "isbn"
  | "trackingNumber"
  | "shippingCarrier"
  | "orderStatus"
  | "discountPercent"
  | "productAdjective"
  | "productMaterial"
  | "quantity"
  // auth & saas
  | "apiKey"
  | "jwt"
  | "passwordHash"
  | "otpCode"
  | "sessionId"
  | "oauthScopes"
  | "tenantId"
  | "roleName"
  | "planTier"
  | "seatCount"
  // network
  | "cidr"
  | "port"
  | "subnetMask"
  | "fqdn"
  | "dnsRecordType"
  | "asn"
  | "privateIpv4"
  // device
  | "imei"
  | "deviceModel"
  | "osName"
  | "osVersion"
  | "appVersion"
  | "screenResolution"
  | "batteryLevel"
  | "pushToken"
  | "carrier"
  // government
  | "ssn"
  | "ein"
  | "passportNumber"
  | "driversLicense"
  | "vin"
  | "licensePlate"
  | "taxId"
  // health
  | "icd10Code"
  | "npiNumber"
  | "medicalRecordNumber"
  | "bloodType"
  | "drugName"
  | "dosage"
  | "chemicalElement"
  | "siUnit"
  // content
  | "markdown"
  | "htmlFragment"
  | "headline"
  | "tagList"
  | "readingTime"
  | "imageUrl"
  | "fileSizeBytes"
  | "dataUri"
  // analytics
  | "embedding"
  | "classLabel"
  // flavor
  | "flightNumber"
  | "airportCode"
  | "airlineName"
  | "seatNumber"
  | "bookTitle"
  | "bookAuthor"
  | "bookGenre"
  | "foodDish"
  | "foodIngredient"
  | "musicGenre"
  | "songName"
  | "artistName"
  | "animalType"
  | "colorName"
  | "rgbColor"
  | "hslColor"
  | "databaseColumn"
  | "databaseType"
  | "databaseEngine"
  | "hackerPhrase"
  // testing
  | "edgeCase"
  // servicenow
  | "nowQuery"
  | "sysId"
  | "sysClassName"
  | "nowRecordNumber"
  | "journalEntry";

export type FieldTypeMeta = {
  type: FieldType;
  label: string;
  group: string;
  /** Option keys the editor should expose for this type. */
  opts: (keyof FieldOptions)[];
};

/** Options every numeric generator shares, so a draw can be reshaped. */
const NUMERIC_OPTS = ["min", "max", "distribution", "mean", "stddev", "shape"] as const;

export const FIELD_TYPES: FieldTypeMeta[] = [
  { type: "uuid", label: "UUID", group: "Identity", opts: [] },
  { type: "autoIncrement", label: "Auto increment", group: "Identity", opts: ["min"] },
  { type: "objectId", label: "Mongo ObjectId", group: "Identity", opts: [] },
  { type: "nanoid", label: "Nano ID", group: "Identity", opts: [] },
  { type: "ulid", label: "ULID", group: "Identity", opts: [] },

  { type: "firstName", label: "First name", group: "Person", opts: [] },
  { type: "lastName", label: "Last name", group: "Person", opts: [] },
  { type: "fullName", label: "Full name", group: "Person", opts: [] },
  { type: "username", label: "Username", group: "Person", opts: ["derivesFrom"] },
  { type: "email", label: "Email", group: "Person", opts: ["derivesFrom"] },
  { type: "phone", label: "Phone number", group: "Person", opts: [] },
  { type: "avatarUrl", label: "Avatar URL", group: "Person", opts: [] },
  { type: "jobTitle", label: "Job title", group: "Person", opts: [] },
  { type: "bio", label: "Bio", group: "Person", opts: [] },
  { type: "gender", label: "Gender", group: "Person", opts: [] },
  { type: "birthDate", label: "Birth date", group: "Person", opts: ["format"] },
  { type: "age", label: "Age", group: "Person", opts: [...NUMERIC_OPTS] },
  { type: "namePrefix", label: "Name prefix", group: "Person", opts: [] },
  { type: "zodiacSign", label: "Zodiac sign", group: "Person", opts: [] },

  { type: "streetAddress", label: "Street address", group: "Location", opts: [] },
  { type: "city", label: "City", group: "Location", opts: [] },
  { type: "state", label: "State", group: "Location", opts: [] },
  { type: "stateAbbr", label: "State abbreviation", group: "Location", opts: [] },
  { type: "zipCode", label: "Zip / postal code", group: "Location", opts: [] },
  { type: "country", label: "Country", group: "Location", opts: [] },
  { type: "countryCode", label: "Country code", group: "Location", opts: [] },
  { type: "latitude", label: "Latitude", group: "Location", opts: [] },
  { type: "longitude", label: "Longitude", group: "Location", opts: [] },
  { type: "timezone", label: "Timezone", group: "Location", opts: [] },
  { type: "fullAddress", label: "Full address", group: "Location", opts: [] },
  { type: "secondaryAddress", label: "Secondary address", group: "Location", opts: [] },
  { type: "county", label: "County", group: "Location", opts: [] },
  { type: "direction", label: "Compass direction", group: "Location", opts: [] },

  { type: "url", label: "URL", group: "Internet", opts: [] },
  { type: "domain", label: "Domain name", group: "Internet", opts: [] },
  { type: "ipv4", label: "IPv4", group: "Internet", opts: [] },
  { type: "ipv6", label: "IPv6", group: "Internet", opts: [] },
  { type: "macAddress", label: "MAC address", group: "Internet", opts: [] },
  { type: "password", label: "Password", group: "Internet", opts: ["min"] },
  { type: "slug", label: "Slug", group: "Internet", opts: ["derivesFrom"] },
  { type: "userAgent", label: "User agent", group: "Internet", opts: [] },
  { type: "hexColor", label: "Hex color", group: "Internet", opts: [] },
  { type: "emoji", label: "Emoji", group: "Internet", opts: [] },
  { type: "filePath", label: "File path", group: "Internet", opts: [] },
  { type: "mimeType", label: "MIME type", group: "Internet", opts: [] },

  { type: "companyName", label: "Company name", group: "Business", opts: [] },
  { type: "department", label: "Department", group: "Business", opts: [] },
  { type: "catchPhrase", label: "Catch phrase", group: "Business", opts: [] },
  { type: "productName", label: "Product name", group: "Business", opts: [] },
  { type: "productDescription", label: "Product description", group: "Business", opts: [] },
  { type: "sku", label: "SKU", group: "Business", opts: [] },
  { type: "price", label: "Price", group: "Business", opts: [...NUMERIC_OPTS, "decimals"] },
  { type: "currencyCode", label: "Currency code", group: "Business", opts: [] },
  { type: "creditCardNumber", label: "Credit card number", group: "Business", opts: [] },
  { type: "iban", label: "IBAN", group: "Business", opts: [] },
  { type: "accountNumber", label: "Account number", group: "Business", opts: [] },

  { type: "word", label: "Word", group: "Text", opts: ["min", "max"] },
  { type: "words", label: "Words", group: "Text", opts: ["min", "max"] },
  { type: "sentence", label: "Sentence", group: "Text", opts: ["min", "max"] },
  { type: "paragraph", label: "Paragraph", group: "Text", opts: ["min", "max"] },

  { type: "integer", label: "Integer", group: "Primitive", opts: [...NUMERIC_OPTS] },
  { type: "float", label: "Float", group: "Primitive", opts: [...NUMERIC_OPTS, "decimals"] },
  { type: "boolean", label: "Boolean", group: "Primitive", opts: ["truePercent"] },

  { type: "date", label: "Date (range)", group: "Date", opts: ["from", "to", "format", "after"] },
  { type: "pastDate", label: "Past date", group: "Date", opts: ["format", "after"] },
  { type: "futureDate", label: "Future date", group: "Date", opts: ["format", "after"] },
  { type: "recentDate", label: "Recent date", group: "Date", opts: ["format", "after"] },
  {
    type: "sequentialDate",
    label: "Sequential timestamp",
    group: "Date",
    opts: ["from", "step", "jitter", "businessHours", "format"],
  },

  { type: "enum", label: "Enum (pick one)", group: "Custom", opts: ["values", "weights", "valuesFrom", "script"] },
  { type: "template", label: "Template pattern", group: "Custom", opts: ["pattern"] },
  { type: "array", label: "Array of…", group: "Custom", opts: ["arrayOf", "fields", "min", "max"] },
  { type: "computed", label: "Calculated (formula)", group: "Custom", opts: ["expression", "decimals"] },
  { type: "object", label: "Nested object", group: "Custom", opts: ["fields"] },
  { type: "bundle", label: "Correlated bundle", group: "Custom", opts: ["bundle"] },

  { type: "reference", label: "Reference (foreign key)", group: "Relational", opts: ["refDataset", "refField", "refMode"] },

  { type: "httpMethod", label: "HTTP method", group: "Observability", opts: [] },
  { type: "httpStatus", label: "HTTP status", group: "Observability", opts: ["values", "weights"] },
  { type: "logLevel", label: "Log level", group: "Observability", opts: ["values", "weights"] },
  { type: "latencyMs", label: "Latency (ms)", group: "Observability", opts: [...NUMERIC_OPTS, "decimals"] },
  { type: "traceId", label: "Trace ID", group: "Observability", opts: [] },
  { type: "spanId", label: "Span ID", group: "Observability", opts: [] },
  { type: "traceparent", label: "W3C traceparent", group: "Observability", opts: [] },
  { type: "stackTrace", label: "Stack trace", group: "Observability", opts: ["min", "max"] },
  { type: "semver", label: "Semantic version", group: "Observability", opts: [] },
  { type: "gitSha", label: "Git commit SHA", group: "Observability", opts: [] },
  { type: "gitBranch", label: "Git branch", group: "Observability", opts: [] },
  { type: "gitCommitMessage", label: "Git commit message", group: "Observability", opts: [] },
  { type: "cveId", label: "CVE ID", group: "Observability", opts: [] },
  { type: "k8sPod", label: "Kubernetes pod", group: "Observability", opts: [] },
  { type: "k8sNamespace", label: "Kubernetes namespace", group: "Observability", opts: [] },
  { type: "cronExpression", label: "Cron expression", group: "Observability", opts: [] },
  { type: "duration", label: "Duration (ISO 8601)", group: "Observability", opts: ["min", "max"] },
  { type: "fileName", label: "File name", group: "Observability", opts: [] },
  { type: "fileExtension", label: "File extension", group: "Observability", opts: [] },

  { type: "bic", label: "BIC / SWIFT", group: "Finance", opts: [] },
  { type: "routingNumber", label: "Routing number", group: "Finance", opts: [] },
  { type: "tickerSymbol", label: "Ticker symbol", group: "Finance", opts: [] },
  { type: "isin", label: "ISIN", group: "Finance", opts: [] },
  { type: "cusip", label: "CUSIP", group: "Finance", opts: [] },
  { type: "merchantCategoryCode", label: "Merchant category code", group: "Finance", opts: [] },
  { type: "cardBrand", label: "Card brand", group: "Finance", opts: [] },
  { type: "cardExpiry", label: "Card expiry", group: "Finance", opts: [] },
  { type: "cardCvv", label: "Card CVV", group: "Finance", opts: [] },
  { type: "cryptoAddress", label: "Crypto address", group: "Finance", opts: ["variant"] },
  { type: "transactionAmount", label: "Transaction amount", group: "Finance", opts: [...NUMERIC_OPTS, "decimals"] },
  { type: "transactionType", label: "Transaction type", group: "Finance", opts: [] },
  { type: "currencyName", label: "Currency name", group: "Finance", opts: [] },
  { type: "currencySymbol", label: "Currency symbol", group: "Finance", opts: [] },

  { type: "upc", label: "UPC-A", group: "Commerce", opts: [] },
  { type: "ean", label: "EAN-13", group: "Commerce", opts: [] },
  { type: "isbn", label: "ISBN", group: "Commerce", opts: [] },
  { type: "trackingNumber", label: "Tracking number", group: "Commerce", opts: ["variant"] },
  { type: "shippingCarrier", label: "Shipping carrier", group: "Commerce", opts: [] },
  { type: "orderStatus", label: "Order status", group: "Commerce", opts: ["values", "weights"] },
  { type: "discountPercent", label: "Discount %", group: "Commerce", opts: [...NUMERIC_OPTS, "decimals"] },
  { type: "productAdjective", label: "Product adjective", group: "Commerce", opts: [] },
  { type: "productMaterial", label: "Product material", group: "Commerce", opts: [] },
  { type: "quantity", label: "Quantity", group: "Commerce", opts: [...NUMERIC_OPTS] },

  { type: "apiKey", label: "API key", group: "Auth", opts: ["variant"] },
  { type: "jwt", label: "JWT", group: "Auth", opts: [] },
  { type: "passwordHash", label: "Password hash", group: "Auth", opts: ["variant"] },
  { type: "otpCode", label: "One-time code", group: "Auth", opts: ["min"] },
  { type: "sessionId", label: "Session ID", group: "Auth", opts: [] },
  { type: "oauthScopes", label: "OAuth scopes", group: "Auth", opts: ["values", "min", "max"] },
  { type: "tenantId", label: "Tenant ID", group: "Auth", opts: [] },
  { type: "roleName", label: "Role", group: "Auth", opts: ["values", "weights"] },
  { type: "planTier", label: "Plan tier", group: "Auth", opts: ["values", "weights"] },
  { type: "seatCount", label: "Seat count", group: "Auth", opts: [...NUMERIC_OPTS] },

  { type: "cidr", label: "CIDR block", group: "Network", opts: [] },
  { type: "port", label: "Port", group: "Network", opts: [...NUMERIC_OPTS] },
  { type: "subnetMask", label: "Subnet mask", group: "Network", opts: [] },
  { type: "fqdn", label: "Hostname (FQDN)", group: "Network", opts: [] },
  { type: "dnsRecordType", label: "DNS record type", group: "Network", opts: [] },
  { type: "asn", label: "AS number", group: "Network", opts: [...NUMERIC_OPTS] },
  { type: "privateIpv4", label: "Private IPv4", group: "Network", opts: [] },

  { type: "imei", label: "IMEI", group: "Device", opts: [] },
  { type: "deviceModel", label: "Device model", group: "Device", opts: [] },
  { type: "osName", label: "OS name", group: "Device", opts: [] },
  { type: "osVersion", label: "OS version", group: "Device", opts: [] },
  { type: "appVersion", label: "App version", group: "Device", opts: [] },
  { type: "screenResolution", label: "Screen resolution", group: "Device", opts: [] },
  { type: "batteryLevel", label: "Battery level", group: "Device", opts: [...NUMERIC_OPTS] },
  { type: "pushToken", label: "Push token", group: "Device", opts: [] },
  { type: "carrier", label: "Mobile carrier", group: "Device", opts: [] },

  { type: "ssn", label: "SSN (reserved range)", group: "Government", opts: [] },
  { type: "ein", label: "EIN", group: "Government", opts: [] },
  { type: "passportNumber", label: "Passport number", group: "Government", opts: [] },
  { type: "driversLicense", label: "Driver's licence", group: "Government", opts: [] },
  { type: "vin", label: "VIN", group: "Government", opts: [] },
  { type: "licensePlate", label: "Licence plate", group: "Government", opts: [] },
  { type: "taxId", label: "Tax ID", group: "Government", opts: [] },

  { type: "icd10Code", label: "ICD-10 code", group: "Health", opts: [] },
  { type: "npiNumber", label: "NPI number", group: "Health", opts: [] },
  { type: "medicalRecordNumber", label: "Medical record number", group: "Health", opts: [] },
  { type: "bloodType", label: "Blood type", group: "Health", opts: [] },
  { type: "drugName", label: "Drug name", group: "Health", opts: [] },
  { type: "dosage", label: "Dosage", group: "Health", opts: [] },
  { type: "chemicalElement", label: "Chemical element", group: "Health", opts: [] },
  { type: "siUnit", label: "SI unit", group: "Health", opts: [] },

  { type: "markdown", label: "Markdown block", group: "Content", opts: ["min", "max"] },
  { type: "htmlFragment", label: "HTML fragment", group: "Content", opts: [] },
  { type: "headline", label: "Headline", group: "Content", opts: [] },
  { type: "tagList", label: "Tag list", group: "Content", opts: ["min", "max"] },
  { type: "readingTime", label: "Reading time (min)", group: "Content", opts: [...NUMERIC_OPTS] },
  { type: "imageUrl", label: "Image URL", group: "Content", opts: ["min", "max"] },
  { type: "fileSizeBytes", label: "File size (bytes)", group: "Content", opts: [...NUMERIC_OPTS] },
  { type: "dataUri", label: "Data URI thumbnail", group: "Content", opts: [] },

  { type: "embedding", label: "Embedding vector", group: "Analytics", opts: ["dimensions", "decimals"] },
  { type: "classLabel", label: "Class label", group: "Analytics", opts: ["values", "weights"] },

  { type: "flightNumber", label: "Flight number", group: "Flavor", opts: [] },
  { type: "airportCode", label: "Airport code", group: "Flavor", opts: [] },
  { type: "airlineName", label: "Airline", group: "Flavor", opts: [] },
  { type: "seatNumber", label: "Seat number", group: "Flavor", opts: [] },
  { type: "bookTitle", label: "Book title", group: "Flavor", opts: [] },
  { type: "bookAuthor", label: "Book author", group: "Flavor", opts: [] },
  { type: "bookGenre", label: "Book genre", group: "Flavor", opts: [] },
  { type: "foodDish", label: "Dish", group: "Flavor", opts: [] },
  { type: "foodIngredient", label: "Ingredient", group: "Flavor", opts: [] },
  { type: "musicGenre", label: "Music genre", group: "Flavor", opts: [] },
  { type: "songName", label: "Song name", group: "Flavor", opts: [] },
  { type: "artistName", label: "Artist", group: "Flavor", opts: [] },
  { type: "animalType", label: "Animal", group: "Flavor", opts: [] },
  { type: "colorName", label: "Color name", group: "Flavor", opts: [] },
  { type: "rgbColor", label: "RGB color", group: "Flavor", opts: [] },
  { type: "hslColor", label: "HSL color", group: "Flavor", opts: [] },
  { type: "databaseColumn", label: "Database column", group: "Flavor", opts: [] },
  { type: "databaseType", label: "Database type", group: "Flavor", opts: [] },
  { type: "databaseEngine", label: "Database engine", group: "Flavor", opts: [] },
  { type: "hackerPhrase", label: "Hacker phrase", group: "Flavor", opts: [] },

  { type: "edgeCase", label: "Edge case string", group: "Testing", opts: ["variant", "values"] },

  { type: "nowQuery", label: "Now query", group: "ServiceNow", opts: ["table", "query", "limit"] },
  { type: "sysId", label: "sys_id", group: "ServiceNow", opts: [] },
  { type: "sysClassName", label: "sys_class_name", group: "ServiceNow", opts: [] },
  { type: "nowRecordNumber", label: "Record number", group: "ServiceNow", opts: ["variant", "min"] },
  { type: "journalEntry", label: "Journal entry", group: "ServiceNow", opts: [] },
];

/** Rows a `nowQuery` field draws from when no limit is set. */
export const NOW_QUERY_DEFAULT_LIMIT = 10;

/** How deep `object` / `array of object` fields may nest. */
export const MAX_FIELD_DEPTH = 3;

export const FIELD_TYPE_SET = new Set<string>(FIELD_TYPES.map(f => f.type));

/** Field types whose generated value is a JS number. */
export const NUMERIC_FIELD_TYPES = new Set<FieldType>([
  "autoIncrement",
  "age",
  "latitude",
  "longitude",
  "price",
  "integer",
  "float",
  "computed",
  "httpStatus",
  "latencyMs",
  "transactionAmount",
  "discountPercent",
  "quantity",
  "seatCount",
  "port",
  "asn",
  "batteryLevel",
  "readingTime",
  "fileSizeBytes",
]);

export const BOOLEAN_FIELD_TYPES = new Set<FieldType>(["boolean"]);

/** Types that produce a timestamp, and so can be ordered against each other. */
export const DATE_FIELD_TYPES = new Set<FieldType>([
  "date",
  "pastDate",
  "futureDate",
  "recentDate",
  "birthDate",
  "sequentialDate",
]);

/** Types that spread several columns into the row instead of one value. */
export const SPREADING_FIELD_TYPES = new Set<FieldType>(["bundle", "object"]);

/** Types whose value is built from other fields, so they must run later. */
export const DERIVING_FIELD_TYPES = new Set<FieldType>(["email", "username", "slug"]);

/**
 * Whether a field yields a number a formula can use. Dates count only when
 * they are formatted as unix seconds; a prefix/suffix turns any value into a
 * string, so those are excluded.
 */
export function isNumericField(field: Field): boolean {
  if (field.options?.prefix || field.options?.suffix) return false;
  if (NUMERIC_FIELD_TYPES.has(field.type)) return true;
  return DATE_FIELD_TYPES.has(field.type) && field.options?.format === "unix";
}

export const FIELD_GROUPS = [...new Set(FIELD_TYPES.map(f => f.group))];

/** The columns a bundle spreads into the row, as suffixes of the field name. */
export const BUNDLE_COLUMNS: Record<BundleKind, string[]> = {
  person: ["first_name", "last_name", "full_name", "email", "username", "phone"],
  address: ["street", "city", "state", "state_code", "zip", "country", "country_code", "latitude", "longitude"],
  card: ["brand", "number", "last4", "expiry", "cvv"],
  device: ["model", "os", "os_version", "app_version", "screen", "carrier"],
  company: ["name", "domain", "email", "catch_phrase", "department"],
};

export const BUNDLE_LABELS: Record<BundleKind, string> = {
  person: "Person (name, email, username, phone)",
  address: "Address (street, city, state, zip, country, lat/lng)",
  card: "Payment card (brand, number, expiry, CVV)",
  device: "Device (model, OS, app version, carrier)",
  company: "Company (name, domain, email, department)",
};

/** The pools an `edgeCase` field can draw from. */
export const EDGE_CASE_VARIANTS = ["all", "text", "unicode", "injection", "numeric"] as const;

/** Options a freshly selected type starts with, so its editor is never blank. */
export function defaultFieldOptions(type: FieldType): FieldOptions {
  switch (type) {
    case "computed":
      return { decimals: 2 };
    case "nowQuery":
      return { limit: NOW_QUERY_DEFAULT_LIMIT };
    case "latencyMs":
      return { distribution: "lognormal", mean: 120, stddev: 0.9, min: 1, decimals: 0 };
    case "transactionAmount":
      return { distribution: "lognormal", mean: 48, stddev: 1.1, min: 1, decimals: 2 };
    case "quantity":
      return { distribution: "pareto", min: 1, max: 40, shape: 1.6 };
    case "seatCount":
      return { distribution: "pareto", min: 1, max: 500, shape: 1.2 };
    case "fileSizeBytes":
      return { distribution: "lognormal", mean: 120_000, stddev: 1.4, min: 1 };
    case "discountPercent":
      return { min: 0, max: 40, decimals: 0 };
    case "batteryLevel":
      return { min: 1, max: 100 };
    case "readingTime":
      return { min: 1, max: 25 };
    case "port":
      return { min: 1024, max: 65_535 };
    case "asn":
      return { min: 1, max: 400_000 };
    case "sequentialDate":
      return { step: 3600, jitter: 25, format: "iso" };
    case "reference":
      return { refMode: "random" };
    case "bundle":
      return { bundle: "person" };
    case "object":
      return { fields: [] };
    case "edgeCase":
      return { variant: "all" };
    case "embedding":
      return { dimensions: 8, decimals: 4 };
    case "classLabel":
      return { values: ["positive", "negative"], weights: [1, 9] };
    case "oauthScopes":
      return { min: 1, max: 4 };
    case "otpCode":
      return { min: 6 };
    case "nowRecordNumber":
      return { variant: "INC", min: 1_000_001 };
    default:
      return {};
  }
}

export function fieldTypeLabel(type: FieldType): string {
  return FIELD_TYPES.find(f => f.type === type)?.label ?? type;
}

/** Whether this field's choices come from a user script rather than a static list. */
export function usesChoiceScript(field: Pick<Field, "type" | "options">): boolean {
  return field.type === "enum" && field.options?.valuesFrom === "script";
}

/** Whether this field pulls its pool from a stored dataset. */
export function usesReference(field: Pick<Field, "type" | "options">): boolean {
  return field.type === "reference" && Boolean(field.options?.refDataset && field.options?.refField);
}

/**
 * Whether a mapping is complete enough to resolve. A half-filled row is kept
 * — it is someone mid-edit — but it is not carried into a generation.
 */
export function isResolvableMapping(mapping: FieldMapping): boolean {
  return Boolean(mapping.field && mapping.fromConfig && mapping.fromField);
}

/**
 * Every column the rows of a schema will actually carry, including the ones a
 * bundle or an object field spreads. This is what a mapping may point at on
 * the far side, and what the near side may attach to.
 */
export function rowColumns(fields: Field[]): string[] {
  const columns: string[] = [];
  for (const field of fields) {
    if (!field.name) continue;
    if (field.type === "bundle") {
      for (const column of BUNDLE_COLUMNS[field.options?.bundle ?? "person"]) {
        columns.push(`${field.name}.${column}`);
      }
      continue;
    }
    const children = childFields(field);
    if (children.length) {
      for (const child of children) columns.push(`${field.name}.${child.name}`);
      continue;
    }
    columns.push(field.name);
  }
  return [...new Set(columns)];
}

/** The child fields of an object, or of an array of objects. */
export function childFields(field: Pick<Field, "type" | "options">): Field[] {
  if (field.type === "object") return field.options?.fields ?? [];
  if (field.type === "array" && field.options?.arrayOf === "object") return field.options?.fields ?? [];
  return [];
}


/**
 * Locales offered in the UI. A subset of faker's ~70, chosen for coverage of
 * distinct name, address and phone shapes rather than completeness; the server
 * accepts any code faker knows, so a config file may carry one not listed here.
 */
export const LOCALES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "en_US", label: "English (United States)" },
  { code: "en_GB", label: "English (United Kingdom)" },
  { code: "en_AU", label: "English (Australia)" },
  { code: "en_CA", label: "English (Canada)" },
  { code: "en_IN", label: "English (India)" },
  { code: "de", label: "German" },
  { code: "de_AT", label: "German (Austria)" },
  { code: "de_CH", label: "German (Switzerland)" },
  { code: "fr", label: "French" },
  { code: "fr_CA", label: "French (Canada)" },
  { code: "es", label: "Spanish" },
  { code: "es_MX", label: "Spanish (Mexico)" },
  { code: "pt_BR", label: "Portuguese (Brazil)" },
  { code: "pt_PT", label: "Portuguese (Portugal)" },
  { code: "it", label: "Italian" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "nb_NO", label: "Norwegian" },
  { code: "da", label: "Danish" },
  { code: "fi", label: "Finnish" },
  { code: "pl", label: "Polish" },
  { code: "cs_CZ", label: "Czech" },
  { code: "ru", label: "Russian" },
  { code: "uk", label: "Ukrainian" },
  { code: "tr", label: "Turkish" },
  { code: "he", label: "Hebrew" },
  { code: "ar", label: "Arabic" },
  { code: "fa", label: "Persian" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh_CN", label: "Chinese (Simplified)" },
  { code: "zh_TW", label: "Chinese (Traditional)" },
  { code: "th", label: "Thai" },
  { code: "vi", label: "Vietnamese" },
  { code: "id_ID", label: "Indonesian" },
];
