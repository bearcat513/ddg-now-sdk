/// <reference path="../pb_data/types.d.ts" />

/**
 * Free-form key/value pairs on a saved schema.
 *
 * What a schema is for — the team that owns it, the ticket it came from, the
 * environment it seeds — rarely fits in its name, and every attempt to encode
 * it there ends up in the name. This is where it goes instead.
 *
 * A `json` object rather than a relation to a pairs collection: they are read
 * and written with the configuration, never on their own, and a separate
 * collection would mean its own API rules to keep in step with the schema's.
 * `required: false`, so every configuration saved before this migration keeps
 * working and reads back as no metadata at all.
 *
 * 64 KB is far more than labels need and still bounded; src/lib/metadata.ts
 * refuses anything past 50 pairs with a readable error long before this.
 */
migrate(
  app => {
    const configs = app.findCollectionByNameOrId("configs");

    configs.fields.add(
      new Field({
        type: "json",
        name: "metadata",
        required: false,
        maxSize: 65536,
      }),
    );

    app.save(configs);
  },
  app => {
    const configs = app.findCollectionByNameOrId("configs");
    if (configs.fields.getByName("metadata")) configs.fields.removeByName("metadata");
    app.save(configs);
  },
);
