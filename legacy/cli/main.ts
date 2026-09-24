#!/usr/bin/env bun
/**
 * `ddg` — the API from a terminal.
 *
 * The whole CLI is `run()`; this is the file that hands it the real process.
 * Run it from source with `bun run src/cli/main.ts …`, or compile it into a
 * single binary with `bun run cli:build` — the same file either way, which is
 * why `process.argv` is sliced the same for both (it is: a compiled Bun binary
 * keeps the executable and the entry in argv[0] and argv[1]).
 *
 * `.then()` rather than a top-level `await`: `cli-build.ts --bytecode` emits
 * CommonJS, where top-level await is a syntax error, and a build flag should
 * not be able to break the entry point.
 */
import { run } from "./run";

run(process.argv.slice(2))
  .then(code => {
    process.exitCode = code;
  })
  .catch(error => {
    // `run` turns every expected failure into an exit code, so anything
    // arriving here is a bug and deserves its stack.
    console.error(error);
    process.exitCode = 1;
  });
