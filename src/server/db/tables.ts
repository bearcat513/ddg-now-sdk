/**
 * The table names, in one place.
 *
 * The scope prefix eats 18 of the 30 characters a table name is allowed, so
 * every suffix here is short by necessity rather than by preference. Keeping
 * them as constants means the budget is visible in one file if the scope ever
 * changes, instead of spread across every query in the record layer.
 */

export const CONFIG_TABLE = 'x_1040823_ddg_now_config'
export const FIELD_TABLE = 'x_1040823_ddg_now_field'
export const MAPPING_TABLE = 'x_1040823_ddg_now_mapping'
export const DATASET_TABLE = 'x_1040823_ddg_now_dataset'

/** One row per person, holding how they like the workspace arranged. */
export const PREF_TABLE = 'x_1040823_ddg_now_user_pref'

/** Read with `gs.getProperty`, so an admin can tune it without a code change. */
export const MAX_ROWS_PROPERTY = 'x_1040823_ddg_now.max_rows'

/** Rows past this in one interactive transaction go to a scheduled job instead. */
export const SYNC_ROW_LIMIT_PROPERTY = 'x_1040823_ddg_now.sync_row_limit'

export const ROLE_USER = 'x_1040823_ddg_now.user'
export const ROLE_ADMIN = 'x_1040823_ddg_now.admin'
