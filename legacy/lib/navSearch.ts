/**
 * The nav's global search: one box over everything the left-hand nav lists.
 *
 * Matching goes past the names deliberately. The thing someone remembers about
 * a schema is often not what it is called — it is the column they added, the
 * ticket number they put in its metadata, the line of the script template they
 * are looking for, or the sentence they wrote about it in a note. So each
 * record is searched across the text it actually carries, and a hit that was
 * not on the name says which text it was, because a result whose title does
 * not contain what you typed otherwise looks like a bug in the search.
 *
 * Plain case-insensitive substring matching, over lists that are tens of items
 * long, held entirely in memory. No index, no fuzzy distance, nothing to keep
 * in step with the server: what the nav is showing is what is searched.
 */

import { fieldTypeLabel, type Dataset, type Field, type SchemaConfig } from "./types";
import type { Note } from "./notes";
import type { ScriptTemplate } from "./scriptTemplate";

/** One surviving item, and why it survived when the reason is not its name. */
export type Match<T> = {
  item: T;
  /** Absent when the name itself matched — the row already shows the reason. */
  hint?: string;
};

export type NavResults = {
  configs: Match<SchemaConfig>[];
  templates: Match<ScriptTemplate>[];
  notes: Match<Note>[];
  datasets: Match<Dataset>[];
  /** Everything that matched, across every list. */
  total: number;
};

/** Characters either side of a body hit, so the snippet has some context. */
const SNIPPET_PAD = 24;

export const normalizeQuery = (query: string): string => query.trim().toLowerCase();

const has = (haystack: string | undefined, needle: string): boolean =>
  Boolean(haystack) && haystack!.toLowerCase().includes(needle);

/** The line around the first hit in a body of text, elided at both ends. */
function snippet(body: string, needle: string): string {
  const at = body.toLowerCase().indexOf(needle);
  if (at < 0) return "";
  const start = Math.max(0, at - SNIPPET_PAD);
  const end = Math.min(body.length, at + needle.length + SNIPPET_PAD);
  // Collapsed, so a hit inside indented code does not arrive as a line of
  // whitespace with three characters at the end of it.
  const text = body.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${text}${end < body.length ? "…" : ""}`;
}

/** Every field name in a schema, including the children of object fields. */
function fieldNames(fields: Field[]): string[] {
  const names: string[] = [];
  const walk = (list: Field[], prefix: string) => {
    for (const field of list) {
      if (!field.name) continue;
      const name = prefix ? `${prefix}.${field.name}` : field.name;
      names.push(name);
      if (field.options?.fields?.length) walk(field.options.fields, name);
    }
  };
  walk(fields, "");
  return names;
}

function matchConfig(config: SchemaConfig, needle: string): Match<SchemaConfig> | null {
  if (has(config.name, needle)) return { item: config };
  if (has(config.description, needle)) return { item: config, hint: `description: ${config.description}` };

  const field = fieldNames(config.fields).find(name => has(name, needle));
  if (field) return { item: config, hint: `field: ${field}` };

  // The type someone is hunting for is the label they picked it by ("Full
  // name"), not the internal key ("fullName") — search what they saw.
  const typed = config.fields.find(entry => has(fieldTypeLabel(entry.type), needle));
  if (typed) return { item: config, hint: `${fieldTypeLabel(typed.type)}: ${typed.name}` };

  for (const [key, value] of Object.entries(config.metadata ?? {})) {
    if (has(key, needle) || has(value, needle)) return { item: config, hint: `${key}: ${value}` };
  }

  const mapping = (config.mappings ?? []).find(
    entry => has(entry.field, needle) || has(entry.fromField, needle) || has(entry.fromConfigName, needle),
  );
  if (mapping) {
    const source = mapping.fromConfigName || mapping.fromConfig;
    return { item: config, hint: `mapping: ${mapping.field} ← ${source}.${mapping.fromField}` };
  }

  if (has(config.locale, needle)) return { item: config, hint: `locale: ${config.locale}` };
  return null;
}

function matchTemplate(template: ScriptTemplate, needle: string): Match<ScriptTemplate> | null {
  if (has(template.name, needle)) return { item: template };
  if (has(template.body, needle)) return { item: template, hint: snippet(template.body, needle) };
  return null;
}

/**
 * A note matches on its title or anywhere in its prose — including on the id
 * inside a `[[…]]` reference, which is how "everything that mentions cfg_1a2b"
 * is asked for.
 */
function matchNote(note: Note, needle: string): Match<Note> | null {
  if (has(note.title, needle)) return { item: note };
  if (has(note.body, needle)) return { item: note, hint: snippet(note.body, needle) };
  return null;
}

function matchDataset(dataset: Dataset, needle: string): Match<Dataset> | null {
  return has(dataset.name, needle) ? { item: dataset } : null;
}

/**
 * Filters every list at once. An empty query passes everything through
 * untouched, so the caller renders one code path whether or not it is
 * searching.
 */
export function searchNav(
  query: string,
  lists: { configs: SchemaConfig[]; templates: ScriptTemplate[]; notes: Note[]; datasets: Dataset[] },
): NavResults {
  const needle = normalizeQuery(query);

  if (!needle) {
    return {
      configs: lists.configs.map(item => ({ item })),
      templates: lists.templates.map(item => ({ item })),
      notes: lists.notes.map(item => ({ item })),
      datasets: lists.datasets.map(item => ({ item })),
      total: lists.configs.length + lists.templates.length + lists.notes.length + lists.datasets.length,
    };
  }

  // Name hits first within each list, since a match on the title is what
  // someone typing a name is looking for; ties keep the list's own order.
  const byNameFirst = <T>(matches: Match<T>[]): Match<T>[] => [
    ...matches.filter(match => !match.hint),
    ...matches.filter(match => match.hint),
  ];

  const hit = <T>(items: T[], test: (item: T, needle: string) => Match<T> | null): Match<T>[] =>
    byNameFirst(items.map(item => test(item, needle)).filter((match): match is Match<T> => match !== null));

  const configs = hit(lists.configs, matchConfig);
  const templates = hit(lists.templates, matchTemplate);
  const notes = hit(lists.notes, matchNote);
  const datasets = hit(lists.datasets, matchDataset);

  return {
    configs,
    templates,
    notes,
    datasets,
    total: configs.length + templates.length + notes.length + datasets.length,
  };
}
