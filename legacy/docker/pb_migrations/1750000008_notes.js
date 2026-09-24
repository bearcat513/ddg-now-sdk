/// <reference path="../pb_data/types.d.ts" />

/**
 * Notes: Markdown a person writes about the rest of their workspace.
 *
 * A configuration says what it generates and a template says what is done
 * with the rows, but neither says *why* — which ticket asked for the schema,
 * what is still wrong with the seed data, which dataset the last demo used.
 * That is what a note holds, and the reason it is worth a collection rather
 * than another metadata pair: it is prose, and prose has nowhere to live in a
 * key/value field.
 *
 * A note's body carries `[[cfg_…]]` / `[[ds_…]]` / `[[tpl_…]]` references to
 * the other collections. They are stored as ids inside the text rather than as
 * relation fields on purpose: a reference is a position in a sentence, there
 * may be a dozen of them, and resolving one is a read through the caller's own
 * rules (src/server/notes.ts) — so a note can mention a record it is no longer
 * allowed to see without the note itself becoming unreadable.
 *
 * Private, unlike configurations and script templates: there is no
 * `sharedWith` field and every rule is the owner's own. Notes are the one
 * place someone writes for themselves.
 */
migrate(
  app => {
    const users = app.findCollectionByNameOrId("users");

    /** App-supplied id — `note_1a2b3c4d`, like every other record here. */
    const idField = {
      type: "text",
      name: "id",
      system: true,
      primaryKey: true,
      required: true,
      min: 3,
      max: 40,
      pattern: "^[a-z0-9_]+$",
      autogeneratePattern: "[a-z0-9]{15}",
    };

    const MINE = "owner = @request.auth.id";

    const notes = new Collection({
      name: "notes",
      type: "base",
      listRule: MINE,
      viewRule: MINE,
      createRule: '@request.auth.id != ""',
      updateRule: MINE,
      deleteRule: MINE,
      fields: [
        idField,
        {
          type: "relation",
          name: "owner",
          // Not required, for the same reason as everywhere else: the
          // ownership hook sets it, and a superuser may leave it unset.
          required: false,
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: true, // closing an account takes its notes with it
        },
        // Matches MAX_NOTE_TITLE_LENGTH / MAX_NOTE_BODY_LENGTH in
        // src/lib/notes.ts, which refuse first with a readable message.
        { type: "text", name: "title", required: true, min: 1, max: 200 },
        { type: "text", name: "body", required: false, max: 100000 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: [
        // The sidebar lists a person's own notes newest-edited first, which is
        // exactly this pair.
        "CREATE INDEX `idx_notes_owner_updated` ON `notes` (`owner`, `updated`)",
      ],
    });

    app.save(notes);
  },
  app => {
    try {
      app.delete(app.findCollectionByNameOrId("notes"));
    } catch (err) {
      // Already gone — nothing to undo.
    }
  },
);
