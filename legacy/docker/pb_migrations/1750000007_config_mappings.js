/// <reference path="../pb_data/types.d.ts" />

/**
 * Cross-configuration field mappings on a saved schema.
 *
 * A `reference` field already borrows a column from one particular dataset,
 * frozen to the id that dataset happened to get. That is the wrong unit for a
 * relationship between two schemas: "orders.customer_id comes from Customers"
 * is a fact about the schemas, and it should keep holding after Customers is
 * generated again. A mapping names the *configuration*, and the pool is read
 * from whatever that configuration most recently produced.
 *
 * A `json` array rather than a relation to a mappings collection, for the same
 * reason as `metadata`: mappings are read and written with the configuration
 * and never on their own, so a second collection would only add API rules to
 * keep in step with this one's. The far side is stored as a plain id rather
 * than a PocketBase relation, because a mapping may legitimately outlive the
 * configuration it points at — the editor shows such a row as unresolved
 * instead of having the link silently cleared out from under it.
 *
 * `required: false`, so every configuration saved before this migration reads
 * back as having no mappings, which is exactly what it had. 64 KB matches the
 * `metadata` field and is far past what src/lib/mappings.ts allows through.
 */
migrate(
  app => {
    const configs = app.findCollectionByNameOrId("configs");

    configs.fields.add(
      new Field({
        type: "json",
        name: "mappings",
        required: false,
        maxSize: 65536,
      }),
    );

    app.save(configs);
  },
  app => {
    const configs = app.findCollectionByNameOrId("configs");
    if (configs.fields.getByName("mappings")) configs.fields.removeByName("mappings");
    app.save(configs);
  },
);
