import { Random, hashSeed, randomFor } from "./random.ts";
import {
  BUNDLE_COLUMNS,
  childFields,
  isNumericField,
  MAX_FIELD_DEPTH,
  SPREADING_FIELD_TYPES,
  usesChoiceScript,
  NOW_QUERY_DEFAULT_LIMIT,
  type BundleKind,
  type Field,
  type FieldOptions,
  type FieldType,
  type SchemaConfig,
} from "../lib/types.ts";
import {
  evaluateCondition,
  evaluateFormula,
  parseCondition,
  parseFormula,
  type ConditionNode,
  type FormulaNode,
} from "../lib/formula.ts";
import { choiceSourceKey, resolveChoiceSource, type ChoiceResult, type ChoiceSourceOptions } from "./choices.ts";

export type Row = Record<string, unknown>;

function num(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function round(value: number, decimals: number): number {
  const digits = Math.min(Math.max(decimals, 0), 10);
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatDate(date: Date, format: FieldOptions["format"]): string | number {
  const pad = (n: number) => String(n).padStart(2, "0");
  const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const hms = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  switch (format) {
    case "date":
      return ymd;
    case "time":
      return hms;
    case "datetime":
      return `${ymd} ${hms}`;
    case "unix":
      return Math.floor(date.getTime() / 1000);
    default:
      return date.toISOString();
  }
}

/** The platform's storage format for a glide_date_time: UTC, space separated. */
function glideDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/** Reads a generated value back as a Date, whatever format it was written in. */
function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number" && Number.isFinite(value)) {
    // Below ~1e11 the number is unix seconds; above it, milliseconds.
    const parsed = new Date(Math.abs(value) < 1e11 ? value * 1000 : value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "string" && value.trim()) {
    // "YYYY-MM-DD HH:mm:ss" is not an ISO string until the space becomes a T.
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:/.test(value) ? value.replace(" ", "T") : value;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/* --------------------------- distributions --------------------------- */

/** Box-Muller, drawn from the seeded stream so a seed replays exactly. */
function standardNormal(f: Random): number {
  const u1 = Math.max(f.number.float({ min: 0, max: 1 }), Number.EPSILON);
  const u2 = f.number.float({ min: 0, max: 1 });
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

type NumberDefaults = { min: number; max: number; decimals?: number };

/**
 * Draws one number in the shape the field asks for.
 *
 * Uniform stays inside [min, max]. The skewed shapes are floored at `min` but
 * only capped when a `max` was set explicitly — clamping to a default ceiling
 * would cut off exactly the tail that makes them worth choosing.
 */
function drawNumber(f: Random, opts: FieldOptions, defaults: NumberDefaults): number {
  const min = num(opts.min, defaults.min);
  const max = num(opts.max, defaults.max);
  const decimals = num(opts.decimals, defaults.decimals ?? 0);
  const ceiling = typeof opts.max === "number" && Number.isFinite(opts.max) ? opts.max : Infinity;

  let value: number;
  switch (opts.distribution) {
    case "normal":
      value = num(opts.mean, (min + max) / 2) + num(opts.stddev, Math.abs(max - min) / 6 || 1) * standardNormal(f);
      break;
    case "lognormal":
      value = Math.max(num(opts.mean, 1), Number.EPSILON) * Math.exp(num(opts.stddev, 1) * standardNormal(f));
      break;
    case "pareto": {
      const scale = min > 0 ? min : 1;
      const shape = Math.max(num(opts.shape, 1.5), 0.05);
      // 1 - u is kept off zero so the draw stays finite.
      const u = Math.min(f.number.float({ min: 0, max: 1 }), 1 - 1e-9);
      value = scale * (1 - u) ** (-1 / shape);
      break;
    }
    default:
      return decimals > 0
        ? f.number.float({ min, max, fractionDigits: Math.min(decimals, 10) })
        : f.number.int({ min: Math.ceil(min), max: Math.floor(max) });
  }

  return round(Math.min(Math.max(value, min), ceiling), decimals);
}

function pickWeighted(f: Random, values: string[], weights?: number[]): string {
  const pool = values.filter(v => v !== "");
  if (!pool.length) return "";
  if (!weights?.length) return f.helpers.arrayElement(pool);
  const entries = pool.map((value, i) => ({ value, weight: Math.max(0, num(weights[i], 1)) }));
  // A zero total would leave nothing to roll against, which a hand-typed
  // weight list can easily produce.
  if (!entries.some(entry => entry.weight > 0)) return f.helpers.arrayElement(pool);
  return f.helpers.weightedArrayElement(entries);
}

/** A built-in weighted pool the user may override with their own values. */
function weightedPool(f: Random, opts: FieldOptions, defaults: [string, number][]): string {
  const values = opts.values?.filter(Boolean) ?? [];
  if (values.length) return pickWeighted(f, values, opts.weights);
  return f.helpers.weightedArrayElement(defaults.map(([value, weight]) => ({ value, weight })));
}

/* ----------------------------- check digits ---------------------------- */

function luhnCheckDigit(digits: string): number {
  let sum = 0;
  let double = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
}

/** UPC-A and EAN-13 share one modulo-10 scheme, differing only in phase. */
function gtinCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    // The rightmost body digit always carries the weight of 3.
    const weight = (digits.length - i) % 2 === 1 ? 3 : 1;
    sum += Number(digits[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

function alphaNumericValue(char: string): number {
  return /[0-9]/.test(char) ? Number(char) : char.toUpperCase().charCodeAt(0) - 55;
}

function isinCheckDigit(body: string): number {
  const expanded = [...body].map(alphaNumericValue).join("");
  return luhnCheckDigit(expanded);
}

function cusipCheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    let value = alphaNumericValue(body[i]!);
    if ((i + 1) % 2 === 0) value *= 2;
    sum += Math.floor(value / 10) + (value % 10);
  }
  return (10 - (sum % 10)) % 10;
}

/* --------------------------- static pools --------------------------- */

const MERCHANT_CATEGORY_CODES = [
  "5411", "5812", "5814", "5541", "5912", "5732", "4121", "4899", "7372", "5999",
  "5311", "7011", "4511", "5813", "8011", "8099", "5651", "5691", "7999", "6011",
];

const K8S_NAMESPACES = ["default", "kube-system", "monitoring", "ingress-nginx", "payments", "checkout", "identity", "search"];

const DNS_RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "PTR", "SOA"];

const SUBNET_MASKS = ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.128", "255.255.255.192", "255.255.255.240"];

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const DRUG_NAMES = [
  "Atorvastatin", "Levothyroxine", "Lisinopril", "Metformin", "Amlodipine", "Metoprolol",
  "Albuterol", "Omeprazole", "Losartan", "Gabapentin", "Sertraline", "Simvastatin",
  "Montelukast", "Rosuvastatin", "Escitalopram", "Bupropion", "Furosemide", "Pantoprazole",
];

const OS_NAMES = ["iOS", "Android", "Windows", "macOS", "Linux", "iPadOS"];

const CARRIERS = ["Verizon", "AT&T", "T-Mobile", "Vodafone", "Orange", "O2", "Telefónica", "NTT Docomo", "Rogers", "Telstra"];

const SCREEN_RESOLUTIONS = [
  "390x844", "393x852", "412x915", "360x800", "430x932", "1170x2532",
  "1920x1080", "2560x1440", "1440x900", "3840x2160", "1366x768", "2880x1800",
];

const SHIPPING_CARRIERS = ["UPS", "FedEx", "USPS", "DHL", "Royal Mail", "Canada Post", "Australia Post"];

const OAUTH_SCOPES = [
  "openid", "profile", "email", "offline_access", "read:users", "write:users",
  "read:billing", "write:billing", "admin:org", "read:projects", "write:projects", "delete:projects",
];

const SYS_CLASS_NAMES = [
  "incident", "change_request", "problem", "sc_request", "sc_task", "task",
  "cmdb_ci_server", "cmdb_ci_appl", "sys_user", "sys_user_group", "kb_knowledge",
];

/**
 * The ServiceNow choice pools.
 *
 * Each entry carries both halves of a choice: the value a record actually
 * stores — which is what an insert and the Table API see — and the label a
 * list shows. `variant: "label"` picks the second; anything else takes the
 * first. Values stay strings because that is how the platform returns every
 * field, numeric choice or not.
 *
 * Weights are there so a thousand generated incidents look like a queue rather
 * than a uniform draw: mostly moderate priority, mostly closed.
 */
type NowChoice = { value: string; label: string; weight?: number };

const INCIDENT_STATES: NowChoice[] = [
  { value: "1", label: "New", weight: 4 },
  { value: "2", label: "In Progress", weight: 5 },
  { value: "3", label: "On Hold", weight: 2 },
  { value: "6", label: "Resolved", weight: 4 },
  { value: "7", label: "Closed", weight: 6 },
  { value: "8", label: "Canceled", weight: 1 },
];

const TASK_PRIORITIES: NowChoice[] = [
  { value: "1", label: "1 - Critical", weight: 1 },
  { value: "2", label: "2 - High", weight: 3 },
  { value: "3", label: "3 - Moderate", weight: 8 },
  { value: "4", label: "4 - Low", weight: 6 },
  { value: "5", label: "5 - Planning", weight: 2 },
];

const TASK_IMPACTS: NowChoice[] = [
  { value: "1", label: "1 - High", weight: 2 },
  { value: "2", label: "2 - Medium", weight: 5 },
  { value: "3", label: "3 - Low", weight: 4 },
];

const TASK_URGENCIES: NowChoice[] = [
  { value: "1", label: "1 - High", weight: 2 },
  { value: "2", label: "2 - Medium", weight: 5 },
  { value: "3", label: "3 - Low", weight: 4 },
];

const TASK_CATEGORIES: NowChoice[] = [
  { value: "inquiry", label: "Inquiry / Help", weight: 4 },
  { value: "software", label: "Software", weight: 5 },
  { value: "hardware", label: "Hardware", weight: 4 },
  { value: "network", label: "Network", weight: 3 },
  { value: "database", label: "Database", weight: 2 },
];

const CONTACT_TYPES: NowChoice[] = [
  { value: "self-service", label: "Self-service", weight: 5 },
  { value: "email", label: "Email", weight: 4 },
  { value: "phone", label: "Phone", weight: 4 },
  { value: "chat", label: "Chat", weight: 2 },
  { value: "walk-in", label: "Walk-in", weight: 1 },
  { value: "virtual_agent", label: "Virtual Agent", weight: 2 },
];

const CHANGE_TYPES: NowChoice[] = [
  { value: "normal", label: "Normal", weight: 5 },
  { value: "standard", label: "Standard", weight: 4 },
  { value: "emergency", label: "Emergency", weight: 1 },
];

const CHANGE_RISKS: NowChoice[] = [
  { value: "2", label: "Very High", weight: 1 },
  { value: "3", label: "High", weight: 2 },
  { value: "4", label: "Moderate", weight: 5 },
  { value: "5", label: "Low", weight: 6 },
];

const APPROVAL_STATES: NowChoice[] = [
  { value: "not requested", label: "Not Yet Requested", weight: 3 },
  { value: "requested", label: "Requested", weight: 4 },
  { value: "approved", label: "Approved", weight: 6 },
  { value: "rejected", label: "Rejected", weight: 1 },
  { value: "cancelled", label: "Cancelled", weight: 1 },
];

/** Close codes are stored as their own label, so there is no pair to pick. */
const CLOSE_CODES = [
  "Solved (Work Around)",
  "Solved (Permanently)",
  "Solved Remotely (Work Around)",
  "Solved Remotely (Permanently)",
  "Not Solved (Not Reproducible)",
  "Not Solved (Too Costly)",
  "Closed/Resolved by Caller",
];

const ASSIGNMENT_GROUPS = [
  "Service Desk", "Network", "Hardware", "Software", "Database", "Application Development",
  "Change Management", "Problem Management", "Field Services", "Security Operations",
  "Incident Management", "Openspace", "CAB Approval",
];

const SHORT_DESCRIPTIONS = [
  "Unable to connect to VPN from home",
  "Email not syncing on mobile device",
  "Laptop will not boot after update",
  "Printer on the 3rd floor is offline",
  "Password reset required",
  "SAP login fails with an authentication error",
  "Slow performance on the shared drive",
  "Request for a second monitor",
  "Cannot access the SharePoint site",
  "Wi-Fi drops repeatedly in Building C",
  "Nightly database backup job failed",
  "Salesforce integration returning 401",
  "Disk space low on the production app server",
  "Outlook crashes on startup",
  "Need access to the finance reporting dashboard",
  "Phone system outage in the call centre",
  "Multi-factor authentication code not received",
  "Conference room PC has no audio",
  "Server room temperature alert",
  "New hire onboarding - equipment setup",
];

const CMDB_CLASSES = [
  "cmdb_ci_linux_server", "cmdb_ci_win_server", "cmdb_ci_esx_server", "cmdb_ci_vm_instance",
  "cmdb_ci_db_mysql_instance", "cmdb_ci_db_ora_instance", "cmdb_ci_app_server_tomcat",
  "cmdb_ci_web_server", "cmdb_ci_router", "cmdb_ci_switch", "cmdb_ci_firewall_network",
  "cmdb_ci_computer", "cmdb_ci_printer", "cmdb_ci_storage_device", "cmdb_ci_service", "cmdb_ci_appl",
];

const CI_ROLES = ["web", "app", "db", "mail", "dns", "lb", "esx", "san", "vpn", "auth", "batch", "cache"];

const CI_ENVIRONMENTS = ["prd", "stg", "dev", "qa", "uat"];

const NOW_ROLES = [
  "admin", "itil", "itil_admin", "approver_user", "catalog_admin", "knowledge_admin",
  "asset", "report_admin", "user_admin", "security_admin", "sn_incident_write",
  "sn_change_write", "sn_request_read", "snc_internal",
];

/** Clause fragments an `encodedQuery` is assembled from, by column. */
const QUERY_CLAUSES = [
  "active=true", "active=false", "state=1", "state=2", "state!=7", "priority=1", "priority<=2",
  "urgency=1", "category=network", "assigned_toISEMPTY", "assignment_group.name=Service Desk",
  "sys_created_onONLast 30 days@javascript:gs.beginningOfLast30Days()@javascript:gs.endOfLast30Days()",
  "short_descriptionLIKEvpn", "caller_id.email!=", "opened_at>javascript:gs.beginningOfThisMonth()",
];

const QUERY_ORDERS = ["ORDERBYnumber", "ORDERBYDESCsys_created_on", "ORDERBYpriority", "ORDERBYDESCopened_at"];

const SCOPE_VENDORS = ["snc", "sn", "acme", "glb", "nvda", "hrx", "fin", "ops"];

const ICD10_PREFIXES = ["A", "B", "C", "D", "E", "F", "G", "I", "J", "K", "L", "M", "N", "R", "S", "T", "Z"];

/**
 * Strings that are valid input but routinely break naive validation, escaping
 * or storage. The point of a dev-facing generator is to produce these on
 * purpose rather than waiting for a user to find them.
 */
const EDGE_CASE_POOLS: Record<string, string[]> = {
  text: [
    "",
    " ",
    "\t",
    "   leading and trailing   ",
    "null",
    "undefined",
    "NaN",
    "true",
    "0",
    "O'Brien",
    'She said "hello"',
    "back\\slash",
    "line one\nline two",
    "carriage\r\nreturn",
    "semi;colon,comma\ttab",
    "a".repeat(255),
    "a".repeat(1024),
    "-",
    "--",
    "%s %d %n",
    "{{template}}",
  ],
  unicode: [
    "日本語のテキスト",
    "한국어 텍스트",
    "Ω≈ç√∫˜µ≤≥÷",
    "😀🎉🚀",
    "👨‍👩‍👧‍👦",
    "🇯🇵🇩🇪🇧🇷",
    "éclair",
    "مرحبا بالعالم",
    "שלום עולם",
    "‮reversed‬",
    "ＦＵＬＬＷＩＤＴＨ",
    "ｶﾀｶﾅ",
    "​zero​width​",
    "Ĳsselmeer",
    "Ǆungla",
    "𝕞𝕒𝕥𝕙𝕤",
  ],
  injection: [
    "' OR '1'='1",
    "'; DROP TABLE users;--",
    "admin'--",
    "1; SELECT pg_sleep(10)--",
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
    "../../etc/passwd",
    "..\\..\\windows\\system32\\cmd.exe",
    "%2e%2e%2f%2e%2e%2f",
    "{{7*7}}",
    "${7*7}",
    "${jndi:ldap://example.invalid/a}",
    "| whoami",
    "$(id)",
    "`id`",
  ],
  numeric: [
    "0",
    "-0",
    "0.0",
    ".5",
    "1e309",
    "-1e309",
    "NaN",
    "Infinity",
    "-Infinity",
    "9007199254740993",
    "-9223372036854775808",
    "0x1F",
    "0b1010",
    "1,000.00",
    "1 000,00",
    "١٢٣٤٥",
    "١٫٥",
    "٠٠٧",
  ],
};

const ALL_EDGE_CASES = Object.values(EDGE_CASE_POOLS).flat();

/* ------------------------------ templates ------------------------------ */

/** Resolves `{{token}}` placeholders inside a template pattern. */
function renderTemplate(pattern: string, ctx: GenContext): string {
  const f = ctx.f;
  return pattern.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (whole, tokenRaw: string) => {
    const [name = "", arg] = tokenRaw.split(":").map(s => s.trim());

    if (name === "number" || name === "int") {
      const [lo, hi] = (arg ?? "0-999").split("-").map(Number);
      return String(f.number.int({ min: num(lo, 0), max: num(hi, 999) }));
    }
    if (name === "digit" || name === "digits") {
      return f.string.numeric({ length: num(Number(arg), 4), allowLeadingZeros: true });
    }
    if (name === "letter" || name === "letters") {
      return f.string.alpha({ length: num(Number(arg), 4), casing: "upper" });
    }
    if (name === "index" || name === "i") {
      return String(ctx.index);
    }
    if (name === "pick" && arg) {
      return f.helpers.arrayElement(arg.split("|"));
    }
    // Anything else falls through to a regular field type.
    const value = generateValue(name as FieldType, {}, ctx);
    return value === null || value === undefined ? "" : String(value);
  });
}

/* ------------------------------- context ------------------------------- */

type GenContext = {
  /** The locale-bound random source every value is drawn from. */
  f: Random;
  /** 0-based row index, used by autoIncrement and `{{index}}`. */
  index: number;
  /** Total rows in the run, so a sequence can span a sensible window. */
  rowCount: number;
  /** The row being built, so later fields can read earlier values. */
  row: Row;
  /** Formulas pre-parsed once per run, keyed by expression text. */
  formulas: Map<string, FormulaNode>;
  /** `when` predicates pre-parsed once per run, keyed by condition text. */
  conditions: Map<string, ConditionNode>;
  /** Running timestamp per sequential field, keyed by field id. */
  cursors: Map<string, number>;
  /** The field being generated, for the few types that need their own state. */
  fieldId: string;
  /** Nesting level, so object fields cannot recurse without end. */
  depth: number;
  /**
   * Whether a nested record spreads into dot-path columns. True for the row
   * itself, so CSV stays flat; false inside an array item, where the element
   * is a JSON object in its own right.
   */
  flatten: boolean;
};

/* ------------------------------ correlation ----------------------------- */

/** Splits a person-shaped value into the parts the name builders want. */
function nameParts(value: unknown): { firstName?: string; lastName?: string } {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return {};
  const parts = text.split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts[parts.length - 1] };
}

/**
 * The value this field is built from — the named field, or the row's obvious
 * name columns when `derivesFrom` points at nothing useful.
 */
function derivedSource(opts: FieldOptions, ctx: GenContext): { firstName?: string; lastName?: string } {
  const named = opts.derivesFrom ? ctx.row[opts.derivesFrom] : undefined;
  const parts = nameParts(named);
  if (parts.firstName) return parts;
  return {};
}

/**
 * One draw from a ServiceNow choice pool. Always one draw from the seeded
 * stream whichever half is asked for, so switching `variant` between value and
 * label re-labels the same rows rather than generating different ones.
 */
function nowChoice(f: Random, pool: NowChoice[], variant: string | undefined): string {
  const picked = f.helpers.weightedArrayElement(pool.map(choice => ({ value: choice, weight: choice.weight ?? 1 })));
  return variant === "label" ? picked.label : picked.value;
}

function bundleValue(kind: BundleKind, ctx: GenContext): Record<string, unknown> {
  const f = ctx.f;

  switch (kind) {
    case "person": {
      const sex = f.person.sexType();
      const firstName = f.person.firstName(sex);
      const lastName = f.person.lastName(sex);
      return {
        first_name: firstName,
        last_name: lastName,
        full_name: f.person.fullName({ firstName, lastName, sex }),
        email: f.internet.email({ firstName, lastName }).toLowerCase(),
        username: f.internet.username({ firstName, lastName }).toLowerCase(),
        phone: f.phone.number({ style: "national" }),
      };
    }
    case "address": {
      // One state pick drives the abbreviation, so the two always agree.
      const state = f.location.state();
      const [latitude, longitude] = [f.location.latitude(), f.location.longitude()];
      return {
        street: f.location.streetAddress(),
        city: f.location.city(),
        state,
        state_code: f.location.state({ abbreviated: true }),
        zip: f.location.zipCode(),
        country: f.location.country(),
        country_code: f.location.countryCode(),
        latitude,
        longitude,
      };
    }
    case "card": {
      const issuer = f.finance.creditCardIssuer();
      const number = f.finance.creditCardNumber({ issuer });
      const expiry = f.date.future({ years: 4 });
      return {
        brand: issuer,
        number,
        last4: number.replace(/\D/g, "").slice(-4),
        expiry: `${String(expiry.getMonth() + 1).padStart(2, "0")}/${String(expiry.getFullYear()).slice(-2)}`,
        cvv: f.finance.creditCardCVV(),
      };
    }
    case "device": {
      const os = f.helpers.arrayElement(OS_NAMES);
      return {
        model: `${f.company.name().split(/[\s,]+/)[0]} ${f.string.alpha({ length: 2, casing: "upper" })}${f.number.int({ min: 5, max: 20 })}`,
        os,
        os_version: `${f.number.int({ min: 12, max: 19 })}.${f.number.int({ min: 0, max: 6 })}`,
        app_version: f.system.semver(),
        screen: f.helpers.arrayElement(SCREEN_RESOLUTIONS),
        carrier: f.helpers.arrayElement(CARRIERS),
      };
    }
    case "company": {
      const name = f.company.name();
      const domain = `${f.helpers.slugify(name).toLowerCase().replace(/[^a-z0-9-]/g, "")}.com`;
      return {
        name,
        domain,
        email: `${f.internet.username().toLowerCase()}@${domain}`,
        catch_phrase: f.company.catchPhrase(),
        department: f.commerce.department(),
      };
    }
  }
}

/* ------------------------------ generation ------------------------------ */

function generateValue(type: FieldType, opts: FieldOptions, ctx: GenContext): unknown {
  const f = ctx.f;

  switch (type) {
    // identity
    case "uuid":
      return f.string.uuid();
    case "autoIncrement":
      return num(opts.min, 1) + ctx.index;
    case "objectId":
      return f.database.mongodbObjectId();
    case "nanoid":
      return f.string.nanoid();
    case "ulid":
      return f.string.ulid();

    // person
    case "firstName":
      return f.person.firstName();
    case "lastName":
      return f.person.lastName();
    case "fullName":
      return f.person.fullName();
    case "username": {
      const parts = derivedSource(opts, ctx);
      return f.internet.username(parts).toLowerCase();
    }
    case "email": {
      const parts = derivedSource(opts, ctx);
      return f.internet.email(parts).toLowerCase();
    }
    case "phone":
      return f.phone.number({ style: "national" });
    case "avatarUrl":
      return f.image.avatar();
    case "jobTitle":
      return f.person.jobTitle();
    case "bio":
      return f.person.bio();
    case "gender":
      return f.person.sex();
    case "birthDate":
      return formatDate(f.date.birthdate(), opts.format ?? "date");
    case "age":
      return drawNumber(f, opts, { min: 18, max: 80 });
    case "namePrefix":
      return f.person.prefix();
    case "zodiacSign":
      return f.person.zodiacSign();

    // location
    case "streetAddress":
      return f.location.streetAddress();
    case "city":
      return f.location.city();
    case "state":
      return f.location.state();
    case "stateAbbr":
      return f.location.state({ abbreviated: true });
    case "zipCode":
      return f.location.zipCode();
    case "country":
      return f.location.country();
    case "countryCode":
      return f.location.countryCode();
    case "latitude":
      return f.location.latitude();
    case "longitude":
      return f.location.longitude();
    case "timezone":
      return f.location.timeZone();
    case "fullAddress":
      return `${f.location.streetAddress()}, ${f.location.city()}, ${f.location.state({
        abbreviated: true,
      })} ${f.location.zipCode()}`;
    case "secondaryAddress":
      return f.location.secondaryAddress();
    case "county":
      return f.location.county();
    case "direction":
      return f.location.direction();

    // internet
    case "url":
      return f.internet.url();
    case "domain":
      return f.internet.domainName();
    case "ipv4":
      return f.internet.ipv4();
    case "ipv6":
      return f.internet.ipv6();
    case "macAddress":
      return f.internet.mac();
    case "password":
      return f.internet.password({ length: num(opts.min, 12) });
    case "slug": {
      const source = opts.derivesFrom ? ctx.row[opts.derivesFrom] : undefined;
      const text = typeof source === "string" && source.trim() ? source : "";
      return text
        ? f.helpers
            .slugify(text)
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
        : f.lorem.slug();
    }
    case "userAgent":
      return f.internet.userAgent();
    case "hexColor":
      return f.color.rgb({ format: "hex", casing: "lower" });
    case "emoji":
      return f.internet.emoji();
    case "filePath":
      return f.system.filePath();
    case "mimeType":
      return f.system.mimeType();

    // business
    case "companyName":
      return f.company.name();
    case "department":
      return f.commerce.department();
    case "catchPhrase":
      return f.company.catchPhrase();
    case "productName":
      return f.commerce.productName();
    case "productDescription":
      return f.commerce.productDescription();
    case "sku":
      return `${f.string.alpha({ length: 3, casing: "upper" })}-${f.string.numeric(6)}`;
    case "price":
      return drawNumber(f, opts, { min: 1, max: 1000, decimals: num(opts.decimals, 2) });
    case "currencyCode":
      return f.finance.currencyCode();
    case "creditCardNumber":
      return f.finance.creditCardNumber();
    case "iban":
      return f.finance.iban();
    case "accountNumber":
      return f.finance.accountNumber();

    // text
    case "word":
      return f.lorem.word();
    case "words":
      return f.lorem.words({ min: num(opts.min, 2), max: num(opts.max, 5) });
    case "sentence":
      return f.lorem.sentence({ min: num(opts.min, 5), max: num(opts.max, 12) });
    case "paragraph":
      return f.lorem.paragraphs({ min: num(opts.min, 1), max: num(opts.max, 2) }, " ");

    // primitives
    case "integer":
      return drawNumber(f, opts, { min: 0, max: 1000 });
    case "float":
      return drawNumber(f, opts, { min: 0, max: 1000, decimals: num(opts.decimals, 2) });
    case "boolean":
      return f.datatype.boolean({ probability: num(opts.truePercent, 50) / 100 });

    // dates
    case "date": {
      const from = opts.from ? new Date(opts.from) : new Date(Date.now() - 365 * 24 * 3600 * 1000);
      const to = opts.to ? new Date(opts.to) : new Date();
      const safeFrom = Number.isNaN(from.getTime()) ? new Date(2020, 0, 1) : from;
      const safeTo = Number.isNaN(to.getTime()) || to <= safeFrom ? new Date(safeFrom.getTime() + 86400000) : to;
      return formatDate(f.date.between({ from: safeFrom, to: safeTo }), opts.format);
    }
    case "pastDate":
      return formatDate(f.date.past({ years: 3 }), opts.format);
    case "futureDate":
      return formatDate(f.date.future({ years: 3 }), opts.format);
    case "recentDate":
      return formatDate(f.date.recent({ days: 30 }), opts.format);
    case "sequentialDate":
      return formatDate(nextInSequence(opts, ctx), opts.format);

    // custom
    case "enum": {
      const values = opts.values?.filter(v => v !== "") ?? [];
      if (values.length) return pickWeighted(f, values, opts.weights);
      // Dynamic enums are filled in by `resolveChoiceScripts` before the
      // first row is built; reaching here means that step was skipped.
      if (opts.valuesFrom && opts.valuesFrom !== "list") {
        throw new Error("Dynamic enum has no choices — resolveChoiceScripts() must run before generateRows().");
      }
      return null;
    }
    case "template":
      return renderTemplate(opts.pattern ?? "", ctx);
    case "computed": {
      const node = ctx.formulas.get((opts.expression ?? "").trim());
      return node ? evaluateFormula(node, ctx.row, opts.decimals) : null;
    }
    case "array": {
      const length = f.number.int({ min: num(opts.min, 1), max: Math.max(num(opts.min, 1), num(opts.max, 3)) });
      if (opts.arrayOf === "object") {
        const children = opts.fields ?? [];
        const itemCtx: GenContext = { ...ctx, flatten: false };
        return Array.from({ length }, () => buildRecord(children, itemCtx));
      }
      const inner = opts.arrayOf ?? "word";
      return Array.from({ length }, () => generateValue(inner, {}, ctx));
    }
    case "object":
      return buildRecord(opts.fields ?? [], ctx);
    case "bundle":
      return bundleValue(opts.bundle ?? "person", ctx);

    // relational
    case "reference": {
      // `resolveReferences` loads the pool before the first row; `values` is
      // the hand-written fallback, which is what the tests and a pasted list use.
      const pool: unknown[] = opts.refPool?.length ? opts.refPool : (opts.values ?? []);
      if (!pool.length) return null;
      if (opts.refMode === "cycle") return pool[ctx.index % pool.length];
      if (opts.refMode === "unique") return ctx.index < pool.length ? pool[ctx.index] : null;
      return f.helpers.arrayElement(pool);
    }

    // observability
    case "httpMethod":
      return f.internet.httpMethod();
    case "httpStatus":
      return Number(
        weightedPool(f, opts, [
          ["200", 68],
          ["201", 8],
          ["204", 4],
          ["301", 2],
          ["304", 4],
          ["400", 4],
          ["401", 3],
          ["403", 2],
          ["404", 3],
          ["409", 1],
          ["422", 2],
          ["429", 1],
          ["500", 2],
          ["502", 1],
          ["503", 1],
        ]),
      );
    case "logLevel":
      return weightedPool(f, opts, [
        ["debug", 12],
        ["info", 62],
        ["warn", 18],
        ["error", 7],
        ["fatal", 1],
      ]);
    case "latencyMs":
      return drawNumber(f, opts, { min: 1, max: 5000, decimals: num(opts.decimals, 0) });
    case "traceId":
      return f.string.hexadecimal({ length: 32, casing: "lower", prefix: "" });
    case "spanId":
      return f.string.hexadecimal({ length: 16, casing: "lower", prefix: "" });
    case "traceparent":
      return `00-${f.string.hexadecimal({ length: 32, casing: "lower", prefix: "" })}-${f.string.hexadecimal({
        length: 16,
        casing: "lower",
        prefix: "",
      })}-0${f.helpers.arrayElement(["0", "1"])}`;
    case "stackTrace": {
      const depth = f.number.int({ min: num(opts.min, 3), max: Math.max(num(opts.min, 3), num(opts.max, 8)) });
      const error = f.helpers.arrayElement([
        "TypeError: Cannot read properties of undefined",
        "ReferenceError: value is not defined",
        "RangeError: Maximum call stack size exceeded",
        "Error: connect ECONNREFUSED 127.0.0.1:5432",
        "SyntaxError: Unexpected token < in JSON at position 0",
      ]);
      const frames = Array.from({ length: depth }, () => {
        const fn = f.hacker.verb().replace(/\s+/g, "");
        return `    at ${fn}${f.word.noun().replace(/\s+/g, "")} (/srv/app/src/${f.system.commonFileName("ts")}:${f.number.int({
          min: 1,
          max: 400,
        })}:${f.number.int({ min: 1, max: 80 })})`;
      });
      return [error, ...frames].join("\n");
    }
    case "semver":
      return f.system.semver();
    case "gitSha":
      return f.git.commitSha();
    case "gitBranch":
      return f.git.branch();
    case "gitCommitMessage":
      return f.git.commitMessage();
    case "cveId":
      return `CVE-${f.number.int({ min: 1999, max: new Date().getFullYear() })}-${f.string.numeric({
        length: { min: 4, max: 5 },
        allowLeadingZeros: false,
      })}`;
    case "k8sPod":
      return `${f.helpers.slugify(f.word.noun()).toLowerCase()}-${f.string.alphanumeric({
        length: 10,
        casing: "lower",
      })}-${f.string.alphanumeric({ length: 5, casing: "lower" })}`;
    case "k8sNamespace":
      return f.helpers.arrayElement(K8S_NAMESPACES);
    case "cronExpression":
      return f.system.cron();
    case "duration": {
      const seconds = f.number.int({ min: num(opts.min, 1), max: Math.max(num(opts.min, 1), num(opts.max, 86_400)) });
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const rest = seconds % 60;
      return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${rest || (!hours && !minutes) ? `${rest}S` : ""}`;
    }
    case "fileName":
      return f.system.fileName();
    case "fileExtension":
      return f.system.fileExt();

    // finance
    case "bic":
      return f.finance.bic();
    case "routingNumber":
      return f.finance.routingNumber();
    case "tickerSymbol":
      return f.string.alpha({ length: { min: 1, max: 5 }, casing: "upper" });
    case "isin": {
      const body = `${f.location.countryCode()}${f.string.alphanumeric({ length: 9, casing: "upper" })}`;
      return `${body}${isinCheckDigit(body)}`;
    }
    case "cusip": {
      const body = f.string.alphanumeric({ length: 8, casing: "upper" });
      return `${body}${cusipCheckDigit(body)}`;
    }
    case "merchantCategoryCode":
      return f.helpers.arrayElement(MERCHANT_CATEGORY_CODES);
    case "cardBrand":
      return f.finance.creditCardIssuer();
    case "cardExpiry": {
      const expiry = f.date.future({ years: 4 });
      return `${String(expiry.getMonth() + 1).padStart(2, "0")}/${String(expiry.getFullYear()).slice(-2)}`;
    }
    case "cardCvv":
      return f.finance.creditCardCVV();
    case "cryptoAddress":
      return opts.variant === "ethereum" ? f.finance.ethereumAddress() : f.finance.bitcoinAddress();
    case "transactionAmount":
      return drawNumber(f, opts, { min: 1, max: 5000, decimals: num(opts.decimals, 2) });
    case "transactionType":
      return f.finance.transactionType();
    case "currencyName":
      return f.finance.currencyName();
    case "currencySymbol":
      return f.finance.currencySymbol();

    // commerce
    case "upc": {
      const body = f.string.numeric({ length: 11, allowLeadingZeros: true });
      return `${body}${gtinCheckDigit(body)}`;
    }
    case "ean": {
      const body = f.string.numeric({ length: 12, allowLeadingZeros: true });
      return `${body}${gtinCheckDigit(body)}`;
    }
    case "isbn":
      return f.commerce.isbn();
    case "trackingNumber": {
      const carrier = opts.variant || f.helpers.arrayElement(["ups", "fedex", "usps", "dhl"]);
      switch (carrier.toLowerCase()) {
        case "fedex":
          return f.string.numeric({ length: 12, allowLeadingZeros: true });
        case "usps":
          return `94${f.string.numeric({ length: 20, allowLeadingZeros: true })}`;
        case "dhl":
          return f.string.numeric({ length: 10, allowLeadingZeros: false });
        default:
          return `1Z${f.string.alphanumeric({ length: 6, casing: "upper" })}${f.string.numeric({
            length: 10,
            allowLeadingZeros: true,
          })}`;
      }
    }
    case "shippingCarrier":
      return f.helpers.arrayElement(SHIPPING_CARRIERS);
    case "orderStatus":
      return weightedPool(f, opts, [
        ["delivered", 52],
        ["shipped", 18],
        ["processing", 12],
        ["pending", 8],
        ["cancelled", 5],
        ["refunded", 3],
        ["returned", 2],
      ]);
    case "discountPercent":
      return drawNumber(f, opts, { min: 0, max: 40, decimals: num(opts.decimals, 0) });
    case "productAdjective":
      return f.commerce.productAdjective();
    case "productMaterial":
      return f.commerce.productMaterial();
    case "quantity":
      return drawNumber(f, opts, { min: 1, max: 40 });

    // auth & saas
    case "apiKey": {
      const prefix = opts.variant?.trim() || "sk_live";
      return `${prefix}_${f.string.alphanumeric({ length: 32 })}`;
    }
    case "jwt":
      return f.internet.jwt();
    case "passwordHash": {
      if (opts.variant === "argon2") {
        return `$argon2id$v=19$m=65536,t=3,p=4$${f.string.alphanumeric({ length: 22 })}$${f.string.alphanumeric({
          length: 43,
        })}`;
      }
      if (opts.variant === "sha256") return f.string.hexadecimal({ length: 64, casing: "lower", prefix: "" });
      return `$2b$12$${f.string.alphanumeric({ length: 53 })}`;
    }
    case "otpCode":
      return f.string.numeric({ length: Math.min(Math.max(num(opts.min, 6), 4), 12), allowLeadingZeros: true });
    case "sessionId":
      return f.string.alphanumeric({ length: 32, casing: "lower" });
    case "oauthScopes": {
      const pool = opts.values?.filter(Boolean)?.length ? opts.values.filter(Boolean) : OAUTH_SCOPES;
      const count = f.number.int({ min: num(opts.min, 1), max: Math.max(num(opts.min, 1), num(opts.max, 4)) });
      return f.helpers.arrayElements(pool, Math.min(count, pool.length));
    }
    case "tenantId":
      return `tnt_${f.string.alphanumeric({ length: 16, casing: "lower" })}`;
    case "roleName":
      return weightedPool(f, opts, [
        ["member", 70],
        ["admin", 12],
        ["viewer", 12],
        ["owner", 4],
        ["billing", 2],
      ]);
    case "planTier":
      return weightedPool(f, opts, [
        ["free", 62],
        ["pro", 24],
        ["team", 10],
        ["enterprise", 4],
      ]);
    case "seatCount":
      return drawNumber(f, opts, { min: 1, max: 500 });

    // network
    case "cidr":
      return `${f.internet.ipv4()}/${f.number.int({ min: 8, max: 30 })}`;
    case "port":
      return drawNumber(f, opts, { min: 1024, max: 65_535 });
    case "subnetMask":
      return f.helpers.arrayElement(SUBNET_MASKS);
    case "fqdn":
      return `${f.internet.domainWord()}.${f.internet.domainName()}`;
    case "dnsRecordType":
      return f.helpers.arrayElement(DNS_RECORD_TYPES);
    case "asn":
      return drawNumber(f, opts, { min: 1, max: 400_000 });
    case "privateIpv4":
      return f.internet.ipv4({ network: f.helpers.arrayElement(["private-a", "private-b", "private-c"] as const) });

    // device
    case "imei": {
      const body = f.string.numeric({ length: 14, allowLeadingZeros: true });
      return `${body}${luhnCheckDigit(body)}`;
    }
    case "deviceModel":
      return `${f.vehicle.manufacturer()} ${f.string.alpha({ length: 1, casing: "upper" })}${f.number.int({
        min: 5,
        max: 30,
      })}`;
    case "osName":
      return f.helpers.arrayElement(OS_NAMES);
    case "osVersion":
      return `${f.number.int({ min: 10, max: 19 })}.${f.number.int({ min: 0, max: 8 })}.${f.number.int({ min: 0, max: 5 })}`;
    case "appVersion":
      return f.system.semver();
    case "screenResolution":
      return f.helpers.arrayElement(SCREEN_RESOLUTIONS);
    case "batteryLevel":
      return drawNumber(f, opts, { min: 1, max: 100 });
    case "pushToken":
      return f.string.hexadecimal({ length: 64, casing: "lower", prefix: "" });
    case "carrier":
      return f.helpers.arrayElement(CARRIERS);

    // government
    case "ssn":
      // 900-999 is permanently unassigned, so these can never collide with a real SSN.
      return `${f.number.int({ min: 900, max: 999 })}-${f.string.numeric({ length: 2, allowLeadingZeros: true })}-${f.string.numeric(
        { length: 4, allowLeadingZeros: true },
      )}`;
    case "ein":
      return `${f.string.numeric({ length: 2, allowLeadingZeros: true })}-${f.string.numeric({
        length: 7,
        allowLeadingZeros: true,
      })}`;
    case "passportNumber":
      return f.string.alphanumeric({ length: 9, casing: "upper" });
    case "driversLicense":
      return `${f.string.alpha({ length: 1, casing: "upper" })}${f.string.numeric({ length: 7, allowLeadingZeros: true })}`;
    case "vin":
      return f.vehicle.vin();
    case "licensePlate":
      return f.vehicle.vrm();
    case "taxId": {
      const country = f.location.countryCode();
      return `${country}${f.string.numeric({ length: 9, allowLeadingZeros: true })}`;
    }

    // health
    case "icd10Code":
      return `${f.helpers.arrayElement(ICD10_PREFIXES)}${f.string.numeric({ length: 2, allowLeadingZeros: true })}.${f.string.alphanumeric(
        { length: { min: 1, max: 2 }, casing: "lower" },
      )}`;
    case "npiNumber": {
      // NPIs check with Luhn over the prefixed issuer identifier.
      const body = f.string.numeric({ length: 9, allowLeadingZeros: true });
      return `${body}${luhnCheckDigit(`80840${body}`)}`;
    }
    case "medicalRecordNumber":
      return `MRN${f.string.numeric({ length: 8, allowLeadingZeros: true })}`;
    case "bloodType":
      return f.helpers.arrayElement(BLOOD_TYPES);
    case "drugName":
      return f.helpers.arrayElement(DRUG_NAMES);
    case "dosage":
      return `${f.helpers.arrayElement([5, 10, 20, 25, 50, 100, 200, 250, 500])} ${f.helpers.arrayElement([
        "mg",
        "mcg",
        "mL",
        "IU",
      ])}`;
    case "chemicalElement":
      return f.science.chemicalElement().name;
    case "siUnit": {
      const unit = f.science.unit();
      return `${unit.name} (${unit.symbol})`;
    }

    // content
    case "markdown": {
      const paragraphs = f.number.int({ min: num(opts.min, 1), max: Math.max(num(opts.min, 1), num(opts.max, 3)) });
      const blocks = [`## ${f.lorem.sentence({ min: 3, max: 6 }).replace(/\.$/, "")}`];
      for (let i = 0; i < paragraphs; i++) {
        blocks.push(f.lorem.paragraph());
        if (f.datatype.boolean({ probability: 0.4 })) {
          blocks.push(
            f.helpers
              .multiple(() => `- ${f.lorem.sentence({ min: 3, max: 8 })}`, { count: f.number.int({ min: 2, max: 4 }) })
              .join("\n"),
          );
        }
      }
      return blocks.join("\n\n");
    }
    case "htmlFragment":
      return `<p>${f.lorem.sentence()}</p><ul>${f.helpers
        .multiple(() => `<li>${f.lorem.words({ min: 2, max: 5 })}</li>`, { count: 3 })
        .join("")}</ul>`;
    case "headline":
      return f.lorem
        .sentence({ min: 4, max: 9 })
        .replace(/\.$/, "")
        .replace(/\b\w/g, c => c.toUpperCase());
    case "tagList": {
      const count = f.number.int({ min: num(opts.min, 2), max: Math.max(num(opts.min, 2), num(opts.max, 5)) });
      return f.helpers.multiple(() => f.word.noun().toLowerCase(), { count });
    }
    case "readingTime":
      return drawNumber(f, opts, { min: 1, max: 25 });
    case "imageUrl":
      return f.image.url({ width: num(opts.min, 640), height: num(opts.max, 480) });
    case "fileSizeBytes":
      return drawNumber(f, opts, { min: 1, max: 50_000_000 });
    case "dataUri":
      return f.image.dataUri({ width: 32, height: 32 });

    // analytics
    case "embedding": {
      const dimensions = Math.min(Math.max(num(opts.dimensions, 8), 1), 2048);
      const decimals = num(opts.decimals, 4);
      return Array.from({ length: dimensions }, () => round(standardNormal(f), decimals));
    }
    case "classLabel":
      return weightedPool(f, opts, [
        ["positive", 10],
        ["negative", 90],
      ]);

    // flavor
    case "flightNumber":
      return `${f.airline.airline().iataCode}${f.airline.flightNumber({ length: { min: 3, max: 4 } })}`;
    case "airportCode":
      return f.airline.airport().iataCode;
    case "airlineName":
      return f.airline.airline().name;
    case "seatNumber":
      return f.airline.seat();
    case "bookTitle":
      return f.book.title();
    case "bookAuthor":
      return f.book.author();
    case "bookGenre":
      return f.book.genre();
    case "foodDish":
      return f.food.dish();
    case "foodIngredient":
      return f.food.ingredient();
    case "musicGenre":
      return f.music.genre();
    case "songName":
      return f.music.songName();
    case "artistName":
      return f.music.artist();
    case "animalType":
      return f.animal.type();
    case "colorName":
      return f.color.human();
    case "rgbColor":
      return f.color.rgb({ format: "css" });
    case "hslColor":
      return f.color.hsl({ format: "css" });
    case "databaseColumn":
      return f.database.column();
    case "databaseType":
      return f.database.type();
    case "databaseEngine":
      return f.database.engine();
    case "hackerPhrase":
      return f.hacker.phrase();

    // testing
    case "edgeCase": {
      const custom = opts.values?.filter(v => v !== undefined) ?? [];
      if (custom.length) return f.helpers.arrayElement(custom);
      const pool = EDGE_CASE_POOLS[opts.variant ?? "all"] ?? ALL_EDGE_CASES;
      return f.helpers.arrayElement(pool);
    }

    // servicenow
    case "nowQuery": {
      // A limit below 1 would leave an empty range to draw from, so floor it at 1.
      const limit = Math.max(1, Math.floor(num(opts.limit, NOW_QUERY_DEFAULT_LIMIT)));
      // Drawn from the seeded stream, so the same seed replays the same count.
      const count = f.number.int({ min: 1, max: limit });
      // Returned as an object, not a pre-encoded string: JSON export nests it
      // as real JSON, and CSV serializes it to a compact string on its own.
      return { table: opts.table ?? "", query: opts.query ?? "", limit, count };
    }
    case "sysId":
      return f.string.hexadecimal({ length: 32, casing: "lower", prefix: "" });
    case "sysClassName":
      return f.helpers.arrayElement(SYS_CLASS_NAMES);
    case "nowRecordNumber": {
      const prefix = (opts.variant?.trim() || "INC").toUpperCase();
      return `${prefix}${String(num(opts.min, 1_000_001) + ctx.index).padStart(7, "0")}`;
    }
    case "journalEntry":
      return `${f.date.recent({ days: 30 }).toISOString().slice(0, 16).replace("T", " ")} - ${f.person.fullName()} (Work notes)\n${f.lorem.sentence()}`;
    case "glideDateTime": {
      // Same bounds handling as `date`, but never any other output shape: a
      // glide_date_time column only ever accepts this one format.
      const from = opts.from ? new Date(opts.from) : new Date(Date.now() - 90 * 24 * 3600 * 1000);
      const to = opts.to ? new Date(opts.to) : new Date();
      const safeFrom = Number.isNaN(from.getTime()) ? new Date(2020, 0, 1) : from;
      const safeTo = Number.isNaN(to.getTime()) || to <= safeFrom ? new Date(safeFrom.getTime() + 86400000) : to;
      return glideDateTime(f.date.between({ from: safeFrom, to: safeTo }));
    }
    case "glideDuration": {
      const seconds = Math.max(0, Math.floor(drawNumber(f, opts, { min: 60, max: 172_800, decimals: 0 })));
      if (opts.variant === "human") {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const parts: string[] = [];
        if (days) parts.push(`${days} Day${days === 1 ? "" : "s"}`);
        if (hours) parts.push(`${hours} Hour${hours === 1 ? "" : "s"}`);
        if (minutes || !parts.length) parts.push(`${minutes} Minute${minutes === 1 ? "" : "s"}`);
        return parts.join(" ");
      }
      // A duration is stored as an offset from the epoch, so the date part
      // carries the days: 2 days 3 hours is "1970-01-03 03:00:00".
      return glideDateTime(new Date(seconds * 1000));
    }
    case "encodedQuery": {
      const clauses = f.helpers.arrayElements(QUERY_CLAUSES, f.number.int({ min: 1, max: 3 }));
      const order = f.datatype.boolean({ probability: 0.4 }) ? [f.helpers.arrayElement(QUERY_ORDERS)] : [];
      return [...clauses, ...order].join("^");
    }
    case "cmdbClass":
      return f.helpers.arrayElement(CMDB_CLASSES);
    case "ciName":
      return `${f.helpers.arrayElement(CI_ROLES)}-${f.helpers.arrayElement(CI_ENVIRONMENTS)}-${String(f.number.int({ min: 1, max: 99 })).padStart(3, "0")}`;
    case "nowUserId": {
      // `user_name` is first.last on a stock instance, and the demo data is
      // exactly that shape, so this is the form a lookup will match.
      const parts = derivedSource(opts, ctx);
      const first = parts.firstName ?? f.person.firstName();
      const last = parts.lastName ?? f.person.lastName();
      return `${f.helpers.slugify(first)}.${f.helpers.slugify(last)}`.toLowerCase();
    }
    case "nowRole":
      return f.helpers.arrayElement(NOW_ROLES);
    case "appScope":
      // x_<vendor prefix>_<app>, the shape the platform assigns a scoped app.
      return `x_${f.helpers.arrayElement(SCOPE_VENDORS)}_${f.internet.domainWord().replace(/-/g, "_")}`;
    case "incidentState":
      return nowChoice(f, INCIDENT_STATES, opts.variant);
    case "taskPriority":
      return nowChoice(f, TASK_PRIORITIES, opts.variant);
    case "taskImpact":
      return nowChoice(f, TASK_IMPACTS, opts.variant);
    case "taskUrgency":
      return nowChoice(f, TASK_URGENCIES, opts.variant);
    case "taskCategory":
      return nowChoice(f, TASK_CATEGORIES, opts.variant);
    case "contactType":
      return nowChoice(f, CONTACT_TYPES, opts.variant);
    case "closeCode":
      return f.helpers.arrayElement(CLOSE_CODES);
    case "assignmentGroup":
      return f.helpers.arrayElement(ASSIGNMENT_GROUPS);
    case "shortDescription":
      return f.helpers.arrayElement(SHORT_DESCRIPTIONS);
    case "changeType":
      return nowChoice(f, CHANGE_TYPES, opts.variant);
    case "changeRisk":
      return nowChoice(f, CHANGE_RISKS, opts.variant);
    case "approvalState":
      return nowChoice(f, APPROVAL_STATES, opts.variant);

    default:
      return f.lorem.word();
  }
}

/* --------------------------- sequential dates --------------------------- */

/** Nudges a timestamp into the next Mon-Fri 09:00-17:00 window. */
function toBusinessHours(date: Date): Date {
  const out = new Date(date);
  // Each pass fixes one problem (weekend, too early, too late); a fortnight of
  // passes is far more than any single timestamp can need.
  for (let i = 0; i < 14; i++) {
    const day = out.getDay();
    if (day === 0) {
      out.setDate(out.getDate() + 1);
      out.setHours(9, out.getMinutes(), out.getSeconds(), 0);
      continue;
    }
    if (day === 6) {
      out.setDate(out.getDate() + 2);
      out.setHours(9, out.getMinutes(), out.getSeconds(), 0);
      continue;
    }
    if (out.getHours() < 9) {
      out.setHours(9, out.getMinutes(), out.getSeconds(), 0);
      continue;
    }
    if (out.getHours() >= 17) {
      out.setDate(out.getDate() + 1);
      out.setHours(9, out.getMinutes(), out.getSeconds(), 0);
      continue;
    }
    break;
  }
  return out;
}

/**
 * The next timestamp in this field's series. Strictly increasing, so a pair of
 * `started_at` / `ended_at` columns and any ordering assertion both hold.
 */
function nextInSequence(opts: FieldOptions, ctx: GenContext): Date {
  const step = Math.max(1, num(opts.step, 3600));
  const jitter = Math.min(Math.max(num(opts.jitter, 0), 0), 100) / 100;
  const previous = ctx.cursors.get(ctx.fieldId);

  let next: Date;
  if (previous === undefined) {
    const start = opts.from ? new Date(opts.from) : new Date(Date.now() - ctx.rowCount * step * 1000);
    next = Number.isNaN(start.getTime()) ? new Date(Date.now() - ctx.rowCount * step * 1000) : start;
  } else {
    const factor = jitter ? 1 + ctx.f.number.float({ min: -jitter, max: jitter }) : 1;
    // Never less than a second on, so the series cannot stall or go backwards.
    next = new Date(Math.max(previous + 1000, previous + step * 1000 * factor));
  }

  if (opts.businessHours) next = toBusinessHours(next);
  ctx.cursors.set(ctx.fieldId, next.getTime());
  return next;
}

/* ------------------------------ decoration ------------------------------ */

/** Objects have no useful `toString`, so encode them before affixing text. */
function asText(value: unknown): string {
  return isPlainObject(value) ? JSON.stringify(value) : String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decorate(value: unknown, opts: FieldOptions): unknown {
  if (value === null || value === undefined) return value;
  if (!opts.prefix && !opts.suffix) return value;
  return `${opts.prefix ?? ""}${asText(value)}${opts.suffix ?? ""}`;
}

/** Pushes a value past the timestamp of the field it must follow. */
function applyAfter(value: unknown, opts: FieldOptions, ctx: GenContext): unknown {
  if (!opts.after) return value;
  const target = toDate(ctx.row[opts.after]);
  const current = toDate(value);
  if (!target || !current || current > target) return value;
  const shifted = new Date(target.getTime() + ctx.f.number.int({ min: 60, max: 72 * 3600 }) * 1000);
  return formatDate(shifted, opts.format);
}

/**
 * Builds one record from a list of child fields — an object field's value, or
 * an array item.
 *
 * When flattening, a child that is itself an object or a bundle contributes
 * dot-path keys rather than a nested value, so the whole tree lands as flat
 * columns. Array items never flatten: they are JSON objects, and dots in their
 * keys would read as paths that nothing ever expands.
 */
function buildRecord(children: Field[], ctx: GenContext): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  // Children read a scope of their own: the row so far, plus the siblings
  // already built, so `derivesFrom` can name either one.
  const childCtx: GenContext = { ...ctx, depth: ctx.depth + 1, row: { ...ctx.row } };
  for (const child of children) {
    if (!child.name.trim()) continue;
    // Past the nesting limit a child that would nest *further* is left out,
    // while plain children still produce their values — so an over-deep branch
    // loses its deepest level rather than disappearing whole.
    if (SPREADING_FIELD_TYPES.has(child.type) && ctx.depth >= MAX_FIELD_DEPTH) continue;
    childCtx.fieldId = child.id;
    const value = generateField(child, childCtx, undefined);
    childCtx.row[child.name] = value;
    if (ctx.flatten && SPREADING_FIELD_TYPES.has(child.type) && isPlainObject(value)) {
      for (const [key, nested] of Object.entries(value)) out[`${child.name}.${key}`] = nested;
    } else {
      out[child.name] = value;
    }
  }
  return out;
}

function generateField(field: Field, ctx: GenContext, seen: Set<string> | undefined): unknown {
  const opts = field.options ?? {};
  ctx.fieldId = field.id;

  // A failed `when` blanks the field, whatever else it would have produced.
  if (opts.when) {
    const condition = ctx.conditions.get(opts.when.trim());
    if (condition && !evaluateCondition(condition, ctx.row)) return null;
  }

  if (field.nullPercent && ctx.f.number.int({ min: 1, max: 100 }) <= field.nullPercent) {
    return null;
  }

  let value = decorate(applyAfter(generateValue(field.type, opts, ctx), opts, ctx), opts);

  if (seen) {
    // Best effort: retry a bounded number of times, then disambiguate with a suffix.
    for (let attempt = 0; attempt < 25 && seen.has(asText(value)); attempt++) {
      value = decorate(applyAfter(generateValue(field.type, opts, ctx), opts, ctx), opts);
    }
    if (seen.has(asText(value)) && !isPlainObject(value)) {
      // An object has no suffix that would leave it valid, so it keeps the
      // duplicate rather than being turned into a string.
      value = typeof value === "number" ? value + ctx.index + 1 : `${value}-${ctx.index + 1}`;
    }
    seen.add(asText(value));
  }

  return value;
}

/* -------------------------------- ordering ------------------------------- */

/** Every other field this one reads before it can produce a value. */
function dependencyNames(field: Field): string[] {
  const opts = field.options ?? {};
  const names: string[] = [];
  if (opts.derivesFrom) names.push(opts.derivesFrom);
  if (opts.after) names.push(opts.after);
  return names;
}

/**
 * Orders fields so everything that reads another field runs after it.
 *
 * Schema order is the tie-break, so a schema with no dependencies at all comes
 * back exactly as the user arranged it.
 */
function resolveOrder(fields: Field[], refsByField: Map<string, string[]>): Field[] {
  const byName = new Map<string, Field>();
  for (const field of fields) byName.set(field.name, field);

  /** A dependency may name a column a spreading field produced, e.g. "customer.email". */
  const owner = (name: string): Field | undefined => {
    const direct = byName.get(name);
    if (direct) return direct;
    let best: Field | undefined;
    for (const field of fields) {
      if (!SPREADING_FIELD_TYPES.has(field.type)) continue;
      if (!name.startsWith(`${field.name}.`)) continue;
      if (!best || field.name.length > best.name.length) best = field;
    }
    return best;
  };

  const ordered: Field[] = [];
  const state = new Map<string, "visiting" | "done">();

  const visit = (field: Field, trail: string[]): void => {
    const status = state.get(field.id);
    if (status === "done") return;
    if (status === "visiting") {
      throw new Error(`Fields reference each other in a loop: ${[...trail, field.name].join(" → ")}`);
    }
    state.set(field.id, "visiting");

    const dependencies = [...dependencyNames(field), ...(refsByField.get(field.name) ?? [])];
    for (const name of dependencies) {
      const dependency = owner(name);
      if (dependency && dependency.id !== field.id) visit(dependency, [...trail, field.name]);
    }

    state.set(field.id, "done");
    ordered.push(field);
  };

  for (const field of fields) visit(field, []);
  return ordered;
}

/* ------------------------------ pre-resolution ---------------------------- */

/**
 * Resolves every enum field whose choices come from a live source, and folds
 * the result back into `options.values` so `generateRows` stays synchronous.
 *
 * The structure is the one the Bun version had and is still the right one:
 * resolve every dynamic source up front, deduplicate identical sources so one
 * source is read once, and let the row loop stay synchronous. What changed is
 * that nothing here is async any more — a GlideRecord read and a REST Message
 * `execute()` both block — so the old trick of starting every request before
 * awaiting any of them has no work left to do and is gone with it.
 */
export function resolveChoiceScripts(fields: Field[], options?: ChoiceSourceOptions): Field[] {
  const dynamic = fields.filter(usesChoiceScript);
  if (!dynamic.length) return fields;

  // One read per distinct source, however many fields name it.
  const bySource = new Map<string, ChoiceResult>();
  const resolved = new Map<string, string[]>();

  for (const field of dynamic) {
    const opts = field.options ?? {};
    const key = choiceSourceKey(opts);
    let result = bySource.get(key);
    if (!result) {
      result = resolveChoiceSource(opts, options);
      bySource.set(key, result);
    }
    if (!result.ok) throw new Error(`Enum field "${field.name}": ${result.error}`);
    resolved.set(field.id, result.values);
  }

  return fields.map(field => {
    const values = resolved.get(field.id);
    return values ? { ...field, options: { ...field.options, values } } : field;
  });
}

/* ------------------------------- generation ------------------------------ */

export type GenerateConfig = Pick<SchemaConfig, "fields" | "rowCount"> &
  Partial<Pick<SchemaConfig, "seed" | "locale">>;

/** Called once per row. Return false to stop the run early. */
export type RowSink = (row: Row, index: number) => boolean | void;

/**
 * Generates into a callback rather than into an array.
 *
 * This is the shape that matters on the platform: a target-table run streams
 * each row straight into a `GlideRecord` insert instead of materialising a
 * hundred thousand objects first, and a dataset run can serialise
 * incrementally. `generateRows` is the collecting wrapper over it, kept
 * because previews, exports and the tests all genuinely want the array.
 *
 * @param maxRows the ceiling for this run. The caller reads it from the
 *   `x_1040823_ddg_now.max_rows` property rather than it being baked in here,
 *   so an admin can tune it to what the instance tolerates without a code
 *   change. The Bun version's hard-coded 100,000 was never a considered number.
 */
export function generateInto(config: GenerateConfig, emit: RowSink, maxRows = 100_000): number {
  const f = randomFor(config.locale);
  const seed = config.seed?.trim();
  if (seed) f.seed(hashSeed(seed));
  else f.seed();

  const fields = config.fields.filter(field => field.name.trim() !== "");

  // Parse every formula and predicate once up front, so a typo fails before any
  // row is built rather than on row one of a hundred thousand.
  const formulas = new Map<string, FormulaNode>();
  const conditions = new Map<string, ConditionNode>();
  const refsByField = new Map<string, string[]>();
  // Booleans are referenceable too: they coerce to 1 / 0.
  const referenceable = fields.filter(field => isNumericField(field) || field.type === "boolean").map(f2 => f2.name);

  // A `when` predicate may compare any column, including those a bundle spreads.
  const comparable = new Set<string>();
  for (const field of fields) {
    comparable.add(field.name);
    if (field.type === "bundle") {
      for (const column of BUNDLE_COLUMNS[field.options?.bundle ?? "person"]) comparable.add(`${field.name}.${column}`);
    }
    for (const child of childFields(field)) comparable.add(`${field.name}.${child.name}`);
  }

  for (const field of fields) {
    if (field.type === "computed") {
      const expression = (field.options?.expression ?? "").trim();
      const parsed = parseFormula(expression, referenceable);
      if (!parsed.ok) throw new Error(`Calculated field "${field.name}": ${parsed.error}`);
      if (parsed.refs.includes(field.name)) {
        throw new Error(`Calculated field "${field.name}" cannot reference itself.`);
      }
      formulas.set(expression, parsed.node);
      refsByField.set(field.name, parsed.refs);
    }

    const when = (field.options?.when ?? "").trim();
    if (when) {
      const parsed = parseCondition(when, comparable);
      if (!parsed.ok) throw new Error(`Condition on "${field.name}": ${parsed.error}`);
      if (parsed.refs.includes(field.name)) {
        throw new Error(`The condition on "${field.name}" cannot reference the field itself.`);
      }
      conditions.set(when, parsed.node);
      refsByField.set(field.name, [...(refsByField.get(field.name) ?? []), ...parsed.refs]);
    }
  }

  const order = resolveOrder(fields, refsByField);

  const uniqueTrackers = new Map<string, Set<string>>();
  for (const field of fields) {
    if (field.unique) uniqueTrackers.set(field.id, new Set());
  }

  const count = Math.max(1, Math.min(config.rowCount || 10, Math.max(1, maxRows)));
  const cursors = new Map<string, number>();

  for (let index = 0; index < count; index++) {
    // Seed the keys in schema order so exports keep the column order the user
    // sees, even though dependent fields are filled in later.
    const row: Row = {};
    for (const field of fields) {
      if (SPREADING_FIELD_TYPES.has(field.type)) {
        for (const column of spreadColumns(field)) row[`${field.name}.${column}`] = null;
      } else {
        row[field.name] = null;
      }
    }

    const ctx: GenContext = {
      f,
      index,
      rowCount: count,
      row,
      formulas,
      conditions,
      cursors,
      fieldId: "",
      depth: 0,
      flatten: true,
    };

    for (const field of order) {
      const value = generateField(field, ctx, uniqueTrackers.get(field.id));
      if (SPREADING_FIELD_TYPES.has(field.type)) {
        // A bundle or object occupies one column per part, so CSV stays flat
        // and JSON re-nests it on the way out.
        const columns = spreadColumns(field);
        const record = isPlainObject(value) ? value : {};
        for (const column of columns) row[`${field.name}.${column}`] = record[column] ?? null;
      } else {
        row[field.name] = value;
      }
    }
    if (emit(row, index) === false) return index + 1;
  }

  return count;
}

/** Every row of a run, as an array. A thin wrapper over `generateInto`. */
export function generateRows(config: GenerateConfig, maxRows = 100_000): Row[] {
  const rows: Row[] = [];
  generateInto(config, row => void rows.push(row), maxRows);
  return rows;
}

/**
 * The leaf columns a spreading field occupies, relative to its own name.
 *
 * It walks the same tree `buildRecord` does, under the same depth rule, so the
 * pre-seeded column order and the generated keys cannot drift apart.
 */
function spreadColumns(field: Field, depth = 0): string[] {
  if (field.type === "bundle") return BUNDLE_COLUMNS[field.options?.bundle ?? "person"];

  const columns: string[] = [];
  for (const child of childFields(field)) {
    if (!child.name.trim()) continue;
    if (SPREADING_FIELD_TYPES.has(child.type)) {
      if (depth >= MAX_FIELD_DEPTH) continue;
      for (const column of spreadColumns(child, depth + 1)) columns.push(`${child.name}.${column}`);
    } else {
      columns.push(child.name);
    }
  }
  return columns;
}
