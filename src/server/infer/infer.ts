import {
  BOOLEAN_FIELD_TYPES,
  defaultFieldOptions,
  NOW_QUERY_DEFAULT_LIMIT,
  NUMERIC_FIELD_TYPES,
  type Field,
  type FieldOptions,
  type FieldType,
} from "../lib/types.ts";

export type InferResult = {
  fields: Field[];
  /** Human-readable notes about assumptions made while inferring. */
  notes: string[];
  detected: "json" | "typescript" | "sql";
};

/* ------------------------------------------------------------------ *
 * Name + value heuristics
 * ------------------------------------------------------------------ */

type ValueKind = "string" | "number" | "boolean" | "unknown";

/** name pattern -> field type, most specific first. */
const NAME_RULES: [RegExp, FieldType][] = [
  // Names are normalized to lowercase words first, so "traceId" and
  // "trace_id" both arrive here as "trace id".

  // observability
  [/^(http ?status|status ?code|response ?code)$/, "httpStatus"],
  [/^log ?level$/, "logLevel"],
  [/(latency|response ?time|elapsed ?ms|duration ?ms)/, "latencyMs"],
  [/^trace ?id$/, "traceId"],
  [/^span ?id$/, "spanId"],
  [/^traceparent$/, "traceparent"],
  [/(stack ?trace|stacktrace)/, "stackTrace"],
  [/^(semver|version|app ?version|release)$/, "semver"],
  [/(commit ?sha|commit ?hash|git ?sha|^sha$)/, "gitSha"],
  [/^(branch|git ?branch)$/, "gitBranch"],
  [/(commit ?message)/, "gitCommitMessage"],
  [/^cve( ?id)?$/, "cveId"],
  [/(cron)/, "cronExpression"],
  [/^(pod|pod ?name)$/, "k8sPod"],
  [/^namespace$/, "k8sNamespace"],
  [/^(file ?name|filename)$/, "fileName"],
  [/(file ?ext|extension)/, "fileExtension"],
  [/(file ?size|size ?bytes|^bytes$)/, "fileSizeBytes"],

  // finance
  [/^(bic|swift( ?code)?)$/, "bic"],
  [/(routing ?number|^aba$)/, "routingNumber"],
  [/^(ticker|ticker ?symbol)$/, "tickerSymbol"],
  [/^isin$/, "isin"],
  [/^cusip$/, "cusip"],
  [/^(mcc|merchant ?category( ?code)?)$/, "merchantCategoryCode"],
  [/(card ?brand|card ?type|card ?issuer)/, "cardBrand"],
  [/(card ?expiry|expiry ?date|exp ?date|expiration ?date)/, "cardExpiry"],
  [/^(cvv|cvc|card ?cvv)$/, "cardCvv"],
  [/(crypto ?address|wallet ?address|btc ?address|eth ?address)/, "cryptoAddress"],
  [/(transaction ?amount|transaction ?value)/, "transactionAmount"],
  [/(transaction ?type)/, "transactionType"],

  // commerce
  [/^upc$/, "upc"],
  [/^(ean|ean ?13)$/, "ean"],
  [/^isbn$/, "isbn"],
  [/(tracking ?number|tracking ?code)/, "trackingNumber"],
  [/^(carrier|shipping ?carrier)$/, "shippingCarrier"],
  [/(order ?status|fulfilment ?status|fulfillment ?status)/, "orderStatus"],
  [/(discount ?percent|discount ?pct|discount ?rate)/, "discountPercent"],
  [/^(qty|quantity|units)$/, "quantity"],

  // auth & saas
  [/(api ?key|access ?key|secret ?key)/, "apiKey"],
  [/^(jwt|id ?token|access ?token|bearer ?token)$/, "jwt"],
  [/(password ?hash|hashed ?password|pw ?hash)/, "passwordHash"],
  [/^(otp|otp ?code|verification ?code|mfa ?code)$/, "otpCode"],
  [/^(session ?id|sid)$/, "sessionId"],
  [/^(scope|scopes|oauth ?scopes)$/, "oauthScopes"],
  [/^(tenant ?id|org ?id|organi[sz]ation ?id|workspace ?id)$/, "tenantId"],
  [/^(role|roles)$/, "roleName"],
  [/^(plan|tier|plan ?tier|subscription ?tier)$/, "planTier"],
  [/^(seats?|seat ?count|licenses)$/, "seatCount"],

  // network
  [/^cidr$/, "cidr"],
  [/^port$/, "port"],
  [/(subnet|netmask)/, "subnetMask"],
  [/^fqdn$/, "fqdn"],
  [/(dns ?record|record ?type)/, "dnsRecordType"],
  [/^(asn|as ?number)$/, "asn"],
  [/(private ?ip|internal ?ip)/, "privateIpv4"],

  // device
  [/^imei$/, "imei"],
  [/(device ?model|device ?name)/, "deviceModel"],
  [/^(os|os ?name|platform)$/, "osName"],
  [/(os ?version)/, "osVersion"],
  [/(screen|resolution)/, "screenResolution"],
  [/(battery)/, "batteryLevel"],
  [/(push ?token|device ?token)/, "pushToken"],

  // government
  [/^(ssn|social ?security( ?number)?)$/, "ssn"],
  [/^ein$/, "ein"],
  [/(passport)/, "passportNumber"],
  [/(drivers? ?licen[sc]e|^dl ?number$)/, "driversLicense"],
  [/^vin$/, "vin"],
  [/(licen[sc]e ?plate|plate ?number)/, "licensePlate"],
  [/^(tax ?id|vat( ?number)?)$/, "taxId"],

  // health
  [/(icd ?10|diagnosis ?code)/, "icd10Code"],
  [/^npi( ?number)?$/, "npiNumber"],
  [/^(mrn|medical ?record( ?number)?)$/, "medicalRecordNumber"],
  [/(blood ?type|blood ?group)/, "bloodType"],
  [/^(drug|drug ?name|medication)$/, "drugName"],
  [/^(dosage|dose)$/, "dosage"],

  // content
  [/^(markdown|md|body ?md)$/, "markdown"],
  [/^(html|html ?body|html ?content)$/, "htmlFragment"],
  [/^headline$/, "headline"],
  [/^(tags?|keywords?)$/, "tagList"],
  [/(reading ?time)/, "readingTime"],
  [/(image ?url|photo ?url|banner ?url|cover ?url)/, "imageUrl"],

  // analytics
  [/(embedding|^vector$)/, "embedding"],
  [/^(class|class ?label|target ?label)$/, "classLabel"],

  // flavor
  [/(flight ?number)/, "flightNumber"],
  [/(airport( ?code)?)/, "airportCode"],
  [/^airline$/, "airlineName"],
  [/^(seat|seat ?number)$/, "seatNumber"],

  // servicenow
  [/^sys ?id$/, "sysId"],
  [/^sys ?class ?name$/, "sysClassName"],

  [/^(first ?name|given ?name|fname)$/, "firstName"],
  [/^(last ?name|surname|family ?name|lname)$/, "lastName"],
  [/^(full ?name|display ?name|contact ?name)$/, "fullName"],
  [/(user ?name|^handle$|^login$|^nick)/, "username"],
  [/(e?mail)/, "email"],
  [/(phone|mobile|^tel$|telephone|^cell$)/, "phone"],
  [/(avatar|profile ?(pic|image|photo)|^photo$|^image ?url$|thumbnail)/, "avatarUrl"],
  [/(job ?title|occupation|^position$)/, "jobTitle"],
  [/^(bio|about|about ?me)$/, "bio"],
  [/(birth ?d(ate|ay)|^dob$)/, "birthDate"],
  [/^age$/, "age"],

  [/(street ?(address|name)?|address ?(line ?)?1?$)/, "streetAddress"],
  [/^(address|full ?address|mailing ?address)$/, "fullAddress"],
  [/^(city|town|locality)$/, "city"],
  [/^(state|province|region)$/, "state"],
  [/(zip|postal ?code|postcode)/, "zipCode"],
  [/^(country ?code|iso ?country)$/, "countryCode"],
  [/^country$/, "country"],
  [/^(lat|latitude)$/, "latitude"],
  [/^(lng|lon|long|longitude)$/, "longitude"],
  [/(time ?zone|^tz$)/, "timezone"],

  [/(^url$|website|homepage|^link$|^href$|_url$)/, "url"],
  [/(domain|hostname|^host$)/, "domain"],
  [/(^ip$|ip ?address|ipv4|client ?ip)/, "ipv4"],
  [/(mac ?address)/, "macAddress"],
  [/(password|passwd|^pwd$|password ?hash)/, "password"],
  [/^slug$/, "slug"],
  [/(user ?agent)/, "userAgent"],
  [/(colou?r)/, "hexColor"],
  [/(mime ?type|content ?type)/, "mimeType"],
  [/(file ?path|^path$|file ?name)/, "filePath"],

  [/(company|organi[sz]ation|^org$|employer|vendor|merchant|brand)/, "companyName"],
  [/^(department|team|division)$/, "department"],
  [/(product ?name|item ?name)/, "productName"],
  [/(product ?description)/, "productDescription"],
  [/(^sku$|barcode|upc)/, "sku"],
  [/(price|amount|cost|total|subtotal|salary|balance|revenue|^fee$|payment)/, "price"],
  [/(currency)/, "currencyCode"],
  [/(credit ?card|card ?number)/, "creditCardNumber"],
  [/^iban$/, "iban"],
  [/(account ?number|routing)/, "accountNumber"],

  [/(description|summary|^notes?$|comment|^content$|^body$|message|^text$|excerpt)/, "paragraph"],
  [/^(title|subject|headline|label|heading)$/, "sentence"],

  [/(expires?|expiry|due ?(date|at)|scheduled|renew)/, "futureDate"],
  [/(created|updated|deleted|modified|published|last ?seen|logged ?in|(^|\s)at$|timestamp)/, "recentDate"],
  [/(^date$|(^|\s)date$|^time$)/, "date"],

  [/^(is|has|can|should|allow|enable)/, "boolean"],
  [/(active|enabled|verified|deleted|archived|published|completed|subscribed|admin)$/, "boolean"],

  [/(count$|quantity|^qty$|^num|number ?of|views|likes|stock|inventory)/, "integer"],
  [/(score|rating|percent|ratio|weight|height|discount)/, "float"],

  [/(^|\s)name$/, "fullName"],
  [/^(status|state|type|kind|category|tier|plan|level|role|severity|priority|stage)$/, "enum"],
  [/^(gender|sex)$/, "gender"],
  [/((^|\s)uu?id$|^guid$)/, "uuid"],
  [/(^|\s)id$/, "uuid"],
];

function normalizeName(name: string): string {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
}

function matchesKind(type: FieldType, kind: ValueKind): boolean {
  if (kind === "unknown") return true;
  if (kind === "number") return NUMERIC_FIELD_TYPES.has(type);
  if (kind === "boolean") return BOOLEAN_FIELD_TYPES.has(type);
  // Strings accept everything except pure-number/boolean generators.
  return !NUMERIC_FIELD_TYPES.has(type) && !BOOLEAN_FIELD_TYPES.has(type);
}

/** Recognizes well-known string shapes straight from a sample value. */
function typeFromStringValue(value: string): FieldType | null {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return "uuid";
  if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(value)) return "email";
  if (/^https?:\/\/\S+$/i.test(value)) return "url";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return "ipv4";
  if (/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(value)) return "macAddress";
  if (/^#[0-9a-f]{3,8}$/i.test(value)) return "hexColor";
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return "date";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
  if (/^[0-9a-f]{24}$/i.test(value)) return "objectId";
  return null;
}

function defaultOptions(type: FieldType, sample?: unknown): FieldOptions | undefined {
  switch (type) {
    case "integer":
      return { min: 0, max: 1000 };
    case "float":
      return { min: 0, max: 100, decimals: 2 };
    case "price":
      return { min: 1, max: 1000, decimals: 2 };
    case "age":
      return { min: 18, max: 80 };
    case "boolean":
      return { truePercent: 50 };
    case "date":
    case "pastDate":
    case "futureDate":
    case "recentDate":
      return {
        format: typeof sample === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sample) ? "date" : "iso",
      };
    case "birthDate":
      return { format: "date" };
    case "enum":
      return { values: typeof sample === "string" && sample ? [sample, "pending", "archived"] : ["active", "pending", "archived"] };
    case "array":
      return { arrayOf: "word", min: 1, max: 3 };
    case "nowQuery":
      return { table: "incident", query: "", limit: NOW_QUERY_DEFAULT_LIMIT };
    case "words":
      return { min: 2, max: 5 };
    default: {
      // Everything else takes the same starting options the editor gives a
      // freshly picked type, so an inferred latency column is already
      // log-normal rather than a flat 0-1000.
      const defaults = defaultFieldOptions(type);
      return Object.keys(defaults).length ? defaults : undefined;
    }
  }
}

let idCounter = 0;
function newId(): string {
  return `f${Date.now().toString(36)}${(idCounter++).toString(36)}`;
}

export function makeField(name: string, type: FieldType, extra: Partial<Field> = {}): Field {
  return {
    id: newId(),
    name,
    type,
    options: defaultOptions(type),
    ...extra,
  };
}

/** The heuristic core: pick the most plausible field type for a name + sample. */
export function inferType(name: string, kind: ValueKind = "unknown", sample?: unknown): FieldType {
  const normalized = normalizeName(name);

  // A concrete string sample is the strongest signal we have.
  if (typeof sample === "string") {
    const byValue = typeFromStringValue(sample);
    // `id`-ish names still win over a generic date/url shape match.
    if (byValue) {
      if (byValue === "uuid" || byValue === "email" || byValue === "objectId") return byValue;
      const byName = NAME_RULES.find(([re]) => re.test(normalized))?.[1];
      if (byName && matchesKind(byName, kind) && byName !== "uuid") return byName;
      return byValue;
    }
  }

  for (const [pattern, type] of NAME_RULES) {
    if (!pattern.test(normalized)) continue;
    if (!matchesKind(type, kind)) continue;
    // An `id` column holding a number is a counter, not a UUID.
    if (type === "uuid" && kind === "number") return "autoIncrement";
    return type;
  }

  if (kind === "number") return Number.isInteger(sample) || sample === undefined ? "integer" : "float";
  if (kind === "boolean") return "boolean";
  return "words";
}

/* ------------------------------------------------------------------ *
 * JSON
 * ------------------------------------------------------------------ */

function kindOf(value: unknown): ValueKind {
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

function inferFromObject(obj: Record<string, unknown>, prefix: string, out: Field[], notes: string[]): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      inferFromObject(value as Record<string, unknown>, path, out, notes);
      continue;
    }

    if (Array.isArray(value)) {
      const first = value[0];
      if (first !== null && typeof first === "object" && !Array.isArray(first)) {
        notes.push(`"${path}" is an array of objects — inferred as nested fields for a single element.`);
        inferFromObject(first as Record<string, unknown>, path, out, notes);
        continue;
      }
      let elementType = inferType(key, kindOf(first), first);
      // Short sample strings are tag-like; a lorem phrase would misrepresent them.
      if (elementType === "words" && typeof first === "string" && first.length <= 20) elementType = "word";
      out.push(
        makeField(path, "array", {
          options: { arrayOf: elementType, min: 1, max: Math.max(2, value.length || 2) },
        }),
      );
      continue;
    }

    const type = inferType(key, kindOf(value), value ?? undefined);
    const field = makeField(path, type, { options: defaultOptions(type, value) });
    if (value === null) field.nullPercent = 15;
    if (type === "uuid" || type === "autoIncrement") field.unique = true;
    if (type === "email") field.unique = true;
    out.push(field);
  }
}

function inferFromJson(input: string): InferResult {
  const parsed = JSON.parse(input);
  const notes: string[] = [];
  const fields: Field[] = [];

  const sample = Array.isArray(parsed) ? parsed[0] : parsed;
  if (Array.isArray(parsed)) {
    notes.push(`Input was an array — used the first of ${parsed.length} item(s) as the shape.`);
  }
  if (sample === null || typeof sample !== "object") {
    throw new Error("Expected a JSON object, or an array of objects.");
  }

  // Enum candidates: when the input is an array, collect the distinct values
  // of short string columns so enums get real options instead of placeholders.
  inferFromObject(sample as Record<string, unknown>, "", fields, notes);

  if (Array.isArray(parsed) && parsed.length > 1) {
    for (const field of fields) {
      if (field.type !== "enum" || field.name.includes(".")) continue;
      const distinct = [
        ...new Set(
          parsed
            .map(row => (row && typeof row === "object" ? (row as Record<string, unknown>)[field.name] : undefined))
            .filter((v): v is string => typeof v === "string"),
        ),
      ];
      if (distinct.length) field.options = { values: distinct };
    }
  }

  return { fields, notes, detected: "json" };
}

/* ------------------------------------------------------------------ *
 * TypeScript interfaces / types
 * ------------------------------------------------------------------ */

/** Splits a brace body into top-level members, respecting nesting. */
function splitMembers(body: string): string[] {
  const members: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "{" || char === "[" || char === "(" || char === "<") depth++;
    if (char === "}" || char === "]" || char === ")" || char === ">") depth--;
    if (depth === 0 && (char === ";" || char === "," || char === "\n")) {
      members.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  members.push(current);
  return members.map(m => m.trim()).filter(Boolean);
}

function matchBody(source: string, openIndex: number): { body: string; end: number } | null {
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return { body: source.slice(openIndex + 1, i), end: i };
    }
  }
  return null;
}

function tsMemberToFields(member: string, prefix: string, out: Field[], notes: string[]): void {
  const colon = member.indexOf(":");
  if (colon === -1) return;

  const rawName = member.slice(0, colon).trim();
  const nameMatch = rawName.match(/^(?:readonly\s+)?["'`]?([A-Za-z0-9_$]+)["'`]?(\?)?$/);
  if (!nameMatch) return;

  const name = nameMatch[1]!;
  const optional = Boolean(nameMatch[2]);
  const path = prefix ? `${prefix}.${name}` : name;
  let annotation = member.slice(colon + 1).trim().replace(/;$/, "").trim();

  const nullable = optional || /\|\s*(null|undefined)\b/.test(annotation);
  annotation = annotation.replace(/\|\s*(null|undefined)\b/g, "").trim();

  const push = (type: FieldType, options?: FieldOptions) => {
    const field = makeField(path, type, { options: options ?? defaultOptions(type) });
    if (nullable) field.nullPercent = 15;
    if (type === "uuid" || type === "autoIncrement") field.unique = true;
    out.push(field);
  };

  // Nested object literal
  if (annotation.startsWith("{")) {
    const inner = matchBody(annotation, 0);
    if (inner) {
      for (const sub of splitMembers(inner.body)) tsMemberToFields(sub, path, out, notes);
      return;
    }
  }

  // Array types: T[] or Array<T>
  const arrayMatch = annotation.match(/^(.*?)\[\]$/) ?? annotation.match(/^Array<(.*)>$/);
  if (arrayMatch) {
    const inner = arrayMatch[1]!.trim();
    if (inner.startsWith("{")) {
      notes.push(`"${path}" is an array of objects — inferred as nested fields for a single element.`);
      const body = matchBody(inner, 0);
      if (body) for (const sub of splitMembers(body.body)) tsMemberToFields(sub, path, out, notes);
      return;
    }
    const guessed = inner === "number" ? "integer" : inner === "boolean" ? "boolean" : inferType(name, "string");
    const elementType: FieldType = guessed === "words" ? "word" : guessed;
    push("array", { arrayOf: elementType, min: 1, max: 3 });
    return;
  }

  // String-literal unions become enums.
  if (/^["'][^"']*["'](\s*\|\s*["'][^"']*["'])+$/.test(annotation)) {
    const values = [...annotation.matchAll(/["']([^"']*)["']/g)].map(m => m[1]!);
    push("enum", { values });
    return;
  }

  const base = annotation.toLowerCase();
  if (base === "number") push(inferType(name, "number"));
  else if (base === "boolean") push(inferType(name, "boolean"));
  else if (base === "date") push(inferType(name, "string", "2024-01-01T00:00:00Z"));
  else if (base === "string") push(inferType(name, "string"));
  else {
    notes.push(`"${path}" has an unrecognized type (${annotation}) — defaulted to text.`);
    push(inferType(name, "unknown"));
  }
}

function inferFromTypeScript(input: string): InferResult {
  const notes: string[] = [];
  const fields: Field[] = [];

  const open = input.indexOf("{");
  if (open === -1) throw new Error("No interface or type body found.");
  const body = matchBody(input, open);
  if (!body) throw new Error("Unbalanced braces in the type definition.");

  for (const member of splitMembers(body.body)) tsMemberToFields(member, "", fields, notes);
  if (!fields.length) throw new Error("No properties found in the type definition.");

  return { fields, notes, detected: "typescript" };
}

/* ------------------------------------------------------------------ *
 * SQL CREATE TABLE
 * ------------------------------------------------------------------ */

const SQL_CONSTRAINT = /^(primary|foreign|unique|constraint|key|index|check|exclude)\b/i;

function sqlTypeToField(name: string, sqlType: string, modifiers: string): FieldType {
  const t = sqlType.toLowerCase();
  if (/^(serial|bigserial|smallserial)/.test(t)) return "autoIncrement";
  if (/^(uuid|uniqueidentifier)/.test(t)) return "uuid";
  if (/^(bool)/.test(t)) return inferType(name, "boolean");
  if (/^(int|bigint|smallint|tinyint|mediumint)/.test(t)) {
    if (/primary key/i.test(modifiers)) return "autoIncrement";
    return inferType(name, "number", 1);
  }
  if (/^(decimal|numeric|float|double|real|money)/.test(t)) return inferType(name, "number", 1.5);
  if (/^(timestamp|datetime)/.test(t)) {
    const type = inferType(name, "string", "2024-01-01T00:00:00Z");
    return type === "date" || type === "recentDate" || type === "futureDate" || type === "pastDate"
      ? type
      : "recentDate";
  }
  if (/^date$/.test(t)) return "date";
  if (/^time$/.test(t)) return "date";
  if (/^enum\s*\(/.test(t)) return "enum";
  if (/^(json|jsonb)/.test(t)) return "words";
  return inferType(name, "string");
}

function inferFromSql(input: string): InferResult {
  const notes: string[] = [];
  const fields: Field[] = [];

  const open = input.indexOf("(");
  if (open === -1) throw new Error("No column list found in the CREATE TABLE statement.");

  let depth = 0;
  let end = -1;
  for (let i = open; i < input.length; i++) {
    if (input[i] === "(") depth++;
    else if (input[i] === ")") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error("Unbalanced parentheses in the CREATE TABLE statement.");

  const columns: string[] = [];
  let current = "";
  depth = 0;
  for (const char of input.slice(open + 1, end)) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      columns.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  columns.push(current);

  for (const raw of columns) {
    const column = raw.trim().replace(/\s+/g, " ");
    if (!column || SQL_CONSTRAINT.test(column)) continue;

    const match = column.match(/^[`"'\[]?([A-Za-z0-9_]+)[`"'\]]?\s+([A-Za-z]+(?:\s*\([^)]*\))?)\s*(.*)$/);
    if (!match) continue;

    const [, name = "", sqlType = "", modifiers = ""] = match;
    const type = sqlTypeToField(name, sqlType, modifiers);
    const field = makeField(name, type, { options: defaultOptions(type) });

    if (type === "enum") {
      const values = [...sqlType.matchAll(/'([^']*)'/g)].map(m => m[1]!);
      if (values.length) field.options = { values };
    }
    if (/\bnot null\b/i.test(modifiers) === false && !/primary key/i.test(modifiers)) {
      field.nullPercent = 10;
    }
    if (/\b(unique|primary key)\b/i.test(modifiers) || type === "autoIncrement") {
      field.unique = true;
      field.nullPercent = 0;
    }
    // Respect VARCHAR(n) so generated text still fits the column.
    const length = Number(sqlType.match(/\((\d+)\)/)?.[1]);
    if (Number.isFinite(length) && length <= 40 && type === "words") {
      field.type = "word";
      field.options = undefined;
    }
    fields.push(field);
  }

  if (!fields.length) throw new Error("No columns found in the CREATE TABLE statement.");
  notes.push("Nullable columns were given a 10% null rate; UNIQUE / PRIMARY KEY columns generate unique values.");
  return { fields, notes, detected: "sql" };
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export function inferSchema(input: string): InferResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Paste a JSON sample, a TypeScript interface, or a CREATE TABLE statement.");

  if (/create\s+table/i.test(trimmed)) return inferFromSql(trimmed);
  if (/^(export\s+)?(interface|type)\b/i.test(trimmed) || /:\s*(string|number|boolean)\s*[;,\n}]/.test(trimmed)) {
    return inferFromTypeScript(trimmed);
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return inferFromJson(trimmed);

  throw new Error("Could not detect the format. Use JSON, a TypeScript interface, or a CREATE TABLE statement.");
}
