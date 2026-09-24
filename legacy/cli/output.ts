/**
 * What the CLI prints.
 *
 * Two audiences share every command: a person reading a terminal, and a script
 * piping the output somewhere. `--json` serves the second one with the API's
 * own JSON, unchanged, so nothing here has to be parsed back out — which is
 * also why the tables below are only ever a convenience, never the only way to
 * reach a value.
 */

/** Colour is for a terminal, not for a pipe or a CI log. */
const useColor = (): boolean => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const wrap = (code: number, text: string) => (useColor() ? `\u001b[${code}m${text}\u001b[0m` : text);

export const bold = (text: string) => wrap(1, text);
export const dim = (text: string) => wrap(2, text);
export const red = (text: string) => wrap(31, text);
export const green = (text: string) => wrap(32, text);

/** Cuts a cell to fit, with an ellipsis that says something was cut. */
export function truncate(text: string, max: number): string {
  if (max <= 1) return text.slice(0, max);
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * A plain aligned table.
 *
 * Columns are padded to their widest cell rather than to a fixed width, so a
 * list of short ids does not leave a field of whitespace, and the last column
 * is never padded — trailing spaces are invisible until something re-wraps
 * them.
 */
export function table(headers: string[], rows: string[][]): string {
  if (!rows.length) return "";

  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map(row => (row[column] ?? "").length)),
  );

  const line = (cells: string[]) =>
    cells
      .map((cell, column) => (column === cells.length - 1 ? cell : cell.padEnd(widths[column]!)))
      .join("  ")
      .trimEnd();

  // The header is styled after it is padded, so the escape codes it gains are
  // never counted as width by anything downstream.
  return [dim(line(headers)), ...rows.map(row => line(row))].join("\n");
}

/** `JSON.stringify` with the indentation a person would have used. */
export const json = (value: unknown): string => JSON.stringify(value, null, 2);

/**
 * A label-and-value block, for the commands that describe one record.
 *
 * Labels are right-padded to the longest of them so the values line up into a
 * column the eye can run down.
 */
export function describe(pairs: [string, string][]): string {
  const width = Math.max(...pairs.map(([label]) => label.length));
  return pairs.map(([label, value]) => `${dim(`${label.padEnd(width)}`)}  ${value}`).join("\n");
}

/** `1,000 rows`, `1 row` — the unit agrees with the number. */
export const count = (value: number, unit: string): string =>
  `${value.toLocaleString()} ${unit}${value === 1 ? "" : "s"}`;
