import { useCallback, useMemo, useRef } from "react";
import { Excalidraw, getSceneVersion, serializeAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, ExcalidrawProps } from "@excalidraw/excalidraw/types";
// Not `@excalidraw/excalidraw/index.css`: the package exports its stylesheet
// only under the `development` and `production` conditions, which the SDK's
// resolver asks for neither of. `tools/build-css.mjs` copies the production
// file here, fonts and all — see `copyExcalidrawCss` for why it is a copy.
import "../../generated/excalidraw/index.css";

/**
 * The drawing surface itself, and the only file that imports Excalidraw.
 *
 * It is loaded with `React.lazy` from `WhiteboardPanel`, so the library — the
 * largest thing this page ships by far — becomes its own chunk and is only
 * fetched by someone who opens a board. Everything else about a board (its
 * name, saving, whose it is) lives in the panel; this file knows how to turn a
 * stored scene into a canvas and a canvas back into a stored scene.
 */

type OnChange = NonNullable<ExcalidrawProps["onChange"]>;

/** What the panel can ask of the canvas once it is up. */
export type CanvasHandle = {
  /** The scene as Excalidraw writes a `.excalidraw` file, and the edit it reflects. */
  serialize: () => { scene: string; fingerprint: string };
  /** Records that the scene as of `fingerprint` is the stored one. */
  markSaved: (fingerprint: string) => void;
};

type Props = {
  /** The stored scene. Read once: the canvas is remounted to show another board. */
  scene: string;
  dark: boolean;
  name: string;
  onReady: (handle: CanvasHandle) => void;
  onDirtyChange: (dirty: boolean) => void;
};

/**
 * What an edit changes, cheaply.
 *
 * `onChange` fires on every pointer move, so serializing the scene there to
 * compare it with the stored one would re-encode every pasted image dozens of
 * times a second. Excalidraw's scene version is the sum of element versions,
 * which moves on every real edit to an element, including a deletion; the
 * background colour and the file count cover the two things a `.excalidraw`
 * file carries that are not elements.
 */
function fingerprintOf(...[elements, appState, files]: Parameters<OnChange>): string {
  return `${getSceneVersion(elements)}:${appState.viewBackgroundColor}:${Object.keys(files).length}`;
}

function parseScene(scene: string) {
  try {
    const parsed = JSON.parse(scene);
    return {
      elements: Array.isArray(parsed.elements) ? parsed.elements : [],
      appState: parsed.appState ?? {},
      files: parsed.files ?? {},
      // Excalidraw restores from older versions itself; `initialData` is run
      // through its own `restore`, so nothing here has to repair a scene.
    };
  } catch {
    return null;
  }
}

export default function WhiteboardCanvas({ scene, dark, name, onReady, onDirtyChange }: Props) {
  /** The fingerprint of what is stored; null until the canvas has loaded. */
  const baseline = useRef<string | null>(null);
  const current = useRef<string | null>(null);
  const dirty = useRef(false);

  // Parsed once per mount. Excalidraw reads `initialData` on mount only, so a
  // fresh object on every render would be ignored anyway.
  const initialData = useMemo(() => parseScene(scene), [scene]);

  const report = useCallback(() => {
    const next = baseline.current !== null && current.current !== baseline.current;
    if (next === dirty.current) return;
    dirty.current = next;
    onDirtyChange(next);
  }, [onDirtyChange]);

  const onChange = useCallback<OnChange>(
    (elements, appState, files) => {
      current.current = fingerprintOf(elements, appState, files);
      // The first change Excalidraw reports is the loaded scene itself, so it
      // is the baseline rather than an edit.
      if (baseline.current === null) baseline.current = current.current;
      report();
    },
    [report],
  );

  const excalidrawAPI = useCallback(
    (instance: ExcalidrawImperativeAPI) => {
      onReady({
        serialize: () => {
          const elements = instance.getSceneElements();
          const appState = instance.getAppState();
          const files = instance.getFiles();
          return {
            scene: serializeAsJSON(elements, appState, files, "local"),
            fingerprint: fingerprintOf(elements, appState, files),
          };
        },
        markSaved: fingerprint => {
          // The fingerprint from when the save was *sent*, not from now: an
          // edit made while the request was out is still unsaved.
          baseline.current = fingerprint;
          report();
        },
      });
    },
    [onReady, report],
  );

  return (
    <Excalidraw
      initialData={initialData}
      excalidrawAPI={excalidrawAPI}
      onChange={onChange}
      theme={dark ? "dark" : "light"}
      name={name}
      UIOptions={{
        canvasActions: {
          // Saving is the page's — to the record, not to a file on disk — and
          // Ctrl/⌘-S is bound to that. Export and Open stay, so a board can
          // still leave as, or start from, a `.excalidraw` file.
          saveToActiveFile: false,
        },
      }}
    />
  );
}
