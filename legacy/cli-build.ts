/**
 * Compiles `src/cli/main.ts` into a standalone `ddg` binary.
 *
 * Bun's `--compile` writes the bundled CLI and a copy of the Bun runtime into
 * one file, so what comes out of here runs on a machine with no Bun, no
 * `node_modules` and no source tree — which is the whole point of shipping a
 * CLI for an API that otherwise needs a browser or a `curl` incantation.
 *
 *   bun run cli:build                      # this platform, into dist/cli/
 *   bun run cli:build -- --all             # every supported platform
 *   bun run cli:build -- --target bun-linux-x64 --outdir build
 *   bun run cli:build -- --bytecode        # slower build, faster start
 *
 * Cross-compiling downloads that platform's Bun runtime the first time it is
 * asked for, so the first `--all` needs a network and a minute.
 */
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";

const ENTRY = "src/cli/main.ts";

/** The binary's name, and so the command someone ends up typing. */
const NAME = "ddg";

type Target = Bun.Build.CompileTarget;

/**
 * The platforms `--all` builds for.
 *
 * Both architectures on each desktop OS, and glibc Linux — the musl targets
 * exist (`bun-linux-x64-musl`) and are one `--target` away for anyone who
 * needs Alpine, but building six binaries nobody asked for is not a default.
 */
const ALL_TARGETS: Target[] = [
  "bun-darwin-arm64",
  "bun-darwin-x64",
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-windows-x64",
];

/** A `--target` value, checked here so a typo fails before the download. */
const KNOWN_TARGETS = new Set<string>([
  ...ALL_TARGETS,
  "bun-linux-x64-musl",
  "bun-linux-arm64-musl",
  "bun-windows-arm64",
]);

/* --------------------------------- flags --------------------------------- */

const argv = process.argv.slice(2);

/** `--flag value`, `--flag=value`, and repeatable `--target`. */
function flagValues(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]!;
    if (token === `--${name}`) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`--${name} needs a value.`);
      values.push(value);
      index++;
    } else if (token.startsWith(`--${name}=`)) {
      values.push(token.slice(name.length + 3));
    }
  }
  return values;
}

const has = (name: string) => argv.includes(`--${name}`);

const outdir = flagValues("outdir")[0] ?? path.join("dist", "cli");
const bytecode = has("bytecode");
const minify = !has("no-minify");

for (const target of flagValues("target")) {
  if (!KNOWN_TARGETS.has(target)) {
    throw new Error(`Unknown --target "${target}". Try one of: ${[...KNOWN_TARGETS].join(", ")}.`);
  }
}

// No target at all means "this machine", which is what a local build wants
// and what `bun build --compile` does when it is not told otherwise.
const targets: (Target | undefined)[] = has("all") ? [...ALL_TARGETS] : (flagValues("target") as Target[]);
if (!targets.length) targets.push(undefined);

/* --------------------------------- build --------------------------------- */

const { version } = (await Bun.file("package.json").json()) as { version: string };

/** Same file, many platforms: the target is in the name or nothing tells them apart. */
function outfile(target: Target | undefined): string {
  const suffix = target ? `-${target.replace(/^bun-/, "")}` : "";
  const extension = target?.includes("windows") ? ".exe" : "";
  return path.join(outdir, `${NAME}${suffix}${extension}`);
}

// Emptied and recreated: `--bytecode` writes through a temporary file in the
// output directory and fails outright when it is not already there.
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const started = performance.now();

for (const target of targets) {
  const out = outfile(target);

  const result = await Bun.build({
    entrypoints: [ENTRY],
    target: "bun",
    minify,
    // Stack traces from a minified bundle name the wrong line otherwise; with
    // --compile the map is embedded, so there is no second file to ship.
    sourcemap: "linked",
    // Moves parsing from every startup to this one build. Opt-in, because it
    // costs build time and is the first thing to turn off when a binary
    // misbehaves.
    bytecode,
    define: {
      // Read by `src/cli/main.ts`, which falls back to "dev" when it is absent
      // — so `bun run src/cli/main.ts --version` still answers.
      DDG_CLI_VERSION: JSON.stringify(version),
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    compile: target ? { target, outfile: out } : { outfile: out },
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    throw new Error(`Compiling ${ENTRY} failed${target ? ` for ${target}` : ""}.`);
  }

  // `--compile` writes the binary itself rather than returning its bytes, so
  // the size is read back off disk.
  const written = Bun.file(out);
  const size = (await written.exists()) ? written.size : 0;
  console.log(` ${out}  ${(size / 1024 / 1024).toFixed(1)} MB${target ? `  ${target}` : ""}`);
}

// `--compile` embeds the source map in the binary itself — a stack trace out
// of one names the .ts line it came from with nothing else on disk — so the
// .map the bundler also drops beside it is a by-product, not something to ship.
for (const stray of new Bun.Glob("*.map").scanSync(outdir)) {
  await rm(path.join(outdir, stray), { force: true });
}

console.log(
  ` ${targets.length} binar${targets.length === 1 ? "y" : "ies"} in ` +
    `${((performance.now() - started) / 1000).toFixed(1)}s${bytecode ? " (bytecode)" : ""}`,
);
