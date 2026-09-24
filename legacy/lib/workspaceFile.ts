/**
 * The workspace file: everything an account has written, in one JSON
 * document — every configuration, every script template, every note, and the
 * preferences.
 *
 * Where a `*.ddg.json` file moves one schema between machines, this moves the
 * whole workspace: a backup to keep in a repo, or the thing you hand someone
 * setting up their own instance.
 *
 * Each entry under `configs` is itself a complete `*.ddg.json` document, built
 * by the same `buildConfigFile` the single-configuration download uses, so one
 * entry lifted out of the bundle imports through `POST /api/configs/import`
 * unchanged and the two exports can never disagree.
 *
 * Generated datasets are deliberately left out. They are data rather than
 * configuration, a single one can run to tens of megabytes, and every dataset
 * already has its own CSV and JSON download.
 *
 * Notes are in, and they keep their ids: a note's body carries `[[cfg_…]]`
 * references to the records around it, and an export that renamed everything
 * would be an export of broken sentences. The ids are what those references
 * are written against, so a restored workspace still reads.
 */
import { buildConfigFile, type ConfigFile } from "./configFile";
import type { Note } from "./notes";
import type { Preferences } from "./preferences";
import type { ScriptTemplate } from "./scriptTemplate";
import type { SchemaConfig } from "./types";

export const WORKSPACE_FILE_KIND = "dummy-data-generator/workspace";
export const WORKSPACE_FILE_VERSION = 1;

/**
 * A configuration as it appears in the bundle: the portable file, plus a flag
 * on the ones that came from somebody else's account. `sharedWithMe` is an
 * extra key the single-configuration importer ignores.
 */
export type WorkspaceConfigEntry = ConfigFile & { sharedWithMe?: true };

export type WorkspaceTemplateEntry = {
  name: string;
  body: string;
  sharedWithMe?: true;
};

/** A note, with the id its references are resolved against. */
export type WorkspaceNoteEntry = {
  id: string;
  title: string;
  body: string;
};

export type WorkspaceFile = {
  kind: typeof WORKSPACE_FILE_KIND;
  version: number;
  exportedAt: string;
  /** The account the export was taken from. */
  exportedBy: string;
  preferences: Preferences;
  configs: WorkspaceConfigEntry[];
  scriptTemplates: WorkspaceTemplateEntry[];
  notes: WorkspaceNoteEntry[];
};

export type WorkspaceInput = {
  /** Whose export this is — decides what counts as "shared with me". */
  ownerId: string;
  email: string;
  configs: SchemaConfig[];
  templates: ScriptTemplate[];
  /** Always the exporter's own: notes are never shared. */
  notes: Note[];
  preferences: Preferences;
};

export function buildWorkspaceFile({
  ownerId,
  email,
  configs,
  templates,
  notes,
  preferences,
}: WorkspaceInput): WorkspaceFile {
  const shared = (record: { ownerId: string }) => (record.ownerId === ownerId ? {} : { sharedWithMe: true as const });

  return {
    kind: WORKSPACE_FILE_KIND,
    version: WORKSPACE_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy: email,
    preferences,
    configs: configs.map(config => ({ ...buildConfigFile(config), ...shared(config) })),
    scriptTemplates: templates.map(template => ({
      name: template.name,
      body: template.body,
      ...shared(template),
    })),
    notes: notes.map(note => ({ id: note.id, title: note.title, body: note.body })),
  };
}

export function serializeWorkspaceFile(input: WorkspaceInput): string {
  return JSON.stringify(buildWorkspaceFile(input), null, 2);
}

/** "ddg-workspace-2026-09-16.json" — sortable, and obvious a year later. */
export function workspaceFileName(date = new Date()): string {
  return `ddg-workspace-${date.toISOString().slice(0, 10)}.json`;
}
