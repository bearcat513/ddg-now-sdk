import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    '../../node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/Assistant-Bold.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: '24ef5133f6554291b3f753609664348d'
                        deleted: true
                    }
                    '../../node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/Assistant-Medium.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: '450b9763b8c44246bdce5def063ee996'
                        deleted: true
                    }
                    '../../node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/Assistant-Regular.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: 'b504c09b19024415acc6ae791983cce9'
                        deleted: true
                    }
                    '../../node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/Assistant-SemiBold.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: '3d26686cad504345bfaa7b633b30ba1e'
                        deleted: true
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '4c98e328d9024a7093942142f7a2c0cb'
                    }
                    'config-create': {
                        table: 'sys_security_acl'
                        id: '9bd30d701f1f4017b6aec65569aa2a22'
                    }
                    'config-delete': {
                        table: 'sys_security_acl'
                        id: '604753920234417eaf5d689690a59dca'
                    }
                    'config-read': {
                        table: 'sys_security_acl'
                        id: '2e2071c2228b4c619bee0ce0bd4b6086'
                    }
                    'config-related-list-datasets': {
                        table: 'sys_ui_related_list_entry'
                        id: '26aa82e33db44e49b390f012c6715e30'
                    }
                    'config-related-list-fields': {
                        table: 'sys_ui_related_list_entry'
                        id: '6c5525be7d764170bdcc223773359645'
                    }
                    'config-related-list-mappings': {
                        table: 'sys_ui_related_list_entry'
                        id: '3e5b0cbd4efa488db7e0b5fceaa1ea48'
                    }
                    'config-related-lists': {
                        table: 'sys_ui_related_list'
                        id: '31df3fe50a6d40a49966aace5cdaca65'
                    }
                    'config-write': {
                        table: 'sys_security_acl'
                        id: '4783798ec24f407b8a529b944ecfae2c'
                    }
                    'dataset-create': {
                        table: 'sys_security_acl'
                        id: 'e2abed3e4d214345b1986dcb48995feb'
                    }
                    'dataset-delete': {
                        table: 'sys_security_acl'
                        id: 'eef76f3990da41ecbc25d0ef401feec0'
                    }
                    'dataset-read': {
                        table: 'sys_security_acl'
                        id: 'bfb200c957fb478aaefce4427fd80036'
                    }
                    'dataset-write': {
                        table: 'sys_security_acl'
                        id: 'ec04db9b75b24123ac584edddb8aba97'
                    }
                    'ddg-api': {
                        table: 'sys_ws_definition'
                        id: '1b084fbfe1a145158a8f24e40df5cf8f'
                    }
                    'ddg-api-config': {
                        table: 'sys_ws_operation'
                        id: '4535861c6038420d9a2fb19f83795ac6'
                    }
                    'ddg-api-config-list': {
                        table: 'sys_ws_operation'
                        id: '8aa0e3e86b8c453e9240d96898b2c72b'
                    }
                    'ddg-api-create-config': {
                        table: 'sys_ws_operation'
                        id: '5f8979be58ff4ff6b054911e84fe7221'
                    }
                    'ddg-api-create-template': {
                        table: 'sys_ws_operation'
                        id: '73cc6149b57e40bb8bde9d934c8deacd'
                    }
                    'ddg-api-create-whiteboard': {
                        table: 'sys_ws_operation'
                        id: 'f5fa496a47c748cc9cdeac10612089c4'
                    }
                    'ddg-api-dataset': {
                        table: 'sys_ws_operation'
                        id: '7ebd273fba884016822464b728b158f9'
                    }
                    'ddg-api-dataset-list': {
                        table: 'sys_ws_operation'
                        id: '4833d8f9abe74bb6bd578f773cd87ef4'
                    }
                    'ddg-api-dataset-rows': {
                        table: 'sys_ws_operation'
                        id: '7ae51e36fda741418a7c2d8304b4bbad'
                    }
                    'ddg-api-dataset-script': {
                        table: 'sys_ws_operation'
                        id: 'a91945975485421dad7667f644db7cae'
                    }
                    'ddg-api-dataset-script-dataset-id': {
                        table: 'sys_ws_query_parameter'
                        id: '5a83d2b97f6e4f32aa3cf76b54df7eb8'
                    }
                    'ddg-api-delete-config': {
                        table: 'sys_ws_operation'
                        id: 'deac769239d549c795e5ee40d23d0a26'
                    }
                    'ddg-api-delete-dataset': {
                        table: 'sys_ws_operation'
                        id: 'fb95bf40817d4562925bc4d6a2d641a8'
                    }
                    'ddg-api-delete-template': {
                        table: 'sys_ws_operation'
                        id: '3d9aa1bccf8a4e0aa338ea5ca39a5c9e'
                    }
                    'ddg-api-delete-whiteboard': {
                        table: 'sys_ws_operation'
                        id: '9f8f70d6b7ba4774bdb7967a3cfba548'
                    }
                    'ddg-api-export': {
                        table: 'sys_ws_operation'
                        id: 'db6b0794728540a2a2c011fa8258897f'
                    }
                    'ddg-api-generate': {
                        table: 'sys_ws_operation'
                        id: '2eb7f0e396014ea7b559557e564c34ca'
                    }
                    'ddg-api-generate-config-id': {
                        table: 'sys_ws_query_parameter'
                        id: '9eb1cbe3456d48b48a2a2302e6340136'
                    }
                    'ddg-api-infer': {
                        table: 'sys_ws_operation'
                        id: '491f3003fbc7423ab51db7a45cb79ddb'
                    }
                    'ddg-api-insert-dataset': {
                        table: 'sys_ws_operation'
                        id: '70f475e22eb34225834bc191c3ff8bfb'
                    }
                    'ddg-api-insert-dataset-dataset-id': {
                        table: 'sys_ws_query_parameter'
                        id: '4907a11dfbbd47658242bb2ae8ad9da2'
                    }
                    'ddg-api-openapi': {
                        table: 'sys_ws_operation'
                        id: '07a2d4f6f8bb4f208e0aa23c7808be41'
                    }
                    'ddg-api-preferences': {
                        table: 'sys_ws_operation'
                        id: '371ff3ca3de340fb9a8e760b967c6e68'
                    }
                    'ddg-api-preview': {
                        table: 'sys_ws_operation'
                        id: '49f7590892df4830af539b647654a31f'
                    }
                    'ddg-api-public-whiteboard': {
                        table: 'sys_ws_operation'
                        id: '3ddc061ae3e74234a351a4fa41289e3d'
                    }
                    'ddg-api-template': {
                        table: 'sys_ws_operation'
                        id: '13b3a285c0834a1186c3cda9c7fe2953'
                    }
                    'ddg-api-template-list': {
                        table: 'sys_ws_operation'
                        id: '61e5fe49dfe54ecb88fa5a1a947a5783'
                    }
                    'ddg-api-update-config': {
                        table: 'sys_ws_operation'
                        id: '64bfb659885d412694eb1fb5e6de71db'
                    }
                    'ddg-api-update-preferences': {
                        table: 'sys_ws_operation'
                        id: '28600d8419874784bff9d1c135498eb9'
                    }
                    'ddg-api-update-template': {
                        table: 'sys_ws_operation'
                        id: 'fcb6323fd4cb42c396542f3f56f084e0'
                    }
                    'ddg-api-update-whiteboard': {
                        table: 'sys_ws_operation'
                        id: 'eac039dd7cfc4c9195fc108ff1dcd0af'
                    }
                    'ddg-api-update-whiteboard-share': {
                        table: 'sys_ws_operation'
                        id: 'bf6c52cce1d841588adb7a8855282974'
                    }
                    'ddg-api-whiteboard': {
                        table: 'sys_ws_operation'
                        id: '1be577b2a71e497e9413d414b91ea148'
                    }
                    'ddg-api-whiteboard-list': {
                        table: 'sys_ws_operation'
                        id: '617903fa214a472a819bedda1f86b6ec'
                    }
                    'ddg-drain-queue': {
                        table: 'sysauto_script'
                        id: '8ed2f373de754a0ea2ea3168b5e997c6'
                    }
                    'ddg-generate-action': {
                        table: 'sys_ui_action'
                        id: 'f8547712fe334c2c91aa57efbd557a33'
                    }
                    'ddg-menu': {
                        table: 'sys_app_application'
                        id: '23b7cdc483c7433f8fcb922beccea6c9'
                    }
                    'ddg-module-config-new': {
                        table: 'sys_app_module'
                        id: '92bf2521693044c7969bc7d84e792cad'
                    }
                    'ddg-module-configs': {
                        table: 'sys_app_module'
                        id: '3cd94fddbd3c49f091c27ead54939df5'
                    }
                    'ddg-module-datasets': {
                        table: 'sys_app_module'
                        id: 'd37194b741cd4cb692e5b05f3e548740'
                    }
                    'ddg-module-datasets-failed': {
                        table: 'sys_app_module'
                        id: '912fad16677b49c4b6630402ed4ac218'
                    }
                    'ddg-module-datasets-sep': {
                        table: 'sys_app_module'
                        id: 'bb57349fc63b4690aaacc38e999bc229'
                    }
                    'ddg-module-records-sep': {
                        table: 'sys_app_module'
                        id: 'df725e3c6082406ea946239e754268ec'
                    }
                    'ddg-module-studio': {
                        table: 'sys_app_module'
                        id: '2c63b1288771495da43f6344b96c69eb'
                    }
                    'ddg-module-whiteboards': {
                        table: 'sys_app_module'
                        id: '0faf0a021c2b446f87e4b4f3da6dbb32'
                    }
                    'ddg-set-preference-owner': {
                        table: 'sys_script'
                        id: 'a9a2cf5abce94f0881a3f05397aa924e'
                    }
                    'ddg-validate-field': {
                        table: 'sys_script'
                        id: '6726194b283b49c2aaecc93f908942a7'
                    }
                    'ddg-whiteboard-share-public': {
                        table: 'sys_public'
                        id: '194b774d15584b04967ae6d56e80a250'
                    }
                    DdgAjax: {
                        table: 'sys_script_include'
                        id: 'e20d611018c24b1b9e5b67d27f12bb06'
                    }
                    DdgGenerator: {
                        table: 'sys_script_include'
                        id: '2143047803594212897faa8fa1fb9ab0'
                    }
                    DdgPublicWhiteboard: {
                        table: 'sys_script_include'
                        id: '5a5e49313ae44c3c87922d7bb0f84a43'
                    }
                    'demo-config-tickets': {
                        table: 'x_1040823_ddg_now_config'
                        id: '06e26530e761410cad1987d07ddebcb0'
                    }
                    'demo-field-closed': {
                        table: 'x_1040823_ddg_now_field'
                        id: '4d925943aba045449504b9d25d6aaec0'
                    }
                    'demo-field-cost': {
                        table: 'x_1040823_ddg_now_field'
                        id: '71a87411d9d040f8a6af921485c8db58'
                    }
                    'demo-field-csat': {
                        table: 'x_1040823_ddg_now_field'
                        id: '7e56317afc2b4974a6f58f4607f91445'
                    }
                    'demo-field-minutes': {
                        table: 'x_1040823_ddg_now_field'
                        id: '473de37917e045148dcbefea0328646f'
                    }
                    'demo-field-number': {
                        table: 'x_1040823_ddg_now_field'
                        id: 'b6289818120f4abba9682c986c3ac733'
                    }
                    'demo-field-opened': {
                        table: 'x_1040823_ddg_now_field'
                        id: '13a417ba48784d0eac6a026b05cb2180'
                    }
                    'demo-field-priority': {
                        table: 'x_1040823_ddg_now_field'
                        id: 'bf3a1c0747a34e6a887a8deaa86c3482'
                    }
                    'demo-field-rate': {
                        table: 'x_1040823_ddg_now_field'
                        id: 'f6e157ff48864413a7c0de6fb4f16e4d'
                    }
                    'demo-field-reporter': {
                        table: 'x_1040823_ddg_now_field'
                        id: 'ad351faebee745dab27b969ef2d6ac60'
                    }
                    'demo-field-short-desc': {
                        table: 'x_1040823_ddg_now_field'
                        id: '5def6459c96a407990c3afcb5fe0a017'
                    }
                    'demo-field-state': {
                        table: 'x_1040823_ddg_now_field'
                        id: '9e245e5e941748caa7aedaa4f7ff769e'
                    }
                    'field-create': {
                        table: 'sys_security_acl'
                        id: 'a56c2595d7ca4e1d9f8ac6b443002410'
                    }
                    'field-delete': {
                        table: 'sys_security_acl'
                        id: 'fd905064ec2b40bd970e89b7dfadf60e'
                    }
                    'field-read': {
                        table: 'sys_security_acl'
                        id: 'e09be432962847999d1eddf3d7194e7b'
                    }
                    'field-write': {
                        table: 'sys_security_acl'
                        id: 'fab09c39cf5843f693b33c6a9ccedd5b'
                    }
                    'generated/app.css': {
                        table: 'sys_ux_theme_asset'
                        id: '32379f4f0a9746d7b40aee20b187945c'
                    }
                    'generated/excalidraw/fonts/Assistant/Assistant-Bold.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: '27c30a84b0db437e8838b13d6ff74065'
                    }
                    'generated/excalidraw/fonts/Assistant/Assistant-Medium.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: '386ff4e4e5ae443a9272e10264618b99'
                    }
                    'generated/excalidraw/fonts/Assistant/Assistant-Regular.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: '59f3cb2b540742c1abac5b73c0b774bc'
                    }
                    'generated/excalidraw/fonts/Assistant/Assistant-SemiBold.woff2': {
                        table: 'sys_ux_theme_asset'
                        id: '78fbfbc4030c451a84bd8ced25b1414b'
                    }
                    'generated/excalidraw/index.css': {
                        table: 'sys_ux_theme_asset'
                        id: 'c4b0225f02234cfc806946a1123ff1c6'
                    }
                    'mapping-create': {
                        table: 'sys_security_acl'
                        id: 'cd067bc9497d45838267187fc78838b3'
                    }
                    'mapping-delete': {
                        table: 'sys_security_acl'
                        id: 'f3c5d65ff4854ddb9167e9fd1819dd4b'
                    }
                    'mapping-read': {
                        table: 'sys_security_acl'
                        id: '191d6c6d1dd441119640e0d5e8f67311'
                    }
                    'mapping-write': {
                        table: 'sys_security_acl'
                        id: '50b12c1adf1345a6a860cc6756250980'
                    }
                    'node_modules/@excalidraw/excalidraw/dist/prod/index.css': {
                        table: 'sys_ux_theme_asset'
                        id: '63a35bb931484ba38257f47edc411923'
                        deleted: true
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '612363ce1a404a24a33dfc9e8c7c9e79'
                    }
                    'pref-create': {
                        table: 'sys_security_acl'
                        id: 'b734be3b315546b79cc49fdaf1c366c8'
                    }
                    'pref-delete': {
                        table: 'sys_security_acl'
                        id: '4859336e8a75439387b12dee44a0f6ae'
                    }
                    'pref-read': {
                        table: 'sys_security_acl'
                        id: '804e73f3d4eb4a53a5869237cd2f1331'
                    }
                    'pref-write': {
                        table: 'sys_security_acl'
                        id: '8e1d070045b34235bf67d83b00f7b441'
                    }
                    'prop-max-rows': {
                        table: 'sys_properties'
                        id: 'd369a9ccbfc240d098e51f0c39f4e5b9'
                    }
                    'prop-sync-row-limit': {
                        table: 'sys_properties'
                        id: '334c524742b54fc4ba2573f18eea506a'
                    }
                    src_server_bridge_ts: {
                        table: 'sys_module'
                        id: 'ec3c71c4fa894d7dab88c2f2fba78fbb'
                    }
                    'src_server_business-rules_set-preference-owner_ts': {
                        table: 'sys_module'
                        id: '1286469c3bc948f690727464bf8ebfcb'
                    }
                    'src_server_business-rules_validate-field_ts': {
                        table: 'sys_module'
                        id: '7ed4b77ef4694bf4a91eb02393b015d7'
                    }
                    src_server_db_db_ts: {
                        table: 'sys_module'
                        id: '032bcc9222e34490999d9d5eca14a9d3'
                    }
                    src_server_db_preferences_ts: {
                        table: 'sys_module'
                        id: 'c979b19afe274047978449210a39540f'
                    }
                    src_server_db_tables_ts: {
                        table: 'sys_module'
                        id: '7a296525f9d54eda8d4895c0e2151744'
                    }
                    src_server_db_templates_ts: {
                        table: 'sys_module'
                        id: 'ad11542aed054ebc99398382902586c9'
                    }
                    src_server_db_whiteboards_ts: {
                        table: 'sys_module'
                        id: '168df92f65c0470d956d332b425424b8'
                    }
                    src_server_export_export_ts: {
                        table: 'sys_module'
                        id: '0235d3f030404e2f9535b254ec67a4d3'
                    }
                    src_server_generate_choices_ts: {
                        table: 'sys_module'
                        id: '9f6b1528aacb42a59a835865be9c6239'
                    }
                    src_server_generate_data_en_ts: {
                        table: 'sys_module'
                        id: '4e7463f411944bc9b911cffcf98e0d4c'
                    }
                    src_server_generate_data_shape_ts: {
                        table: 'sys_module'
                        id: 'e89905b01e1b4af6a42f3079df134b54'
                    }
                    src_server_generate_generate_ts: {
                        table: 'sys_module'
                        id: 'e9834f01f53848cd8e56cd634d46f585'
                    }
                    src_server_generate_insert_ts: {
                        table: 'sys_module'
                        id: '8b73d40250f845ec97353a701f9682c6'
                    }
                    src_server_generate_random_ts: {
                        table: 'sys_module'
                        id: 'db5aa884a1a448af83e8f0df2a2d12e6'
                    }
                    src_server_infer_infer_ts: {
                        table: 'sys_module'
                        id: 'adb79a2592e04a1d832d4c659316a002'
                    }
                    'src_server_jobs_drain-queue_ts': {
                        table: 'sys_module'
                        id: 'fa7fa6be5de644fbbf2942a9667613a1'
                    }
                    src_server_lib_datasetName_ts: {
                        table: 'sys_module'
                        id: '12467761b51d444a9d5b9cad5144b9ef'
                    }
                    src_server_lib_formula_ts: {
                        table: 'sys_module'
                        id: 'aa92abef21a240529dfe1837d65c420d'
                    }
                    src_server_lib_openapi_ts: {
                        table: 'sys_module'
                        id: '0e2607795578450bb7aff6f31571a976'
                    }
                    src_server_lib_preferences_ts: {
                        table: 'sys_module'
                        id: 'f58afe6e72534e9a852045bf70ffd8ce'
                    }
                    src_server_lib_rows_ts: {
                        table: 'sys_module'
                        id: '946bf06a48cf4caf93d3c288e884c221'
                    }
                    src_server_lib_scriptTemplate_ts: {
                        table: 'sys_module'
                        id: '8f2d319cc37e481b9658f47848399368'
                    }
                    src_server_lib_types_ts: {
                        table: 'sys_module'
                        id: '7cff906f9d1940aaa6f0145470e3a282'
                    }
                    src_server_lib_whiteboard_ts: {
                        table: 'sys_module'
                        id: 'd7c2f65a79f2413ca1cf872d801a6a4d'
                    }
                    src_server_rest_handlers_ts: {
                        table: 'sys_module'
                        id: '531ed954441744adadb1a9f010520303'
                    }
                    src_server_rest_http_ts: {
                        table: 'sys_module'
                        id: '9bfca1c991394afca9c487d6b5d5128e'
                    }
                    'src_server_rest_public-whiteboard_ts': {
                        table: 'sys_module'
                        id: '0b27364afea0487bae316807a751f978'
                    }
                    src_server_run_ts: {
                        table: 'sys_module'
                        id: '32cd997939d847d9a978b06a89968052'
                    }
                    'src_server_ui-actions_generate_ts': {
                        table: 'sys_module'
                        id: '6357d9a351a249cb9e87617454cbfb14'
                    }
                    'studio-page-execute': {
                        table: 'sys_security_acl'
                        id: 'ced860710b0046068daad1b22572928d'
                    }
                    'template-create': {
                        table: 'sys_security_acl'
                        id: 'a4d998900536407e8f9b771c69b2a86a'
                    }
                    'template-delete': {
                        table: 'sys_security_acl'
                        id: 'd7de0f87d7254ce3bebb79043a2a4fbc'
                    }
                    'template-read': {
                        table: 'sys_security_acl'
                        id: '245f44fc303a44ea9e584fae5fe32a0a'
                    }
                    'template-write': {
                        table: 'sys_security_acl'
                        id: '2e8526cae15e4ce4b62679fe062300c7'
                    }
                    'whiteboard-create': {
                        table: 'sys_security_acl'
                        id: 'b504934ac6a74c1494c5ee4c3fa57c7b'
                    }
                    'whiteboard-delete': {
                        table: 'sys_security_acl'
                        id: '6732059ead0542a39f5e213cd40ac597'
                    }
                    'whiteboard-read': {
                        table: 'sys_security_acl'
                        id: 'e165d5b379f1485eaa13169e7f6537c9'
                    }
                    'whiteboard-share-page-read': {
                        table: 'sys_security_acl'
                        id: '889c4356ea454528be18a07ba04b7db8'
                    }
                    'whiteboard-share-password-read': {
                        table: 'sys_security_acl'
                        id: '8b4dde0e9c7048f0827ae0ff5cfd3a16'
                    }
                    'whiteboard-share-token-read': {
                        table: 'sys_security_acl'
                        id: 'cd4139d7c11149c8903d3c98ed665f0c'
                    }
                    'whiteboard-write': {
                        table: 'sys_security_acl'
                        id: '8490cf956e13429ba1dbb722f05e3190'
                    }
                }
                composite: [
                    {
                        table: 'sys_ux_lib_asset'
                        id: '000d8c98003c46349a860b90db79d908'
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A-COD1tkK5'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '003600b4418344329d11a62d9dfc814d'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_export_format'
                            value: 'csv'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '005930882a694e30952c4cfe5ec15c35'
                        key: {
                            name: 'x_1040823_ddg_now/pt-BR-5N22H2LF-CAn5-DTZ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '006a3b6002b542e3b422ae9950511cce'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0071f891356a4cb3b5d0e1cd41ffa6f6'
                        key: {
                            name: 'x_1040823_ddg_now/ku-TR-6OUDTVRD-DOdHKN89.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0094eb70d50c4681872c6e0ef534896f'
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO-DpvKmDkb'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '00b14e77911c4c72b04f8a117461d234'
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO-DxLdtPgG.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '00bed5b0b8fc4d248f4e6cb4fba72651'
                        key: {
                            application_file: '631b7e4f23e74970a99e42051baaec39'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '00c8fcc7b3a444e5b90f4896946229f2'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '00ef726754d04a86bc8bf217e4970a91'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_protected'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '00fbc05443884eb6bdc89e4e74d56052'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'scene'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '01a1e40edb514a5ca3740e500fa50c13'
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4-BMx-8h2f'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '01c764bea74544139ee8dd6f1c46b7f9'
                        key: {
                            name: 'x_1040823_ddg_now/id-ID-SAP4L64H-Cdeid6ka'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0201916b7b6d4f57b5fc96c4190c2c65'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0236ceb15d8a4fdabbba9427afc53c35'
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7-yRd63pL8.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '02a99a271d7045c59bd7988e328e4151'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '02efbaf3bce54731ad870a9b3a9ce41c'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_config'
                            col_name_string: 'name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '035f94c9da1d4dce926ef3a91f19557d'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'field_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '03b93ba4eefa4608b9e73c7037705b9a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '03c0b6a6a40c44628911405feecaf6b3'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-01563666'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0438b58235c9463b87d90f27d92a67f1'
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT-BNpivGXv'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '04c0f3e7480b44119e7566e5914fc7c4'
                        key: {
                            name: 'x_1040823_ddg_now/az-AZ-76LH7QW2-CCUysHOV.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '04db04937ee54962b732fac2d64dfb91'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'from_config'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0574be1b997c49e19912db8d87c7ce23'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'collapsed_nav_sections'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '061fc797271d4de5becded05797505e9'
                        key: {
                            application_file: 'c19b7640b86f4b48a0c0ee6890eebe34'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0640863aafa045608d6c1d10381a63a0'
                        key: {
                            name: 'x_1040823_ddg_now/file-save-745eba88-BpJbRLj2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '06491c50b65b43f5b5462429e71a926c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '06538dfc08584647a24324b2471b96fc'
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU-bIIci_H4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '066043324a414176879cfa292a318121'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '06aa8c32547e4aeb941f91b93e1c1a62'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '06c81cb4441b4bf18933ef077be6f7a2'
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB-B_F-nKE0.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '07e53147a5d44e2baed5f9c57dd67df1'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0825fd22f8594853934e525951fe3ea7'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/railroadDiagram-O6MQD6OU.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '08380afd976f43f9bd8c529534d30edd'
                        key: {
                            application_file: '2929c9566ccd44f2848cccd5ec744bef'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '084f23141cc14a4e95c7106317fb469c'
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25-Dj4cQWJu.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '08bcc49cb04f4e3a861d9a2eccd89d6d'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '08e0e929d3734a8faf50ca02b783dd0e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/nn-NO-6E72VCQL.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '091db77582df482d8d135710c5d3f2f4'
                        deleted: true
                        key: {
                            application_file: '2e58de66e3984785b75ccb5df457396f'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '09cbf6ad5844413388d337c97b9e9a29'
                        key: {
                            application_file: '93d0205ad9474dc88059c1d1fc85d9bb'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0a3eb81af4a7437cbc522cf120f05883'
                        key: {
                            name: 'x_1040823_ddg_now/az-AZ-76LH7QW2-nV-x5ArD.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '0a77271510e24d8ea077e3633f36e7e4'
                        deleted: true
                        key: {
                            application_file: 'cb2c7808127044d2924499abd7a999b3'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0acbd8e2c1f3479c830bc9bdf077c036'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0b3153235ef0481b9d86cfd3f2d1f2c5'
                        key: {
                            name: 'x_1040823_ddg_now/layout-DsE6pXrC.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '0b77cad1752b4293a4115b48de539097'
                        key: {
                            sys_security_acl: '50b12c1adf1345a6a860cc6756250980'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0bc4f28eb4f246bba87ac8f6ad1c00a8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--fa178057.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0bd96f9397ed4cd587a70c2e68255f1b'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'seed_new_schemas'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c03827febf74cac9fa657f9ec87b00b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c1bbb11b9e34f52b4e878350f1ab681'
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT-DOix70pj.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c23cbd7670c4f0e95f2876784e55ed6'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pica'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c55ce94acf949b19a1bb939f252aa24'
                        key: {
                            name: 'x_1040823_ddg_now/main'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c70d915c32e4c48ab3ac5f51a71da42'
                        key: {
                            name: 'x_1040823_ddg_now/zh-HK-E62DVLB3-CirhwS1A'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c898d6cdfa641dc94deeeacf7d765bd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0cab25d6c2ad4debb63ccec6eab79d20'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-v2-MP3YSRHH'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '0ced50567dd5429496f5624dafa121d0'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_whiteboard'
                            col_name_string: 'name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0cfe1f268d0b4991badebe2329430703'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--c9bffedf'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0d4e2d8295984a1b8d3dd2f318ab2197'
                        key: {
                            name: 'x_1040823_ddg_now/dagre-GXQ25YYZ-Bue5VEJ5.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0d6392636a7341fb87d8e8946af7c474'
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U-BE7cwcod'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0da3f73938454e428f0b28f36786370b'
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC-CrUrp7wG'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0da4025793e44f41a09e5a5809f266a4'
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR-BBsFUchQ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0dce9e1ba46846fcaa55439d56b10d4d'
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW-BRGuJoi_'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0e34a23313c9406b9c781855c2891839'
                        key: {
                            name: 'x_1040823_ddg_now/fr-FR-RHASNOE6-DqjxtALi'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0e4544fd62344cb88b63a9aec240ba1c'
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4-BYLtW0AI.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0e7e2dbb9e4a478bbe134b571786d436'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--a4a37b31.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0e9342e7c0d24d11a8cb046d921296c0'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-open-7c801643'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0ea5606f95b446dd8eb119da3b1ea5ba'
                        key: {
                            name: 'x_1040823_ddg_now/kaa-6HZHGXH3-BOOqjNSO.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0f27d41244ed4249ac1ae25ce00fab4a'
                        key: {
                            name: 'x_1040823_ddg_now/pt-BR-5N22H2LF-BefbOH_r'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '0fffd2ea38d841bf93abc4bd9f51728c'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '113d544bb0e2474d90cda6d8b7d094b7'
                        key: {
                            name: 'x_1040823_ddg_now/flowDiagram-HODETNUW-BKxBUS87'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1255899bb2fe4caf8e4f6f96b10a1162'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'locale'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '12603d22c93540e7b840c4e38f02e82e'
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX-CX6MaCet'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '12fb47e26d1441138644c9c787cc5485'
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP-DRHX2ODp'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '13ac2874dd484354b572c057a83492fb'
                        key: {
                            application_file: '749f698351fa41f6a00e5e79f5d39ec3'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '13af3e1a6f6f480a94171f0b4dea8f53'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '13fbc0463e1b488f8c42c3be13330eab'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7-0j90lGAK'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1423309c99fb45df890e30c003399e39'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '144d8f69ed6e4c17ae88c1ca94c91178'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--19507a10'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '148e8a65ef364281a38238528f4a74e9'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'options'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '148f9e254b7c40e8a1fdff0879517918'
                        key: {
                            sys_security_acl: '245f44fc303a44ea9e584fae5fe32a0a'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '149f172997874c1ca4b28788ade5696d'
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW-DPNLPdBm.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '14d8d99ca5c843b082c4fbf5a97c3a49'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '150911a3cddc472784d2f851c616f331'
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ-Dq_vQVAa'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '150f37c616df40f289cb6b8f1a07c73f'
                        key: {
                            name: 'x_1040823_ddg_now/vi-VN-M7AON7JQ-ChaAF4GI.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '151b5949e0764ea3b62ce8df9da94e5e'
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U-BlZkU65y.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1556a7a190f940c3bd0a44142708fec8'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--f8d8d312'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '15f4f0fc46db4e81b6b705b368dc3754'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '165e8b82bcbd4c3295294f1753f0e9b9'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '16636a43da2443e8aa8a06ce8288e7b2'
                        key: {
                            name: 'x_1040823_ddg_now/kaa-6HZHGXH3-CgwBl3G8'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '16655ed33c304befb0a1fb6e47b40a7e'
                        key: {
                            name: 'x_1040823_ddg_now/gitGraphDiagram-WWUBYQGX-BYxaNeEU'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '171eb44e450541e08502acea99f88172'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'sidebar_collapsed'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '17bdf434bffb41d6946dc7064de46c53'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-v2-MP3YSRHH-BOn8edIO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '18012386bd764760b41073f50d56823f'
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2-DOsYZrZv.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1866eea1913a4bd992f1f39350a608d8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/lv-LV-5QDEKY6T'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1895aa05939b40d38f75388589eff368'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'null_percent'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '190c62f006e24285925669d3e487db0f'
                        key: {
                            name: 'x_1040823_ddg_now/gl-ES-HMX3MZ6V-BJmV8bqL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '19bfb875d11443c6918a203265592c34'
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU-DwtVT-gw.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '19da13b4ffd74453a8f3d74eb410f63a'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--f1b0874e'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1a7fa3ef172e4a899eeddc2d3f3e10c1'
                        key: {
                            sys_security_acl: 'd7de0f87d7254ce3bebb79043a2a4fbc'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1aa06625ff2a4d9686cd60f8b694b570'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pt-BR-5N22H2LF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1aa510d9c1b8412f99fb9ea0f49c128a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--df8484ac'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1b045f6306f044a89a7bba7c751a6d6c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/DatasetDetail.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1b3b9b2522b34b9bb7e2e947aaeb19ae'
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4-5y2CM9xF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1c11166678c847a8aef89222aeba14ac'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--fefe7901.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1c2727f1b36c476fa38b23137e146052'
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk-_uhEITDZ'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1c5e71ce3d034130a982975834686bf7'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'rows_json'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1cad29a4acbb4b7fa9779766473953cb'
                        key: {
                            name: 'x_1040823_ddg_now/gitGraphDiagram-WWUBYQGX-ByfjygXC.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1d69ee72e40d41ed9ce0f9a82d403657'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'field_count'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: '1e2abd0aac504d75904c1d6f2508dcad'
                        key: {
                            sys_ui_action: 'f8547712fe334c2c91aa57efbd557a33'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1e4ecf5c9ff54751a607e2293417bca3'
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN-C6I-Kp8x.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1eb9fe313b524ab89e6aaca720004071'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-XXDRQBXY-8DdiYc_K.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1ecf1024f1c64b3a97cdbb4df343ea1e'
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2-C-flf8KY'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1f39d9f27b574a669e53fae8484cdfc1'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'config'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '1f453005a3f64a8a884c841734c6f0b8'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1fc0fddb007b4d2c862f49e63fc57515'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-ZZMXUADV'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '20cedb98e7eb4ba08b28d7b437137659'
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU-BqamUi59.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '20d32ac92e7049f39c20d4b4b8a84cbd'
                        key: {
                            name: 'x_1040823_ddg_now/ku-TR-6OUDTVRD-DOdHKN89'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '20e2c08dd40148209ed147d0fb26c1d9'
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW-DXoTtWfp.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '20f5239620dd4b7f9ac74486431dbd90'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-7c801643-yVZYFD5P.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2102c71a96db440fb26dde20c8807547'
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3-BKEkeWBV'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '213320c2b0294e04b4e9ea163be0f286'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-v2-MP3YSRHH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2164c8a35fa246cdb48d7d860c60f6ad'
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A-C052CIkP'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '21795cb614c341078591510a57f539e1'
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU-UI7jAdQZ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '22b324de407442be8c740859c44699d3'
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN-ScNcIKy4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '234047799f794b658dfa43051c9ce68d'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/xychartDiagram-S5SC5T6Z.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2354b1095c5a44de8ccfba6432437f02'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/blockDiagram-I7D4REHJ.js.map'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '23611262e8b24f21b61939927a0fa758'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '237b329aa2444b0a8fb3ba8d206542ec'
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT-Ctsz3n1b.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '23808aa24cdc4df7b7abaeec9d14dd4b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '239150a900194a918f4d9f99f65906cb'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/fi-FI-Z5N7JZ37.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '23d827a2a91243049c1033e009ab3fce'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H-d9EU3fi7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2434a7eee1d74e7599cdf3f80d1915ae'
                        key: {
                            name: 'x_1040823_ddg_now/gl-ES-HMX3MZ6V-BJmV8bqL.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '2461cfb8470b4f12a1feee468bd9a964'
                        deleted: true
                        key: {
                            application_file: 'b91bdbd7b6ca4f699a7ea5ce6e26f534'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '24ca15dc44ab4e8bb98dde3ce1e752f8'
                        key: {
                            sys_security_acl: '8490cf956e13429ba1dbb722f05e3190'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '251f5d93fbb5431b96f09b05e2f86866'
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4-BTgBkAXn'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '255145c3e02343b4a085a61e079ef2ce'
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH-ULP8cSWE.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '25796dc3366a44cfa8ac05d8414aaaf8'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-v2-VYDZK3BY-_U8RVMF8.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '257b48b517b24ee8b17b5da636f875be'
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW-U1gpDERe.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '25c598e67aa445f5984b51aa7ad2f3d4'
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z-Bc68X6qL.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2638b0e6f87741e88f6bbb78e42dca9e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2641fb36c54e446599bb5c0e3dfc0abc'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/flowDiagram-HODETNUW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '26a778cb6eec40f68f3aab93d6753a67'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/gl-ES-HMX3MZ6V'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2759cd89e1cf49eba8bb21ae959f275f'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '27b49d3b9e934fe5950ea93b3e4a04bd'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '27cefefef96e4d6d8fbc83bc1c4ce04f'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR-Dj69wguq.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '286229917b72453abde35625d4df3f3c'
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC-CjnDBAOl'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2929c9566ccd44f2848cccd5ec744bef'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-pako--ce69c75d.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '294f6de11285447084e8f9af86fd9b2f'
                        key: {
                            name: 'x_1040823_ddg_now/railroadDiagram-O6MQD6OU-7u-O3U-m'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2969dfdd5a9f4734b504818d3a044b03'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '29db069bff624fb38f7da45f3ceeaa51'
                        key: {
                            name: 'x_1040823_ddg_now/blockDiagram-I7D4REHJ-D5twQgzL.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '29e02911571044be82b4e58ee1f68fa6'
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX-CzIeDHVz'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '29e7bffd21894d118f190fa111cf917a'
                        key: {
                            name: 'x_1040823_ddg_now/ku-TR-6OUDTVRD-BUOqwN57'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2a047c1b16f74ec6b03f1fd415ef28ae'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2a2ebb5d0e97418bbdf164d18b397dc5'
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas-BSY18sZy.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2a8cb33100fd41d3a641afcc7b98768d'
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ-DaaOgfmr.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2aa557999e564fbbb8922d04ead09a42'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ConfigDetail.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2ae6ce404a314f019a1fe5c866d073d4'
                        key: {
                            name: 'x_1040823_ddg_now/timeline-definition-24CTP7MA-i4TOASOc'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2b075363ce4146dd9bc51e3dbdbc61f2'
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX-ChjQ-auJ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2b13af072963404092ae39ad03c36b17'
                        key: {
                            name: 'x_1040823_ddg_now/nn-NO-6E72VCQL-B6lPeqBm.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2b1d5169d49b40b2a480d3c798ad3e8b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-save-745eba88'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2b26e37bb85f409095867ed5a28bcf96'
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW-Ck2XmcBx'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2b4b37b132874e3da4e6368b8f61ce00'
                        key: {
                            name: 'x_1040823_ddg_now/oc-FR-POXYY2M6-D4cEGR7l.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2b6d9011081340f7a4951a9191e82a6a'
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY-CwD02tq_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2ba1aeae2b1e4d378f537aee9423c87b'
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC-iZDYBfcF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2bc2cc91fe544d508d7ce98652d89f47'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/index.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2c05f410daec4e41a97ab1966c62fd8b'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-002ab408-CfN_GCJH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2c278fad08964f6ea5c88e6894e73534'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2c6728fd61154d588b9e9e72a624c001'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/nn-NO-6E72VCQL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2c6978069abc40859ef4f8e2a9f1a508'
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25-C7d7hSQK.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2c78a8dfab5b418897b9c0c3b887dd4a'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'is_unique'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2c8c0ff23df3464bac1e8d1fbea43b9b'
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM-yTcL3x-b.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2cc21d4f4e774aa196d6f27eea3f6108'
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N-CbqboLt7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2ccd2f4cc26c423f8bee14daa0b28251'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '2d3ec942f7b34eab995b5cea90760661'
                        deleted: true
                        key: {
                            application_file: 'b18f590f71a445afb4c1ef6bbfdcb458'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2d7f5ab1bccb41ccb6b537320640cbea'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--b78dee07'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2df4df983a654cab9d878bf171d5fe66'
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y-CYoj2IFH'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2e3d0bbf44454611923bbbe3377bd1e4'
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE-B2W1r3t3'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2e58de66e3984785b75ccb5df457396f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--df8484ac.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2e597f25e92d4004a1841a0add0cb14a'
                        key: {
                            name: 'x_1040823_ddg_now/railroadDiagram-O6MQD6OU-DEXhERrv.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2ea52297bd244ca29499b9cf5c094d93'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/roundRect'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2f162773bd5f410dbc6ee555aba42c30'
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4-5y2CM9xF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2f2bb6f5cbac48eb87f0cf2cede95c95'
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF-XzJwdvKc'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2f4de8c1429e46a09a7225b718b90e4c'
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ-Dq_vQVAa.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2f55f2239c92469eb62350d5a0070e3c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2fc9287e34c3474c9f7720e7627d3948'
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ-DaaOgfmr'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '30022d7533bc40fa8691b305738858fa'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '302f1255a8dd44f286f33d96be6e4098'
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN-CxKrm4mm'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '30471cb03c484f20894459bd8667dc3f'
                        key: {
                            name: 'x_1040823_ddg_now/lv-LV-5QDEKY6T-Coq737i4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3051a5cc7dd74acdab944984db714df8'
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY-CwD02tq_'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3055b47b176d4433abaf0657ad2188f2'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'seed_new_schemas'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3063c5f135af41789da29c7466aa524c'
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU-D542bMYw.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '306cd2de3f524e1894c5864cc76922fd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/zh-HK-E62DVLB3.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '31390b97778e4ce3808e0fa06d8cdbff'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/DatasetDetail'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '317105b94ca542c7b8ad5ac0d63f7cb4'
                        key: {
                            name: 'x_1040823_ddg_now/railroadDiagram-O6MQD6OU-7u-O3U-m.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '31f67fd44fbe4a27b3216868b4f5c02d'
                        key: {
                            name: 'x_1040823_ddg_now/id-ID-SAP4L64H-Cdeid6ka.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '32651bba16984923be53662bdaba7dd1'
                        key: {
                            name: 'x_1040823_ddg_now/oc-FR-POXYY2M6-D4cEGR7l'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '32e31e63f25f4df087afe438595782dd'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--c69a7a4e.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '334408a40a4a47e3951c0cd664380c4c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-XXDRQBXY'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3369bb3d4bb14c53a65b8e473170b524'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG-CzQX3Nzr'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '33c01599655e41b9afdc651b7cc74c24'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '33e345ca7a0c4cfbb444e6e9808069f6'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '33f2a1e710014a3abe91fb70a5df5fb7'
                        key: {
                            name: 'x_1040823_ddg_now/fr-FR-RHASNOE6-0E1DzFN2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '343868cfef43439893d60afdfdc5481a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-open-002ab408.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '34c148b234704c6db48c01195b0cca40'
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC-B5mSW0i5.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '354996763c474f53822a9706ea679b55'
                        key: {
                            sys_security_acl: '4859336e8a75439387b12dee44a0f6ae'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '357c8237a17a4f00941949ddf23c9584'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-v2-VYDZK3BY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '35e5868a434d47788630af8dbac3a7ef'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3609514488c34d8f96814c9e17094543'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kaa-6HZHGXH3.js.map'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '36b2b527aa0a4a6682516a226d2ec12e'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'mode'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '36d2e20716754f839ac49c599d7de0db'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--a4a37b31'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '37065e6daa994740977a2c849d0af86f'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-v2-VYDZK3BY-_U8RVMF8'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '37269ac8d90d44e0b44786e850a93369'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '372e1bf4cd044ce5b05f2e072573c345'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '373e7770996740c69b8b87f3bd711aa8'
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY-Bv8-R8l6.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '374f561ede0741fb944e8342cb3780d9'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-katex--6afa0709.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3763664b0f2942f188dee2497aabd2d9'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '37851ca8e6d649e586f041e00b81cdc5'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '37874ac956ac4e768fc3074f27abb8d1'
                        key: {
                            application_file: '99f7bae4bf6e4fcf984880af937d73ac'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '378d2a0e7c7f42d39fd9bfb8d7550369'
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2-DOsYZrZv'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '379433c481dd4c45a6aa640c5e27f4f6'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '37a268978fb7440d8030914312d5e37a'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-v2-VYDZK3BY-DivwRVGd'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '37abd2a820d941fea41d8d293c7ee340'
                        key: {
                            endpoint: 'x_1040823_ddg_now_whiteboard_share.do'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '37e3d526a0f3499bbf586043b1209cb4'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3836a9b7afbf47dfab708c3e134fbd48'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '38b967bdcb354eb799a78a6dcada3f68'
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U-BE7cwcod.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '39347773cf4c4ee184df9233c8eeb8f8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '39bc0a1ab3cb4f129c8ad5c672de4c56'
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y-CebfxyqL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '39c594ab9cf94a6fbbb6ae0717f4eda5'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/fi-FI-Z5N7JZ37'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '39cac2f0d22249198836d9e03fa339f6'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'field_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '39ee8a5710124d69b6b6045e091d470c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--fa178057'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '39f99b236e9148fab3e32e284454c7d5'
                        key: {
                            name: 'x_1040823_ddg_now/timeline-definition-24CTP7MA-i4TOASOc.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3a2cf4ef4cf241e899204e691d5920ac'
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC-CrUrp7wG.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3a76cace296943f4a5f653275626b2c5'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/he-IL-6SHJWFNN.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '3aaf8432a88c4d3eaba8fb83084911f3'
                        key: {
                            application_file: '3edab56a485f4ab8abca14324b616e20'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3b3b3637a96248b4b852e5d3768b579f'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'mode'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3b6bb96452ce4f96a6adea4301bfaa24'
                        key: {
                            name: 'x_1040823_ddg_now/timeline-definition-24CTP7MA-BEJp53ht'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3b6e5b8dc7cd4d74aedcb3293b8f2542'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VSXAHHWV-DJmwFiJ0'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3c6079ade7d848f3b01057d9e07c5534'
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7-BpJax-Uq'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3d4433cab1524917903b1a5ede7cc7b2'
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N-Deb3-jJq'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3d5e4921a80c4cac9f50e84a223abe66'
                        key: {
                            name: 'x_1040823_ddg_now/zh-HK-E62DVLB3-CirhwS1A.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3d9ee61a39c645a798bb8a50fb3f5547'
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7-BpJax-Uq.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3d9f7f5300d74a29b4a69b03e5d70f32'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--f1b0874e.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3dcc966866714495a6d35cc486c968d6'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-ZZMXUADV-DivwRVGd'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3de1ac740a244badbb38a3bfa73c22ac'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_field_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3e49ff1921a343c7a01e1a1a3352e337'
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB-BgGK5vrT'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3eb1315daed6484fb261312bdf2a3f43'
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2-y0hA3TRc'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '3edab56a485f4ab8abca14324b616e20'
                        key: {
                            endpoint: 'x_1040823_ddg_now_studio.do'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3edb9b93c91a46db98c810ae0e9463fd'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'theme'
                            value: 'light'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3f1bcbb88acb485caa16698403800487'
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN-CbSiYIuj.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3f4cbf67df824a7e90beccd49e34a95d'
                        key: {
                            name: 'x_1040823_ddg_now/index-qvCqJg2_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3f675295c4d34d5d8b97f7e18bac15cb'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3fb4c4116cda482c80d55f513f69cdb7'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '407ed921a2de41a2ac496f8bb584ffe0'
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC-DYWkG3mW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '40b5cdd0bbcc418dba193d4075f49478'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4102b131905f44709efe8d9be6de8f5b'
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU-bIIci_H4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '410ee9bb615843f1b17e30350ef5c291'
                        key: {
                            name: 'x_1040823_ddg_now/vi-VN-M7AON7JQ-Dj2XIdc6.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '413f340491a24f5db1d65450a88d3e4a'
                        key: {
                            application_file: '749f698351fa41f6a00e5e79f5d39ec3'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '4163bbc9581c4041ad9d25bc2fef275b'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_user_pref'
                            col_name_string: 'user'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '41a83fa9795e42858d662d09ebf0c127'
                        key: {
                            name: 'x_1040823_ddg_now/layout-Ct4vpGAO.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '41b41d5b967d4732a279a8856c0b1ba8'
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO-DpvKmDkb.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '41cc4ed39ed14b819323f83cc688dcb7'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'seed'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '41da2e2c9845437ba542786e2ed2ad39'
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM-yTcL3x-b'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '41f132a1d86d400392cb15e260e58d93'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR-Dj69wguq'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '421ec8c609ca43228ca28fcacd82cf97'
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2-B0dFGkW7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '423ac392aa0c446fb835853b69995bd2'
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU-D542bMYw'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '425bc7c3468c44f08c52a0cd14d17d42'
                        key: {
                            name: 'x_1040823_ddg_now/nn-NO-6E72VCQL-UHqNFNxF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4273af7faaab41a5b860ef17de2a3df6'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/railroadDiagram-O6MQD6OU'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4285003592244e37a81ca67ac9fae2b3'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/oc-FR-POXYY2M6.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '430b75d553fb41038e1c0b48bdfa928b'
                        key: {
                            application_file: '793b4079486d49f89cb2fd87315c31d8'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '43443ccabd614407a05ffbdef7bd2837'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '436844af73954b7ca69491c4815d59e7'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pt-PT-UZXXM6DQ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '438143fade414d88b8215388ce1a66d3'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-pako--ce69c75d'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '43aae446b6d3445ab67928370dfe1bf2'
                        key: {
                            name: 'x_1040823_ddg_now/file-save-3189631c-DG6xnOz_'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '43b9107954bd41d7bb827b888be99d94'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '44648ca54fd547d9b0e7d3b96b17d772'
                        key: {
                            name: 'x_1040823_ddg_now/pica-E_J_ZxAY'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '44fe44e08427419d9303b34ea5205f91'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'rows_json'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '45a5b3cd03bc4924aa44ff1f7f0d30f0'
                        key: {
                            sys_security_acl: '2e2071c2228b4c619bee0ce0bd4b6086'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '45dc2845160d4f70988fd326528699b8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '45f08f0b9fbe4a98a2d50e407b72acfe'
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4-ByMr1kcW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '461012ee2314433f98b23b5caad06838'
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO-Dx2nkbu5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '46c2b4d253cd4a14811e3fcfe4ed5513'
                        key: {
                            name: 'x_1040823_ddg_now/sl-SI-NN7IZMDC-Bxmcj7HC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '46dc71ed97eb406596669076fa86284a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '46dd1d5a180b431c9b805c592876638b'
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q-BqFQGmAL.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '472eb938fc44449a85caf0d41193b424'
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR-BBsFUchQ.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4732394fd7d24ae79b406979796135c9'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '47b1bdfd1ba74c3f9dec61540b5f9bcf'
                        key: {
                            application_file: '1556a7a190f940c3bd0a44142708fec8'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '47b72576f5b846959fb942c8fcac0231'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'field_name'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '47d22e9c4f15499985cb01216f6d6b58'
                        key: {
                            application_file: '37abd2a820d941fea41d8d293c7ee340'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4818c63ad77244c7a27cbda6ab3f7a7c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '48b44b586fd5437eb53798250fd8d29d'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VSXAHHWV-BeTYYR1D.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '48da115d20b541bf8c7168d3a9dd4989'
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN-ScNcIKy4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '48fbc060d4bf4cf391567ff6ae38ff36'
                        key: {
                            name: 'x_1040823_ddg_now/erDiagram-RLTQ6QDP-CPifuaru.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '49488eec41744629bb8c43ff1c24113c'
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas-BSY18sZy'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '49885e8212df41d2a793f81ccbce8086'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '4a697352724b4debbf624e0754dbe221'
                        key: {
                            application_file: 'e7edc2d95d9f450492225de5b069fb79'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4a8872e7830b4da19cf542837d8cf7e5'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII-B-s1mbM6'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4a9816ddb4b9441e87084b7626a7a260'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_template'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4abaf79ccc864a3390e5a1f4b74226af'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'row_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4ac822bd4b454138a530d5936ed7948e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ConfigDetail'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4b0b3b887c48454eb59d4f5674808c82'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'collapsed_nav_sections'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4b41873eb2f64a3a877bae686a1d823c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4b47ddfcf7694421af23c6be8430b5c2'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4b60f6dbd1f541229d761031a18a050e'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-TICWLB2K-t0RZIk_d'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4bde2d723db24189b7006fa5575afa09'
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK-DtAQDYCT'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4befe915b51941ae934eb6fc025dc694'
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF-g-SBJM0_'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '4c65d0db421d4b21b8bdd44ac02605a9'
                        key: {
                            application_file: '528fd3b4e76345cfb51625edc56c71f9'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4c8beecb669b4f529d0ad9a9b69eeed0'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4d4345fce28246cba040f5c5cb43ec6f'
                        key: {
                            name: 'x_1040823_ddg_now/pt-PT-UZXXM6DQ-DzSDbtWR.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4d8dd51873684a5db95a9d34e3d0a5ae'
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR-PL-_YlRd.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4d971166516940fc9410610243ffa08a'
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2-D5WSi-x_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4d9f732db5dc414eafd477e81cb84677'
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3-BKEkeWBV.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4e018227762b4a8c914209ba57c9d989'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4e22cd793ba24ca78cbe3ed85f12abfe'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/id-ID-SAP4L64H'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4ed16f67c961439f83f37c2e9657b045'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/zh-HK-E62DVLB3'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4ef07340a8ec4742b62c7ae41b4e5719'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4ef77a72f7d64c6fa80d80b62a744ad3'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4-kILQyRVZ'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '4f2fbdf03261415fb4b8a066fb3cc76a'
                        key: {
                            application_file: '856799e3c54f47979a0d264f6a66344b'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '4f43690270c14a76b96b02ea3b51cf24'
                        key: {
                            application_file: '374f561ede0741fb944e8342cb3780d9'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4f53fbb28aaa4c4fae35eee0008460ee'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'config'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4fcd2c442ad24bb4a1ac8d387fdf78df'
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB-B0D6SkPg'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5018c66796084187b6b37639733b011e'
                        key: {
                            name: 'x_1040823_ddg_now/flowDiagram-HODETNUW-BMNG3k_i.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '502883bc65fb49ecb51b809ab89d0e8f'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_row_count'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5066b119271047f0830d073721a19580'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '50f94efd475c4b80a4ada7215ba3c63e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5100ad0d1bef4e03a7ab3b774c2a8cf8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-ZZMXUADV.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '51529010f708468d866de4f756b0fabd'
                        key: {
                            sys_security_acl: '804e73f3d4eb4a53a5869237cd2f1331'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '51af80ab311e4180a92762dd3b780dc2'
                        key: {
                            application_file: '438143fade414d88b8215388ce1a66d3'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '51dc0375cc3d41148c7c8035c2d881bd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '520596bd88d248cf8629ca43414aa39b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/erDiagram-RLTQ6QDP.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '528fd3b4e76345cfb51625edc56c71f9'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--d1b8466a'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '52d353df9e614911a0dc9423f4d9c5f7'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kaa-6HZHGXH3'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '531973a36bf34e038e87682aed9bb65e'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN-BSAkjsL3.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '535f131e183a4f2ea760bb46e7b94c6f'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR-7WpvLbdH'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '53c0fb6da1de4ee7b9a2366b96578e7f'
                        key: {
                            name: 'x_1040823_ddg_now/pica-E_J_ZxAY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '53c27c1f074241dd8d42fe20e8f48f7c'
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW-Ck2XmcBx.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '53c8745b95f34d32827ca52800513d73'
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk-_uhEITDZ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '544e6a597db240d9af16270dbf15f4c8'
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ-CRoqy8GY'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '54a84bdc4eef47648b2b477d01d7fd7f'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_export_format'
                            value: 'sql'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '54b98b8b6dba4e5bb4e8973256beb839'
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas-BQ0RsXay.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '550d463743b24beca3193c01fba06195'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'from_field'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '55cf0a5b1e6241b59315859ea55f4f96'
                        key: {
                            application_file: '793b4079486d49f89cb2fd87315c31d8'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '55d4a1f0587b4bca965e62bf60beb69c'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-S7CK7UJ4-CJQrn8mh.js.map'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '55dbf8e21b344897ba7d6c4ae551342e'
                        key: {
                            name: 'x_1040823_ddg_now.user'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '56231dde63604a36a3219e265c162d04'
                        key: {
                            name: 'x_1040823_ddg_now/index-qvCqJg2_'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5665fbac4b82427db45ba6d86327b896'
                        key: {
                            name: 'x_1040823_ddg_now/lv-LV-5QDEKY6T-Coq737i4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '568ad144ef6f40ba9ba9a557e1c03e08'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '56cb301287c24d90b6e543ea51870420'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '574b5094a5014fd49bc02d8dd5d18fc6'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/oc-FR-POXYY2M6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '578076fcc62247ada527b751ad8443fc'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/hi-IN-IWLTKZ5I.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '57850660ab5b4baf8db688b5bf7c51d4'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'config'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '57f9ea141fb644b09e75230a3abf3518'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--fefe7901'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5826840e4a334854bb1d6c098590bc5d'
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL-DmCHJ4GJ'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '58d7c815715242d7ae134a424d12c5d6'
                        key: {
                            sys_security_acl: 'ced860710b0046068daad1b22572928d'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5909cadc955c4b0e916a52ecc3cd0f98'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5929d9b4a4a4428a8d44046a61885739'
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5-BKbjmcZ5.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5960ebb7678a4837b3aaae268251eac5'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '599920f07a2641ffabaca141e126fd86'
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE-DcIvpsO_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '59a576210d6e4913ac0c8638bedcf4b7'
                        key: {
                            name: 'x_1040823_ddg_now/blockDiagram-I7D4REHJ-Dz5CKCMY'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '59a57a5988f84090a770aa7dde854a92'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'mode'
                            value: 'cycle'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '59aef32c48624326b905bf37e4101925'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '59db5bf96bf949aaae7c756c0279c807'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH-BSt1_miy'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '59fd80364e9840b491f4414265438366'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5a18a78025774989b7653ec8e3b9bc9d'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5ada6fa032d1468296736637a55fcd5e'
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX-ChjQ-auJ'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5ba087e31f994f67b362ddaa62f4e11f'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                            value: 'running'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5bbbe1dd3fd34b069337b3ce8fca5180'
                        key: {
                            name: 'x_1040823_ddg_now/oc-FR-POXYY2M6-Cu0OKrnx.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5c184667e7f3467f94e17e637420ece0'
                        key: {
                            sys_security_acl: 'a4d998900536407e8f9b771c69b2a86a'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5c2e7a53c018463cae8095af096aeee0'
                        key: {
                            name: 'x_1040823_ddg_now/gitGraphDiagram-WWUBYQGX-ByfjygXC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5c4487659bee4ef6813c46e8cdfebaa3'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG-B8uAKHru.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5c5fce5c82714dd9a286823680f93836'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5c740631302f4ed2bf694365525a92e8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '5c7a216b0266427d8a3437c45a5808c6'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard_share.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5ccb92da0a484e5c87615024f7d53bd9'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_password'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5cd511f5512749b38a081ac1598450cc'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'metadata'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5d8bc30d571f42d1882d195943cd9a0e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5df78171be6846bb9407af7f27d1f559'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG-CzQX3Nzr.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5e2d612f9da64485b83b6641f2a6300a'
                        key: {
                            sys_security_acl: '191d6c6d1dd441119640e0d5e8f67311'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5ea51a0ac7ea4f73b2948050ec3b0c06'
                        key: {
                            sys_security_acl: '604753920234417eaf5d689690a59dca'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5eab90f9a0e346a498c19dbb90494d44'
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY-DZdMbhy4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5ed42e4e03534b6d9c6794de146e4d06'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN-CpRMckU1.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5ee1b8fe7e5a497e92ed109f7aa96fb9'
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP-sXTJERq3.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5effffe5dd0344718c39db478688a05a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5f0aa3b005184f73bdc085e9c1829d40'
                        key: {
                            name: 'x_1040823_ddg_now/fr-FR-RHASNOE6-DqjxtALi.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5f1a420c0ac8481c8b9cf8d891c09f91'
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ-BpGfK_2J.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5f3b44b8b22549be9d82a6a6f877dacc'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5f95f3e16c0049788195d0bda0a74540'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5f9c519878c54a1b92895912985a05dc'
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX-q0MgpHIF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5fb1f30033f94d70b14720211763fb68'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '600abeee28ba43b39c569763ea0fe414'
                        key: {
                            name: 'x_1040823_ddg_now/id-ID-SAP4L64H-DGyYVRKF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '601122b7078743409b290ef48fdada47'
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH-fTozpNE0'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '60dcab2a606a4e3fa3b67331055f9567'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-S7CK7UJ4-BYkaGnax'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '610002b6a1374f1089740b0710ca4b18'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'field_type'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '610ec47b965a48328ae56929fb7e7fc6'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH-BoQWkW4U.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '61199d41773e48b282c0cb3c9fddd444'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH-BoQWkW4U'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '615545a8435a409f9cd29e36524f5da6'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_protected'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '618e732581ed42078605b01dc4ac5e33'
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL-DmCHJ4GJ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '628c96a78750436ba4f8199a984d93dc'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '62c57fe30b2c4933b81f6a5ac79e8844'
                        key: {
                            name: 'x_1040823_ddg_now/az-AZ-76LH7QW2-CCUysHOV'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '631b7e4f23e74970a99e42051baaec39'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--f8d8d312.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '638d8531f8d046b998212a8c4ec070b0'
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7-1ImVviOm.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '63bed447b37c41f5a1564be637f235bf'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/gitGraphDiagram-WWUBYQGX'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '64bae6d941b34904af68ebd6af10ce26'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_token'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact'
                        id: '650b7396177945b9893176e707cb3df5'
                        key: {
                            name: 'x_1040823_ddg_now_studio.do - BYOUI Files'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '65211834eb45472885a8d1feafa284fd'
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF-XzJwdvKc.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '65992a72c6b441da97e11963171c9338'
                        key: {
                            application_file: '2929c9566ccd44f2848cccd5ec744bef'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '65ea030e66bf49f2bc47e48036cda9bc'
                        key: {
                            name: 'x_1040823_ddg_now/hi-IN-IWLTKZ5I-Ckx_Qn7-.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '666b2d73341e4716a8d2280f9e84be61'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII-BHzOmjFP'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '66b8253129c5427c8849eeecf3f89091'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'config'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '66f12b52d2344561b75b3d8689295508'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '6704310540bc4e8c8f6d07c7f34914fc'
                        key: {
                            application_file: '19da13b4ffd74453a8f3d74eb410f63a'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '67a62df83b304afdb58e7caa437a1ddc'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/timeline-definition-24CTP7MA.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '68a4b957043c4f018061ac4baa190959'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_export_format'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '68e0b7d734b24c7aabf2027f38e710ec'
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2-B0dFGkW7.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '6a091563960e48e2a4553f82884b61df'
                        key: {
                            application_file: '3d9f7f5300d74a29b4a69b03e5d70f32'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6a1333cab705416893f268ddbf198db4'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6a1b89658b1647ec93bd80e54c045617'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7-Crv2BHTE'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6a1d8742502b45219bf53eefef3e9a25'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR-7WpvLbdH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6ad10b87db964276a06244373fdd6cfc'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6b5d5ff2cfb2409480c5fa6cc1aa1d72'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-S7CK7UJ4'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6c31fd7b92a341fa92fc9f1957f27332'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'field_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6c5672a619844e0b8d60d2c2afbc530a'
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK-da-e7hpp.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6cee86db21d24381966afdfbc69bc532'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6d6773af4906417eada2e5f51f4e84e4'
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC-B5mSW0i5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6d7e48fcfc574dc09cdf634e9c20d86d'
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX-CX6MaCet.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6dadc3aa3a14452196f3cb277c3c8583'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6e13485b3db04cb7bd4bf9da3a9b9b42'
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4-Cq3wMFjK.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6e3fea041d624bb79d7c5f4d60a145d4'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--98023602.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '6e43b06272dd4a1fb08631dc089096ed'
                        key: {
                            application_file: 'dc69f136dcff457e86f30314f5049bb2'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6eada3ce00b44affb5e3b3003d88eaa5'
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW-BRGuJoi_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6ee96b29bee84cc7b2e68ad2d63065f4'
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP-DRHX2ODp.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6f14590b850549828c929ddd795368a2'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6f98c8768cf940cf800250a97e3936bd'
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL-Ca30LSIx'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6ffa47be5d8e441c904af1613944d8e2'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-ZZMXUADV-_U8RVMF8.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '703ffca4c7da4daba6ab6b0f3ced4d9d'
                        deleted: true
                        key: {
                            application_file: '6e3fea041d624bb79d7c5f4d60a145d4'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '70d2cc2e69a141cdae2cef68e7b29154'
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE-B2W1r3t3.js.map'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '720f69c75c624931b74831bf30d08913'
                        key: {
                            name: 'x_1040823_ddg_now.table_writer'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '725722b89036458e8452d8afe07fb318'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/mr-IN-CRQNXWMA'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7265013260e349d495f5c49f81113384'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'options'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '72a28ce0e2f64984acc5bb5592c3f476'
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2-y0hA3TRc.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7349e74da7514c6f9277d811edb66035'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VSXAHHWV'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '7369495b463441788d54903f021a113c'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '73a4b9124ec7407abbd17333d7fbcf3a'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '73a606557b7e4247ac5570e61d700251'
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU-DwtVT-gw'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7428ad9be51b4852bb3fcfb1635dbf0f'
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW-Du9foS2B.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '742c98580eff4431a43d05a0684b5e57'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-XXDRQBXY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '749f698351fa41f6a00e5e79f5d39ec3'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-cytoscape--269d8a18'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '74af2ee92fda4a5c94dc8bc40a0f75ae'
                        deleted: true
                        key: {
                            application_file: 'f0c878d81e9b4031ab91aba8a45de101'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '74b8b4bbc5c641ccadbb76c037f1e8d0'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-open-002ab408'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '74cdfc29586244ac80d16ca7b43898e2'
                        key: {
                            name: 'x_1040823_ddg_now/erDiagram-RLTQ6QDP-CPifuaru'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '751d533acc4d4433ae17e53ec644dd78'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7540fa675e0848199fd83d4c1ba36108'
                        key: {
                            name: 'x_1040823_ddg_now/hi-IN-IWLTKZ5I-5V38YwMx'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '754460295ca14c98b2f9fc9c087cafd7'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '75e6fb6f288a4007870008c344b0d2eb'
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ-CRoqy8GY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '75f0d0b0b71646b49175cccba7574d0b'
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY-Bv8-R8l6'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '76878b5ed3ee417393b0e21aa70d49d9'
                        deleted: true
                        key: {
                            application_file: '2d7f5ab1bccb41ccb6b537320640cbea'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '76e7de5c2b584240a7f3fb4b9659bc3f'
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT-ClcnlvIq'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '77566954d0d24648ad414c6855c6fb60'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VSXAHHWV-BeTYYR1D'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7784c9a6a2fd4f5792ec2bae9df60045'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7838fa4c94e1414ca3124873f910329e'
                        key: {
                            name: 'x_1040823_ddg_now/oc-FR-POXYY2M6-Cu0OKrnx'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '787001b74a6b419baae73f40019c2d06'
                        key: {
                            name: 'x_1040823_ddg_now/sl-SI-NN7IZMDC-Bxmcj7HC.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '78736348c1bc4547852e79e88b432dc1'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'confirm_deletes'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '78f42070638b49258fdfe9b408323174'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sl-SI-NN7IZMDC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '793b4079486d49f89cb2fd87315c31d8'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-katex--6afa0709'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7986c8a0dd3f49b5a6db068e98489adf'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-4ed118d0'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '799a1f2e20c141d693bb0a55a35d6a4a'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'preview_row_limit'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '79c3a3d61dd44213a259619fc851d342'
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE-69HzcfMn.js.map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7b6260f93b0f45c4a2844684ede10129'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'mode'
                            value: 'unique'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7bd3e3215251447f9e45e25e087e1f5b'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-ZZMXUADV-_U8RVMF8'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7bd48ef1d2314da9acc6890afd44696b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/lv-LV-5QDEKY6T.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7bee5ff3c3cf4b7a88466857726bd5bb'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'field_name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7c108eb26ddc4a828feea6661d592b59'
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC-CunEPfGH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7c58f444c3c94be1bc11b1f1b8efd36e'
                        key: {
                            name: 'x_1040823_ddg_now/main.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7d1707d17b6a47c1a487489571b179ec'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4-BDIUhrt1.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7d59d6f5b8b2439992a5129589d0f354'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-XXDRQBXY-8DdiYc_K'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7dbe52d4eee543279b0819fa58567319'
                        key: {
                            name: 'x_1040823_ddg_now/erDiagram-RLTQ6QDP-DQ1iWwqO.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7de9c0e53a054a62825ce8a7d9bd3791'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VSXAHHWV-DJmwFiJ0.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7debda89027e4e40b2ece14945876c11'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'order'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7e7166100d7e46a38a2645997c3681be'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7e8e7eba25394d92ab613c5647c343f5'
                        key: {
                            name: 'x_1040823_ddg_now/zh-HK-E62DVLB3-1CkJoBs0.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7e9779733a514483a8c12644b06daaee'
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A-C052CIkP.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '7eb004e91c6b41d8bd64629f9e75ef96'
                        key: {
                            name: 'x_1040823_ddg_now/az-AZ-76LH7QW2-nV-x5ArD'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7ed37d00ba5645569109925e16779205'
                        key: {
                            sys_security_acl: '889c4356ea454528be18a07ba04b7db8'
                            sys_user_role: {
                                id: '87d696c00d3c4ece942993a96f9bcfff'
                                key: {
                                    name: 'public'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '805fe69f04f7411ba065fdcbdcc565f6'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '80ba59a7f41749e096c8385db4cdaacd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/az-AZ-76LH7QW2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '81455c04bcf64d1eb1950347d7492c9b'
                        key: {
                            name: 'x_1040823_ddg_now/nn-NO-6E72VCQL-B6lPeqBm'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8159e4ea7d9c45b48f0e6dda697aad94'
                        key: {
                            name: 'x_1040823_ddg_now/gitGraphDiagram-WWUBYQGX-BYxaNeEU.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '81e288721f30438eb98019efb1ffb234'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-v2-VYDZK3BY'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '82c584b856944d58ac8d3442a9f9750b'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'theme'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '82d2b04f97c44f1a9207f6a48ab9ebb5'
                        key: {
                            name: 'x_1040823_ddg_now/xychartDiagram-S5SC5T6Z-BYL_YKLb.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '8319a32bbf654626a715e5d0516c0789'
                        key: {
                            application_file: '89e69ecc706a4888bd885f5c1c3c14a2'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '837fce76444b4b32b94d32a3fdf55d54'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '838b8074e11d499d954ae2aca7564a79'
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK-DtAQDYCT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '84054f3de553491aa19ae98f03751a45'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--3ec602ea.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8418240bc33f42bca85230ec0f0b6b80'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/dagre-GXQ25YYZ.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '84996de90cec4a2d9f97da329c328481'
                        key: {
                            sys_security_acl: 'cd067bc9497d45838267187fc78838b3'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '84a4d19ba40a48029184515a5d0eb4fd'
                        key: {
                            name: 'x_1040823_ddg_now/file-save-745eba88-BpJbRLj2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8529c0ab7a6a4b3dac36f230f0b7a08c'
                        key: {
                            name: 'x_1040823_ddg_now/he-IL-6SHJWFNN-CtMnQ5D7.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '856799e3c54f47979a0d264f6a66344b'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@mermaid-js-parser--1b54e87a'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '859695243b2140fa988a824356192457'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '85986761a3e942448d623d313029cfd3'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pt-BR-5N22H2LF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '85f5cde4260046c8bbdaafd072f672eb'
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7-yRd63pL8'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8611c4840f37491d9613988a83746ff0'
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk-B_zpKlkS.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '863638089f0f492aac42dc7e88f0a7b7'
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U-BlZkU65y'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8638c4d055de48769e02d898c4d27f32'
                        key: {
                            name: 'x_1040823_ddg_now/dagre-GXQ25YYZ-Cj8zLCHt.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '869984b7ffbe441ca3b9a6577ff73d10'
                        key: {
                            name: 'x_1040823_ddg_now/lv-LV-5QDEKY6T-lAIXK2Da.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '886201b116c144778e423917a5bd3705'
                        key: {
                            application_file: '0c55ce94acf949b19a1bb939f252aa24'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8896e889eb764e3986bbe41eb1e2b3cb'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '88b01adf02d64c37bc349bd6ab8580bd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-4ed118d0.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '88eaf68b2d324c6b88074d623b0e1b9c'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII-BHzOmjFP.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '89056ef2c7d5407ab6910ac0d80ad880'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '894663b0a4d04241832757dda01e05a9'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-TICWLB2K.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '89c59d8daa124c5292991780d28c74f6'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-v2-MP3YSRHH-DWrp6PyL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '89e69ecc706a4888bd885f5c1c3c14a2'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--eefec92e.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8a5c16056f174eb98925f749a596195d'
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25-Dj4cQWJu'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8a9da269870e484caac4262c7c6030e4'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8a9fc66ae3174c68b2b07fc31086de6f'
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW-Du9foS2B'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8aef458c7e5645778384eaecd2c9a7fd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8b5b00268568448894b3da4cb0795466'
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q-BqFQGmAL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8bc7352086324206b2c67ea793c344c4'
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT-DOix70pj'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8bddfaf3775c41b9ae88652f11d12b40'
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN-CbSiYIuj'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8bf29bd02abd4749af8d88a00d9f2510'
                        key: {
                            sys_security_acl: '8e1d070045b34235bf67d83b00f7b441'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8c26b2c8ab3b4512b4cb3e0206179fdb'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8c33efcb89054aa78af4f380535cfe7c'
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP-sXTJERq3'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8d35848f648d4843aa90dcdd74ac6a21'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'from_config'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8d4e604d79b1442e80a558c7428cb5a7'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'error_message'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8d87fba86fd343b4aac5aa83cf9ed380'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8da5cd690afa490fb87ae5f85391f2be'
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4-ByMr1kcW'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8df84c908d734d29a388972ebdc79cef'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'config'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8e218162fce943d28432e12229191eeb'
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN-CxKrm4mm.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8e30c3237cf3413d893f4629bac1ca99'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H-CUQ2_vEz'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '8e76f4d054d2440682c0ed0de52ffbae'
                        key: {
                            sys_security_acl: 'fab09c39cf5843f693b33c6a9ccedd5b'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8f129beeaeb54435ac610ba3fcf47ef8'
                        key: {
                            name: 'x_1040823_ddg_now/railroadDiagram-O6MQD6OU-DEXhERrv'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8f5b41d5e2d1498ca23899669f596e52'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'editor_split_percent'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8fd1adee763541c187672ecf7a3cdcf8'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'locale'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9062eb71a37c4c97a23130c6a711f95d'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'from_field'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '907cadd806cf4aa5a4a7de6063a97b95'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '90aa2624c9d64c24b5468f10485feeb7'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN-CpRMckU1'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '90afb928ee2a453aa3727c70cadfeab1'
                        deleted: true
                        key: {
                            application_file: '36d2e20716754f839ac49c599d7de0db'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '90c70341801d4913bac9afba5895de08'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '90ea3c3efcf1450a9f72f9616e657ccf'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/layout'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '90fa52c354bb4705b99935556939a1af'
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY-DZkbsF7L.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9123089bc599402dbd11866eff4dd7d2'
                        key: {
                            name: 'x_1040823_ddg_now/blockDiagram-I7D4REHJ-D5twQgzL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9128e71a66c94c06869c2a03252014c4'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--98023602'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '91e47bc6bb5f45b8a5ab1c397e39488f'
                        deleted: true
                        key: {
                            application_file: '0cfe1f268d0b4991badebe2329430703'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '921b2538f4d84aa0901ecd9025d020cb'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VSXAHHWV.js.map'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: '9227fff8449141559e60d462d9f214e8'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_field'
                            col_name_string: 'config,order'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '92b8948461af4bf9a41b4249206f25f9'
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB-BgGK5vrT.js.map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '92cdbf441a5d4f1fa406808530f53806'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                            value: 'queued'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '92d47afd14154954a43cf3d1baccc806'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'row_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '92ffdaca7f28439bba12b15601af395d'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '93149f500a804f2db35141133faa086a'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-v2-MP3YSRHH-BOn8edIO.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '931f678c9fcd4c9089874581662569c8'
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX-q0MgpHIF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '933aeb9e4ea74046bc56c3c04bcc8957'
                        key: {
                            name: 'x_1040823_ddg_now/dagre-GXQ25YYZ-Bue5VEJ5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '935d2cddf5004320bbd2216e2358fef7'
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7-Coij_kW4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '93a456abd1cb498ebc24874f9f92a837'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '93d0205ad9474dc88059c1d1fc85d9bb'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--eefec92e'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '942e9dc61b0d4b2d840ef9b582f31a21'
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2-BtRI4QOx.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '943db6a962be45abbc2f8d20ee697e61'
                        key: {
                            name: 'x_1040823_ddg_now/blockDiagram-I7D4REHJ-Dz5CKCMY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '94c0efc417b6471e87959d22e68fdee4'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '94fbb4395df34f8dbe86bca233b9e7fd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '95e5c6648c4547d2b23387147b61a4a7'
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF-g-SBJM0_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '968547ca2f3b402c88a305e39ad8b71a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '97a377e9d01a4b22b819a71ed046157f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ku-TR-6OUDTVRD.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '97cf687e36d3447a9e07e73059ef3bd2'
                        key: {
                            name: 'x_1040823_ddg_now/roundRect-C7tY77rS.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '97dafe96c39a45df818f52a88bb6ff87'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pt-PT-UZXXM6DQ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9880f56280974e1cb689f412d94706bb'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG-B8uAKHru'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '988a28acf0f5453dafd4c16e653459b3'
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT-CUmyT9q2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '98ef7f2c8d404eecb03e3ebf08c019ce'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '98f0071b5ff547c3b5150c048b48ddcd'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-TICWLB2K-BKeDgaK8.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9921605584134e938bb4da77d1ac5992'
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH-ULP8cSWE'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '99288a72904a439889b68eb837e14727'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'row_count'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '995aea1edeab4ea5b023d2f3aafaecb2'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'theme'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '996de75113fe4772a4bc5c5ae138eb2f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/erDiagram-RLTQ6QDP'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '99a97464e6174ee785ac8e7d55ad16f2'
                        deleted: true
                        key: {
                            application_file: 'bfaa799b1b6444878b2734c57d44d9c5'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '99bd69d1bce04d7892ddd219b6e1ae44'
                        key: {
                            name: 'x_1040823_ddg_now/pt-PT-UZXXM6DQ-pnur54di'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '99c37c467e104cdaa95cae27d753b4fc'
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7-Coij_kW4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '99f7bae4bf6e4fcf984880af937d73ac'
                        key: {
                            name: 'x_1040823_ddg_now/share'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '99f829ef9f244b83af74c65b3e24cb3f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9a5041c7f3a24070b09a0f59b45a2107'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kanban-definition-UXKFOSKX.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9aad033fc81747508d7fc7a102fd0154'
                        key: {
                            name: 'x_1040823_ddg_now/index-0yP82ECv'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9aad5b25a8a542718e3de67e03d0b2ca'
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4-BMx-8h2f.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9ab0dd924c5644f0b7b65a95f26f9883'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9b1e1e031a2a4b87acb9b7268559539f'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-v2-VYDZK3BY-DivwRVGd.js.map'
                        }
                    },
                    {
                        table: 'sys_ws_query_parameter_map'
                        id: '9b7c73335ec54251b8a47d70b01a30b4'
                        key: {
                            web_service_operation: '70f475e22eb34225834bc191c3ff8bfb'
                            web_service_query_parameter: '4907a11dfbbd47658242bb2ae8ad9da2'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9c12c7d7d0454c058d417b0bc23acdd9'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9c23e1143b144c149986e553177868dc'
                        key: {
                            sys_security_acl: '6732059ead0542a39f5e213cd40ac597'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c3fcf1da17543a6bff0f8cd086f1841'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c416edc8b56450484bb51791ab5e6f8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c77a721942d4a30a8ca063b22a64cbc'
                        key: {
                            name: 'x_1040823_ddg_now/kanban-definition-UXKFOSKX-BMzVdmj4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c87490746ca421b962369cf2dcc9675'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7-0j90lGAK.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c911c4de2bb4c5ca405c6fe1c724ac8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c95a4a8f28d49e3b48a9bb9de672c59'
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM-CtL1UH98'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9cc61b88694847318242539ccd3633ca'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/dagre-GXQ25YYZ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9cfcfd98c5db4ef098d33f5c178c0745'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-TICWLB2K-BKeDgaK8'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9d43f2af1fa249df993708060b9518eb'
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW-DEcW6TFF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9da820d7615f4a2f92cebb46762d2654'
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y-CYoj2IFH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9dc78731c8354bf9bd140c7d68b5c811'
                        key: {
                            name: 'x_1040823_ddg_now/kanban-definition-UXKFOSKX-Cte0-Wyi.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9e502b62141f41e6807baf42df554e70'
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ-CMlV0PaP'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9e948ee072ca418a9ade06ad9d5ce82b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ku-TR-6OUDTVRD'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9f1a2d73b3e442fc9dfe836821c81730'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'preview_row_limit'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9f2971e56b654794a92b78a9c5bfd0fc'
                        key: {
                            name: 'x_1040823_ddg_now/gl-ES-HMX3MZ6V-DEyZRniG'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9fac9ffe388a4000ab576485574f201f'
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC-CunEPfGH'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9fb4fb116f8c481db10a8ae1acd4cfe9'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-S7CK7UJ4-CJQrn8mh'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a050617a03934b668221747090ef5085'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-save-3189631c.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a0660076ff214de2a68eec57b65a3056'
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ-CswKAtE_'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a0e62d372c654c6abcf5b9b44a25b2be'
                        key: {
                            sys_security_acl: '4783798ec24f407b8a529b944ecfae2c'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a13716f39cd24d00b90457d98721e455'
                        key: {
                            name: 'x_1040823_ddg_now/layout-DsE6pXrC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a2d73bd61c714424bc8064a286f578b8'
                        key: {
                            name: 'x_1040823_ddg_now/fi-FI-Z5N7JZ37-BhGix29p'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'a2e908e691a1410cb6c3d87587ead6ac'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a2fcdabe94d14877a94589945be878b5'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a310927f66864419ab762c77e36a5c4d'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'null_percent'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a324933b6c394cf8ba23c2058a958f18'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a3c7d0c2d9e2451da27054e9f1b7f1a7'
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW-DPNLPdBm'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a3d96c9a45c648d496d28994367a8835'
                        key: {
                            name: 'x_1040823_ddg_now/id-ID-SAP4L64H-DGyYVRKF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a4006b7ab9744bbcb83eaefa14e85932'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--19507a10.js.map'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'a4305cf60a0f45069012150e774f1dcb'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_template'
                            col_name_string: 'name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a4a30188d73d43bbb2f8213417bbe648'
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH-BC0pwtuf.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a4c25af8ceeb4c0b874397ecb8e005a8'
                        key: {
                            name: 'x_1040823_ddg_now/vi-VN-M7AON7JQ-ChaAF4GI'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a51e75e4b1b24fe2aabf4a416ff26da4'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a56ca06e1ce545f4ae2e1a1393f72c03'
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC-BqWo9198'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a5c4f2b450e946bc9df84311611545a9'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a5dccda51eb44b7583cb5b89b49a374c'
                        key: {
                            sys_security_acl: 'cd4139d7c11149c8903d3c98ed665f0c'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a5e8a314d3bc42e2a37d82923be6792b'
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25-C7d7hSQK'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a60987c935a04e8a86bf49bd47c4f682'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a6795298fa6b49218f88e4b20e829177'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-7c801643-yVZYFD5P'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a6953c38ff0c426080f4253c366e3cd6'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'mode'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a6a08f0d49604a9ab9f05d30aa3d8400'
                        key: {
                            sys_security_acl: '9bd30d701f1f4017b6aec65569aa2a22'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a6a1f32153394e01985033dd88dd12a9'
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB-ByHQ7MVb.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a6fc163c490847b78aae49c55cf7e997'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_enabled'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a78317d88aad4df58a1aa86cc297b399'
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO-Cy4fBA29'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a7b0334ac9744066b9b5e6a183025f64'
                        key: {
                            name: 'x_1040823_ddg_now/sl-SI-NN7IZMDC-Bd_dBzeZ.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a7d9a0d4aff4490b92238f79e8651cc5'
                        key: {
                            sys_security_acl: 'b734be3b315546b79cc49fdaf1c366c8'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a7dc103d6fe24bf2a07ec70be9818483'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a87d7d396b9b4c78ad19ad481c00a17b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/timeline-definition-24CTP7MA'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a907719e83f94f7e9a841b150b4074d1'
                        key: {
                            name: 'x_1040823_ddg_now/image-blob-reduce.esm-C76Mz7sV.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a96c6c878b1844659fe97ee95573dd06'
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO-Cy4fBA29.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a96edf40e15c424c8f43d79b56b52152'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aa322a3a229c40d683dfc6bd5aa1d044'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'confirm_deletes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'aa873f3b21564760bfa01d5e758e071d'
                        key: {
                            name: 'x_1040823_ddg_now/hi-IN-IWLTKZ5I-5V38YwMx.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'aac925147c2e4a70bd85fb1710e79ef0'
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX-CzIeDHVz.js.map'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'aad7bc55dbdd4c81859eb9dbd819f40a'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'aaedc667ea1843c3a638c075c7ce7be9'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ab0a033af2714997ab15be4301e470b4'
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2-C-flf8KY.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'ab119d2f3fe54a98a7f7fb7972fec8c0'
                        deleted: true
                        key: {
                            application_file: 'b723e24e20e745659ec735e4ddfc80c5'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'abc3a37f1d5b4572a1828e520422fa2e'
                        deleted: true
                        key: {
                            application_file: '0e7e2dbb9e4a478bbe134b571786d436'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'abcf627f2b6a496ca3fb84cefd471be3'
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5-_n68QmqL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'abe572f0d0464214b1e7280350d3af9d'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4-BDIUhrt1'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'ac0c02262c144b11abe8b436026aff11'
                        key: {
                            application_file: '7c58f444c3c94be1bc11b1f1b8efd36e'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'acd96fbfe39948838dd067a3aabf82c4'
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO-Dx2nkbu5.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ad5d14d5023a461b904fb9c286efdcc1'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'error_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ad5d1e2bbc2c41328ec460021ab0b417'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'is_unique'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ad5d946b12fe47e29f360509183b039a'
                        key: {
                            name: 'x_1040823_ddg_now/sl-SI-NN7IZMDC-Bd_dBzeZ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ada4066aa515472197b106f47cc98cd6'
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO-DWepMADG'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ade4ea2b6aaa4d728b8b5c62798c519d'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4-kILQyRVZ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'adeb5f284e1c4244af5d09ff2543c393'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ae01e839fdb541da8e6ff43fc0dd7b7d'
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU-DNEHyuDj.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'aea7852889f24abc83e3b9f3f5c9870f'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'theme'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aeb55d1cf9344b93b54d7c5fbfae1cec'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'seed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'aefa569da4744df88a2c073f742ddd9f'
                        key: {
                            name: 'x_1040823_ddg_now/he-IL-6SHJWFNN-CtMnQ5D7'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'af05f0e21de34d0c9b812194eade7369'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'af1a8a8b781b43b1b19c1dd25515fe54'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-S7CK7UJ4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'af2c80e2602645f3ba76def07bb17fd2'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'afd14c17a37849cea711865f9cb1afac'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b05227d2d7a04edc8b0679658e5fb484'
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW-DEcW6TFF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b1155a9611204c70ab24b37dacafc276'
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY-DZkbsF7L'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'b14347eda2794f44b5b77baa2e85b40c'
                        key: {
                            application_file: 'c19b7640b86f4b48a0c0ee6890eebe34'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b18f590f71a445afb4c1ef6bbfdcb458'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--b78dee07.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b1900c30e4ba4814ac9b518abbcc912a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b1ab71c802bd4447868fb78f6fcf9ce3'
                        key: {
                            name: 'x_1040823_ddg_now/mr-IN-CRQNXWMA-C_EMEBK6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b242bdbf79af4ad183f0be5d56ccb1b7'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b25a4946a19847659a72c191cb819d7d'
                        key: {
                            name: 'x_1040823_ddg_now/fi-FI-Z5N7JZ37-BAHpHnE4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b39610e80f224eb18efa0f9188042dd5'
                        key: {
                            name: 'x_1040823_ddg_now/xychartDiagram-S5SC5T6Z-EA_TVuPT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b3add6de87974db8882bbb3c0b10d155'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b3c53e01ec904cc6ade7716511f540f3'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-002ab408-CfN_GCJH'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b4090c0e8789430fa609d2a90c988084'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'whiteboard_autosave'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b41ec80974a34525aae28f023d2b0817'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--b66a787f.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b49abf0c1e0b4de08f895c751f8b206a'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'field_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b4ade2df77b541d29aa333b832f9e375'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/roundRect.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b5ee3807cf754b5aa50c6cb4a4ca4b36'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b62046cd642b4e32bfe2730f7978469f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b63b33bb411649a8ab74b1b6276d4875'
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW-D0FnaILT.js.map'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'b66e5abc8d7543da84cb8ad6cf4e115f'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'b6833f922e254d5b96aec32b14def1e1'
                        key: {
                            application_file: 'd8cc39d15a8a4c93b45bcabce8080ad7'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b694fd5dd7434ecd976f310a08d714fe'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b6a8623180a84f7d93832f16a7cbec6c'
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW-U1gpDERe'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b723e24e20e745659ec735e4ddfc80c5'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--4a265a91'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b72719e5415a44bf8bd5370bac79a41b'
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA-B1skYfaJ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b738d25289014eab90d317a01cd3d0e3'
                        key: {
                            name: 'x_1040823_ddg_now/nn-NO-6E72VCQL-UHqNFNxF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b741b23304a74c88a20cfff0e13fe82c'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/flowDiagram-HODETNUW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b767c9daac544a39ab9c72803cdcc681'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/RecordContext.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b77f3d5dc338413cba7aa810968803f7'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'editor_split_percent'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b7880638a78a4a99999a49f749ece699'
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4-BTgBkAXn.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b7ccbbaa236f411090de4d3022ad3444'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_template'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b80ad958f22c42eebabd38c93b0bf361'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-01563666.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b80bc204e7e74dbdaf331f7fe55309c7'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'b83638c2d793444b90a124d70d1412c7'
                        deleted: true
                        key: {
                            application_file: '0bc4f28eb4f246bba87ac8f6ad1c00a8'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'b8eddc7d05cc4b6cb85559b5fdee2009'
                        key: {
                            application_file: '374f561ede0741fb944e8342cb3780d9'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b8f315848efe41a39818e9d0e5a0fcb4'
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3-BF4aOpJI.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b909c8c45b6449488af0846531f26ce1'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b90d98f49d2942159a5e136247798ef9'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--c69a7a4e'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b913a2f28ae34cfaa215ce9978952307'
                        key: {
                            sys_security_acl: 'f3c5d65ff4854ddb9167e9fd1819dd4b'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'b91aebb09a324b699015f79590ed1c0a'
                        deleted: true
                        key: {
                            application_file: '57f9ea141fb644b09e75230a3abf3518'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b91bdbd7b6ca4f699a7ea5ce6e26f534'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--5e6a6dcf'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b9bd505a384545ba9dcc03cb041feb76'
                        key: {
                            sys_security_acl: 'a56c2595d7ca4e1d9f8ac6b443002410'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b9c8c07f8d504774b3df38fbad15f12e'
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC-CjnDBAOl.js.map'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'b9d484ec0fa24684871cba0adf61cd20'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b9ec8f6cf4bf47c8823d448a1da5f0db'
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4-Cq3wMFjK'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b9f31a1b68824ec5b7c6d64a7cd859d2'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ba23aaf610d44e4089dfb44b0968a7c4'
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO-DxLdtPgG'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ba7bc71e095f4f6ba9fffc0d249932ae'
                        key: {
                            name: 'x_1040823_ddg_now/mr-IN-CRQNXWMA-_orse_LA'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'baa66146274d42eb8b8f65d5b49fb41e'
                        key: {
                            application_file: 'e0cf273b160f4bcbb34a8cabbabfb683'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bacec7383c8548e1a8f0b4199a3ba269'
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ-CswKAtE_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bb074cf36a664beda8ea6e9598b9c95f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vi-VN-M7AON7JQ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bbacc428797c4715beef8a7c68aee4cb'
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5-_n68QmqL.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bbc227b060ec4fb19dfd7680e9635ecc'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_export_format'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bc1592a489e04c31a88aa6961e4f1da7'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bc56921f460747d89b2d860ecd7a8cc7'
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-4ed118d0-zRQBRdoh.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bc66207828234af094110aaffecf6366'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bd1240c2ab2c40f1ad5acf6fc61573cf'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'bd9d1143fa8c4ab0a32c4bc50d800431'
                        deleted: true
                        key: {
                            application_file: '144d8f69ed6e4c17ae88c1ca94c91178'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'be0392cea11e427982eb3ff119f69b4f'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA-354iFx8I.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'be061f9a224c407fb3793d43e948e7b4'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA-CVaLEqvA.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'be5726216bbd420a9ddc0c12eed12689'
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB-ByHQ7MVb'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bee13130f6004bf399cab361281bae06'
                        key: {
                            name: 'x_1040823_ddg_now/pt-PT-UZXXM6DQ-pnur54di.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bf6cfb90465e4b98ba385c9ba7b2f180'
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas-BQ0RsXay'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bfaa799b1b6444878b2734c57d44d9c5'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--5e6a6dcf.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bfce392704cf4a05a5cba0a77ffd0c90'
                        key: {
                            name: 'x_1040823_ddg_now/fi-FI-Z5N7JZ37-BhGix29p.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bfda98553b6f40968ed4ac858e3110f6'
                        key: {
                            name: 'x_1040823_ddg_now/erDiagram-RLTQ6QDP-DQ1iWwqO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bfeec9b2a54e45889edf70b784ef726f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c061d2a3dc4d4adb944ef6a8e9bf5d23'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'c0b8d9d569e8452aba6722cd14d71537'
                        deleted: true
                        key: {
                            application_file: '39ee8a5710124d69b6b6045e091d470c'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'c0da991d8395432ca015cbdff499eafc'
                        key: {
                            application_file: 'd8cc39d15a8a4c93b45bcabce8080ad7'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c0dd20a4135a481c96970feb82f029de'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/hi-IN-IWLTKZ5I'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c0e4d590e50f4880a1c53e29b447b8a2'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c0f9c9b78da9454e8b011084fb05f572'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/pica.js.map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c160eabebde14fe4977f2d59e0403808'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'theme'
                            value: 'system'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c19944acef0d4d1ca8c2acc640cb814c'
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH-qkRh4k7M.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c19b7640b86f4b48a0c0ee6890eebe34'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-cytoscape--269d8a18.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c1d58c35559643549b827ad74fd6a292'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/kanban-definition-UXKFOSKX'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c24d7d855d1545e5b0fde41099f0115e'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c2da1d970c3c4d988378e62d6e07e660'
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ-BpGfK_2J'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c37b4efa7566481a9cb95ad386313086'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'metadata'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c397a56a240e42828496b681a7d32725'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c44e1baf6d564254a16b92c7cb586839'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-TICWLB2K-t0RZIk_d.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c4bfa25b718547888c9c13cf67dba718'
                        key: {
                            name: 'x_1040823_ddg_now/file-save-3189631c-DG6xnOz_.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c5285f9f9dbb43a2a609247146b58c1f'
                        key: {
                            name: 'x_1040823_ddg_now/he-IL-6SHJWFNN-C4zqmB2h'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c5564c688107440f8592a3e56f27437c'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_password'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c5c08124fac245bdb1d55b6455f04ba6'
                        key: {
                            name: 'x_1040823_ddg_now/index-0yP82ECv.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c5c2e9683ede4ccdbcf8157b68a64c9b'
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-01563666-BL1p7Irl.js.map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c607f093dae742a2849c599d51b83e15'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                            value: 'failed'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c645433812684ef2bf499ebb46ea74a2'
                        key: {
                            name: 'x_1040823_ddg_now/timeline-definition-24CTP7MA-BEJp53ht.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c64d908a251d430c98073b5ebf6b14e9'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/layout.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'c6add53e32954225bface99199f0e9cf'
                        deleted: true
                        key: {
                            application_file: '9128e71a66c94c06869c2a03252014c4'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c709fc0b4dba414ab062196251d2af6d'
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB-B0D6SkPg.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c817d28c6dc14e63898131e10a9fb06f'
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-4ed118d0-zRQBRdoh'
                        }
                    },
                    {
                        table: 'sys_ws_query_parameter_map'
                        id: 'c889f354bd39403ab91f51c53b23ad30'
                        key: {
                            web_service_operation: '2eb7f0e396014ea7b559557e564c34ca'
                            web_service_query_parameter: '9eb1cbe3456d48b48a2a2302e6340136'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c8aaa7e0822d42039dfe713c51ebc78a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c8c16cd2771e4bd8b0fc082b50820460'
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW-D0FnaILT'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c8e380a4d8554031b1e249c734a49e15'
                        key: {
                            name: 'x_1040823_ddg_now/mr-IN-CRQNXWMA-_orse_LA.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c9db5ff1d3664cd885dd56d4525e6899'
                        key: {
                            name: 'x_1040823_ddg_now/flowDiagram-HODETNUW-BMNG3k_i'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'caa3ffa097674f14a8305af74546edb9'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sl-SI-NN7IZMDC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cacad19fbb654938939b3097c40d414e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-save-3189631c'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cb000ac3a44941c089171d9957d03f0e'
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO-CBclW94W.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cb2c7808127044d2924499abd7a999b3'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--4a908658'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cb708cfe317b4ccba02e4d24ce917daa'
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT-BgUKqmP7.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cbaaf8c8d9a9485b8c78be545b25a4fa'
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3-BF4aOpJI'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cbd7855f033f458c86095536014c1c1b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/az-AZ-76LH7QW2'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'cbdb77d1141f4c06b6b24f96f7d444df'
                        deleted: true
                        key: {
                            application_file: '1aa510d9c1b8412f99fb9ea0f49c128a'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cc0ea8df351341dda296f0cf31577978'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ccdfb3c2a6624ad783df318f5e2b1f50'
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB-B_F-nKE0'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cd972b1e0aba4fb6a1569a84fef560ff'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cdc2134ed595465bb137f091a4d369b7'
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO-DWepMADG.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ce27e629a5d94aab8c9482edd3e26828'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/xychartDiagram-S5SC5T6Z'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ce4cdf9b42a34edab205b19c3d5aa1ca'
                        key: {
                            sys_security_acl: 'e09be432962847999d1eddf3d7194e7b'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ce8c222beceb4d67b78e62368aa26fec'
                        key: {
                            name: 'x_1040823_ddg_now/he-IL-6SHJWFNN-C4zqmB2h.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cec9a133aa2d461f9831389621b33546'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cefccdd4b0674c778ec034f16f7347b1'
                        key: {
                            name: 'x_1040823_ddg_now/ku-TR-6OUDTVRD-BUOqwN57.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cf76feb967024111858575b4ee84051d'
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH-qkRh4k7M'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cface2c9f457410ca4d8491f0dbd4a94'
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z-DyTbEvkG.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cfb235ba1c7f460d9dc25985f7092e98'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA-354iFx8I'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd0988c649a5d4a5abbb8ff1ff6e53426'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd0ace893e43e44bcbf018a5bb5f277d3'
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2-D5WSi-x_'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd0d6b7495a244c618dd5c45e183ee17f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd0dacfe40f7644dda693cf6118373068'
                        key: {
                            name: 'x_1040823_ddg_now/image-blob-reduce.esm-C76Mz7sV'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd14dfbfcf2544dc49629635b9c52674b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/gitGraphDiagram-WWUBYQGX.js.map'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'd16b7db7efbe4a37a448dd8c4ece78bb'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_export_format'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd185fb0449ad4aa2be7d00f2091a880a'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_row_count'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd2158c14a1f446539f2c517df44a1c41'
                        key: {
                            name: 'x_1040823_ddg_now/xychartDiagram-S5SC5T6Z-BYL_YKLb'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd2f3519975974c218ee3a96fa74a1e4d'
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE-FEf_Amsx.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd3a33645918f4ad983454b2eb4bb3605'
                        key: {
                            name: 'x_1040823_ddg_now/kaa-6HZHGXH3-CgwBl3G8.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd3aa24e7d50249b3972d02c626a4ea83'
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC-DYWkG3mW.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd3cfbf7737aa49b6b7a90379398c65f9'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd41251fe17f94a959553b37d2d4edb0f'
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM-CtL1UH98.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd449e5eafea442a58d50b90e82d3b508'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/blockDiagram-I7D4REHJ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd45336bf9b8f41948fa7d755aaa5a75e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/gl-ES-HMX3MZ6V.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd49012f9586c4439beed7d99a2d088a9'
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q-BMonfSbw'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd499121f4fc54dd0819bcdd39c807943'
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE-D_x2Nv-0.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd4b7238890194862ac40dbea3c146e5c'
                        key: {
                            name: 'x_1040823_ddg_now/pica-DUbMta1h.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd4b9db503d00422ea0ac9b13a75c750a'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII-B-s1mbM6.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd4f96ee26f094e9c94a7f662fa45020e'
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q-BMonfSbw.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd50867524183474bbf6e39000519688d'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'sidebar_collapsed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd50a6ebcc92940f487b0dbbc5baab7c5'
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU-BqamUi59'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd51bc72b0d4e47ad9c5e57ee6ee35dcc'
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z-DyTbEvkG'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'd52e1763609a4d26b75edc0f9c54d1d3'
                        deleted: true
                        key: {
                            application_file: 'fa17939fda824078aa6ffb2fbf51238b'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd5fc86b65f724583957d799b616f2297'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-open-7c801643.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd622841c511d44d2aa3cb1d4917b78ce'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd633afe7c36f40e5a076de4b6f9d9e67'
                        key: {
                            name: 'x_1040823_ddg_now/dagre-GXQ25YYZ-Cj8zLCHt'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd66e2c011f9742e696d1b09081e7c65f'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN-BSAkjsL3'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd68de9c895054c6d8c93222b81284352'
                        key: {
                            sys_security_acl: 'e2abed3e4d214345b1986dcb48995feb'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd717c7f738df4d238b53258877b724d6'
                        key: {
                            name: 'x_1040823_ddg_now/pt-PT-UZXXM6DQ-DzSDbtWR'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd7267eef88f9461cb2318a64dc134da0'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA-CVaLEqvA'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd78942f28c0545a6a07b31346eb4fd5d'
                        key: {
                            name: 'x_1040823_ddg_now/vi-VN-M7AON7JQ-Dj2XIdc6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd7b1a3e9e77d4c538964b59a517bc7f9'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd7ec543c796946c9a6cf2097792ab232'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H-CUQ2_vEz.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd8586e24f8e140c6ae0f5a3bb7d3b484'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd8618d68ccc44a77834d292f6f935f4e'
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7-1ImVviOm'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd89eee5a4bd3443d8dc183fe9d23e4bb'
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH-fTozpNE0.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd8cc39d15a8a4c93b45bcabce8080ad7'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@mermaid-js-parser--1b54e87a.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd8eff0e1cb3449b08cd40eb95e6b7cc9'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7-Crv2BHTE.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd947228bcf8c49e498915524c73cea5c'
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z-Bc68X6qL'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'd9487a872bd748358cac072f70d87440'
                        deleted: true
                        key: {
                            application_file: 'eba82aab22214b088d2075ddd36403b4'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd9755298a6cf45eb995892d1d2cf1c8d'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'da4ae0a7241a4946bdfa7b3cdc8c293e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'da6099316eae4b1d8268b76e628d6f74'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'da7c7fa1e91740788e427987a43227eb'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'daad9c5f0aa54141bb77240e5a5755d1'
                        key: {
                            name: 'x_1040823_ddg_now/flowDiagram-HODETNUW-BKxBUS87.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dab3d840b0e44f25811b80cc47349673'
                        key: {
                            name: 'x_1040823_ddg_now/fi-FI-Z5N7JZ37-BAHpHnE4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dabdc08754f946ab90a7a9d93c4da78b'
                        key: {
                            name: 'x_1040823_ddg_now/fr-FR-RHASNOE6-0E1DzFN2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'db10016603dc42e2a48372ab6e33d430'
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT-BgUKqmP7'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'db2f02c11b9f45818c4bb55faa58266f'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                            element: 'script'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dc3903e70a2e44ce8fec154bb31d7a19'
                        key: {
                            name: 'x_1040823_ddg_now/pt-BR-5N22H2LF-CAn5-DTZ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dc69f136dcff457e86f30314f5049bb2'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--d1b8466a.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dcc72008799f4258964b85648ac629b9'
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC-BqWo9198.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'dcde3667bb344f27ac13dee1eb499f08'
                        key: {
                            application_file: 'b90d98f49d2942159a5e136247798ef9'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dd09e1f7f7444d6da78db34c1bc3f254'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dd18b3ad9a6840cea72408e1bfd7a92b'
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE-FEf_Amsx'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'de351945507549ac8c3865f53c349888'
                        key: {
                            application_file: '438143fade414d88b8215388ce1a66d3'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'de482b5eb5cb4be791ac749627ec2e1a'
                        key: {
                            application_file: '84054f3de553491aa19ae98f03751a45'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'de485d3914b14e3dbe86f0c87003b2a0'
                        key: {
                            name: 'x_1040823_ddg_now/layout-Ct4vpGAO'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ded07f8759804e28ad537d230d90f617'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'df1977fc8f1443c589a67d935776ffdb'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'df4bf4176f724b31891bd1a2c08415ae'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                            value: 'complete'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'df7260db102e4685a7da11208e11d110'
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW-DXoTtWfp'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dfafc354ed084c0d8c4a163c86eb8703'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_token'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dfb18f2794f9426b9a0c44b62251b6da'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dfcac8d13a154eb681b345c1612d4847'
                        key: {
                            name: 'x_1040823_ddg_now/mr-IN-CRQNXWMA-C_EMEBK6.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'dfcf8fb9a516471bab43ef2ccf21deb9'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H-d9EU3fi7.js.map'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e0a4f43a414b4d4a998b54eaf7e86b6e'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'theme'
                            value: 'dark'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e0b52b1899dd4635ad88402ec0f14cff'
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC-iZDYBfcF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e0cf273b160f4bcbb34a8cabbabfb683'
                        key: {
                            name: 'x_1040823_ddg_now/share.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e17a8cb203b44405abffcda0d4a9da19'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-XXDRQBXY-DlF2GrV5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e1dcaf2439b34e4db476706c83d7865c'
                        key: {
                            name: 'x_1040823_ddg_now/kanban-definition-UXKFOSKX-Cte0-Wyi'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e2363bd7163e4a3c8f03f29f42589fb2'
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ-CMlV0PaP.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e26b177986d84e8883929ae985d39688'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'share_enabled'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e2b652f5fa0b447fa022bd58478a8bfb'
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH-BC0pwtuf'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e32613efbbf640949f19bdc6c6380c1f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e350c3429d1a4324b1fa0ee4857e6359'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e3863d9abc55491892de7331e8639d59'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/image-blob-reduce.esm'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e40a7c78f6e84233b0a54182b92b8db1'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-S7CK7UJ4-BYkaGnax.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e45d03d6a9824893898cabde009b6f0e'
                        key: {
                            name: 'x_1040823_ddg_now_whiteboard'
                            element: 'scene'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e5152c46c32e47cbab916ae31a2fb23b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e665e2d21f6d4cd8b5b9c52b0d72137b'
                        key: {
                            name: 'x_1040823_ddg_now/xychartDiagram-S5SC5T6Z-EA_TVuPT'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'e6668edb239547249af8e06e413117db'
                        key: {
                            sys_security_acl: '2e8526cae15e4ce4b62679fe062300c7'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e69197cb7e314110a4edf10128d8d08e'
                        key: {
                            name: 'x_1040823_ddg_now/roundRect-C7tY77rS'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e6b746a081224937aac156dff4d4c9c5'
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4-BYLtW0AI'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e6c5221a6f704f5591d2ae47c6eee485'
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2-BtRI4QOx'
                        }
                    },
                    {
                        table: 'sys_ws_query_parameter_map'
                        id: 'e73d6d33a39e46d680f10bbecfa81194'
                        key: {
                            web_service_operation: 'a91945975485421dad7667f644db7cae'
                            web_service_query_parameter: '5a83d2b97f6e4f32aa3cf76b54df7eb8'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e75d9d2f94674fb5bf420d3d17369058'
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT-CUmyT9q2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e7edc2d95d9f450492225de5b069fb79'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--3ec602ea'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e7f4170cd7c548aba533da22b3ba82ea'
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT-Ctsz3n1b'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e7f9c37598724add99f9b64e42a32932'
                        key: {
                            name: 'x_1040823_ddg_now/pica-DUbMta1h'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e84bbc2fd8c34613bc21c96442853a01'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                            element: 'script'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e95225a5e1f04ff0bed3c1ef3bea11b6'
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA-BmaHfgjj'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'e9a4f78944ef43f494388445428a9729'
                        key: {
                            application_file: '856799e3c54f47979a0d264f6a66344b'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e9eca4d350f24aac9bfa8f97eb30cf63'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/file-save-745eba88.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ea1f24b127b64199b6c28bb8278a21b6'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ea2a2a4810ac4a65b8df702a5c3d3edd'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/id-ID-SAP4L64H.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ea539f2c38df44319eb0c793adadd84b'
                        key: {
                            sys_security_acl: 'fd905064ec2b40bd970e89b7dfadf60e'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ea7aa65cbb964cdcb4d55f3cf2c1c84d'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ea99e95c358f4353bc291d6d237bb557'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-v2-MP3YSRHH-DWrp6PyL.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eaaa74a2b95a4eac9dd498ab2b59065f'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'eabe356a8be340639163f52a22dd8c71'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/chunk-TICWLB2K'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'eb2acd93f21d47f3994d09757b100053'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'eb5f421295124c9eb5de7b9f5e78ccd5'
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU-DNEHyuDj'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'eb77fc69d135468dbbfa724a6a6eecf8'
                        key: {
                            sys_security_acl: 'ec04db9b75b24123ac584edddb8aba97'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'eba82aab22214b088d2075ddd36403b4'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--4a265a91.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ebdbd625e849438185ffbe9ca3bd640a'
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY-DZdMbhy4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ebe2f449ae8e48c5bd0fa57731ef112f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/RecordContext'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'ec2214cb053c4c1288da97e606e9746d'
                        deleted: true
                        key: {
                            application_file: 'b41ec80974a34525aae28f023d2b0817'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ec6134c6df8942c691e541def24cbb4a'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'mode'
                            value: 'random'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ec7e13c302ab4297ba5afd475799963a'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ecc162a20f514100b08c7842c65a0365'
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT-ClcnlvIq.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ecd99fd915f34691b9ffd41e625a0bca'
                        key: {
                            name: 'x_1040823_ddg_now/kanban-definition-UXKFOSKX-BMzVdmj4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ed8f42f40eeb4b56961289347cfd7f14'
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N-CbqboLt7.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'edc2d62df8314b08b93db1dc6d21e0b3'
                        key: {
                            sys_security_acl: 'eef76f3990da41ecbc25d0ef401feec0'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'eec6226947d34b41bdd3a9164951fd43'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH-BSt1_miy.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ef2b61af406f41c1a65b00befd151f80'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ef75a7330e4745c2a5a1298402abf6da'
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE-69HzcfMn'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f02983ff3bc84d8c99bc3844bd839657'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/fr-FR-RHASNOE6'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f04e2016e58a46209e124a2ca3fe3315'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_export_format'
                            value: 'json'
                            language: 'en'
                            dependent_value: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f0c878d81e9b4031ab91aba8a45de101'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--4a908658.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f0cea195ebb347688c79d642451780bc'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'row_count'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f10541df0fd74ee6ad6e61ae89b58c52'
                        key: {
                            name: 'x_1040823_ddg_now/lv-LV-5QDEKY6T-lAIXK2Da'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f143c5ea5ed84f0ea945799fd287e4d7'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'whiteboard_autosave'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f1442f92ee574637bf490ef4e9063bb1'
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA-BmaHfgjj.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f2a6ffc9be704fbf88864c0f580fc078'
                        key: {
                            name: 'x_1040823_ddg_now/gl-ES-HMX3MZ6V-DEyZRniG.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f2b7b248b58f442a9c5dc9effb650b57'
                        key: {
                            name: 'x_1040823_ddg_now/pt-BR-5N22H2LF-BefbOH_r.js.map'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'f2cc5e46b5934acca7027bd229acaae0'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_dataset'
                            col_name_string: 'state'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f2d810480357460fbe2bcef3e78429fd'
                        key: {
                            sys_security_acl: 'bfb200c957fb478aaefce4427fd80036'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'f2ef9efab3f34ca1bb44fa0264f9a16a'
                        deleted: true
                        key: {
                            application_file: '1c11166678c847a8aef89222aeba14ac'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f2f23667b0bd481d8647cad4b93c71c8'
                        key: {
                            name: 'x_1040823_ddg_now/zh-HK-E62DVLB3-1CkJoBs0'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'f3160ec32c8445a88e99d94312566f76'
                        deleted: true
                        key: {
                            application_file: 'fddd2d1243cb4de3b74ab66c71d586be'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f33ab2ebde264df6bed598d8578c6c2b'
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A-COD1tkK5.js.map'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'f3d9b16bbd6148a492730bab16dd07d4'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f3dcd57fd9e34581a9f4b6b4c749cab5'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/index'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f417fe3f87a1488c86edbe9993e9bef0'
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE-CNNmrZ-3.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f4456850596e4e72bc46de85bb749a8d'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'order'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f44b25cea9454de0ae33f40fdde5644b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f5ce288e5fc04d6ba332af055deabe5b'
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA-B1skYfaJ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f5fba1e17a5c4c6eb4e848b8ee3b2a5e'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f614c2a066e444cbba1845ccf7106a68'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f681ba630e9f49bda4348c11f4d30958'
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO-CBclW94W'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'f6b0d22d754c441a9861ae6ecbea0f08'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f6dbf61867164360b49dbe37a039e5e0'
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE-D_x2Nv-0'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f707303536c7485bb142642a730af42f'
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE-DcIvpsO_'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f7662fe666a74e25a125f38db11b07cc'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/image-blob-reduce.esm.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f776d28ff17a4325a193cdfce8c9a452'
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL-Ca30LSIx.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f78c63289c6a43c6a6b7616c956ebd94'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'config'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f78f51f535c443bba0a857767e8eea84'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f7a6102293394ff09d0e97109677cc37'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/he-IL-6SHJWFNN'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'f862044c91b54b0b9214ed111168ba9c'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_whiteboard'
                            col_name_string: 'share_token'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f888e97a0ac44505a31203542b44d354'
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN-C6I-Kp8x'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f8a3f8aeeabc47448308aaac51758b20'
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR-PL-_YlRd'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'f8cd9a7d38ad439db9204a85638b8a7b'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f8dbc3dce11f4a7b96d9a99cdc809663'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/fr-FR-RHASNOE6.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f90133092fbb4503ae203ad24f5ac0ce'
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk-B_zpKlkS'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f97076f8cbb1437f837685d2bed3b2b1'
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y-CebfxyqL.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fa17939fda824078aa6ffb2fbf51238b'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--c9bffedf.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fa9f4d385da54e73a1e712c5812de768'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-XXDRQBXY-DlF2GrV5.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fb36e8150d294c8ba65aa9fbe30414c8'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fb90c2f77a70484f87bbb8139499b147'
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-ZZMXUADV-DivwRVGd.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fbfd76f833b6436da8283135143db125'
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5-BKbjmcZ5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fc2351e9cd4e4a7cb7041f45605a67b1'
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK-da-e7hpp'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fc78167d9d4743f3b53f31bd34299c2f'
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU-UI7jAdQZ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fce9c35255134cc5b68349f76fa68e97'
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-01563666-BL1p7Irl'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fd92536cfc8f4511953a86569ec288d3'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/mr-IN-CRQNXWMA.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fdae8e711b8f4555afe981535e009aa9'
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT-BNpivGXv.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fddd2d1243cb4de3b74ab66c71d586be'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--b66a787f'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fe440090eb5042039d86e39843db79ef'
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N-Deb3-jJq.js.map'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fe6ae1fb1d63438ab4884c935b78fc20'
                        key: {
                            sys_security_acl: 'e165d5b379f1485eaa13169e7f6537c9'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fe8adf5be3174c22820da9b5dcdbd290'
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC-Ck1dJOIn'
                        }
                    },
                    {
                        table: 'sys_user_role_contains'
                        id: 'feaec65c2ffc42fc9412a91202f9882d'
                        key: {
                            role: {
                                id: '720f69c75c624931b74831bf30d08913'
                                key: {
                                    name: 'x_1040823_ddg_now.table_writer'
                                }
                            }
                            contains: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'feddb9ac34fe49f1a42ce563c4676d27'
                        key: {
                            sys_security_acl: 'b504934ac6a74c1494c5ee4c3fa57c7b'
                            sys_user_role: {
                                id: '55dbf8e21b344897ba7d6c4ae551342e'
                                key: {
                                    name: 'x_1040823_ddg_now.user'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fee5b3e78a8f464ab6e9beb0be0716c4'
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE-CNNmrZ-3'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ff103520120a422297ec97b2c9eb7aff'
                        key: {
                            name: 'x_1040823_ddg_now/hi-IN-IWLTKZ5I-Ckx_Qn7-'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ff15b4fdcc9c48e49c362cbd2939c1f7'
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC-Ck1dJOIn.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ff63637a83a84e5380f7433060fa638a'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'ff80ecf1b96043389fc65ec71992dc85'
                        deleted: true
                        key: {
                            application_file: 'a4006b7ab9744bbcb83eaefa14e85932'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'ffa954b5ef2b483593f4c7c38023a8c0'
                        key: {
                            application_file: '32e31e63f25f4df087afe438595782dd'
                            source_artifact: '5c7a216b0266427d8a3437c45a5808c6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ffcd3a146a3243baa7dd92e2d59bd136'
                        key: {
                            name: 'x_1040823_ddg_now/kaa-6HZHGXH3-BOOqjNSO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ffdaa7f3f2cd411a8b2bf96b7a0abb17'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vi-VN-M7AON7JQ.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ffdf85659b124a7ab6983b38aa95f8af'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_field_type'
                        }
                    },
                ]
            }
        }
    }
}
