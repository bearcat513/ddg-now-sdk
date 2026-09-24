/// <reference path="../pb_data/types.d.ts" />

/**
 * The locale a saved schema generates in.
 *
 * Every name, address and phone number in a run is drawn from one faker
 * locale, and that choice belongs to the schema rather than to the person
 * running it: a schema written for a German address format produces nonsense
 * when someone else generates it in English.
 *
 * `required: false`, so every schema saved before this migration keeps
 * working — an empty locale means faker's default (English), which is exactly
 * what those schemas were generating already. The 20-character cap fits the
 * longest code faker ships (`ku_kmr_latin`) with room to spare, and an
 * unrecognized code falls back to the default at generation time rather than
 * failing the run.
 */
migrate(
  app => {
    const configs = app.findCollectionByNameOrId("configs");

    configs.fields.add(
      new Field({
        type: "text",
        name: "locale",
        required: false,
        max: 20,
      }),
    );

    app.save(configs);
  },
  app => {
    const configs = app.findCollectionByNameOrId("configs");
    if (configs.fields.getByName("locale")) configs.fields.removeByName("locale");
    app.save(configs);
  },
);
