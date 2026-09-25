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
                    'ddg-api-preferences': {
                        table: 'sys_ws_operation'
                        id: '371ff3ca3de340fb9a8e760b967c6e68'
                    }
                    'ddg-api-preview': {
                        table: 'sys_ws_operation'
                        id: '49f7590892df4830af539b647654a31f'
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
                    DdgAjax: {
                        table: 'sys_script_include'
                        id: 'e20d611018c24b1b9e5b67d27f12bb06'
                    }
                    DdgGenerator: {
                        table: 'sys_script_include'
                        id: '2143047803594212897faa8fa1fb9ab0'
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
                    'whiteboard-write': {
                        table: 'sys_security_acl'
                        id: '8490cf956e13429ba1dbb722f05e3190'
                    }
                }
                composite: [
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
                        id: '006a3b6002b542e3b422ae9950511cce'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '00c8fcc7b3a444e5b90f4896946229f2'
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH'
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
                        id: '0201916b7b6d4f57b5fc96c4190c2c65'
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '03c0b6a6a40c44628911405feecaf6b3'
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-01563666'
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
                        table: 'sys_ux_lib_asset'
                        id: '06491c50b65b43f5b5462429e71a926c'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '066043324a414176879cfa292a318121'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-UQ7AKVKN.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '06aa8c32547e4aeb941f91b93e1c1a62'
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '07e53147a5d44e2baed5f9c57dd67df1'
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0825fd22f8594853934e525951fe3ea7'
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
                        id: '08bcc49cb04f4e3a861d9a2eccd89d6d'
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '08e0e929d3734a8faf50ca02b783dd0e'
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
                        table: 'sys_dictionary'
                        id: '0acbd8e2c1f3479c830bc9bdf077c036'
                        key: {
                            name: 'x_1040823_ddg_now_template'
                            element: 'name'
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
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--fa178057.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c03827febf74cac9fa657f9ec87b00b'
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0c23cbd7670c4f0e95f2876784e55ed6'
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
                        id: '0c898d6cdfa641dc94deeeacf7d765bd'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0cab25d6c2ad4debb63ccec6eab79d20'
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
                        id: '0e7e2dbb9e4a478bbe134b571786d436'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--a4a37b31.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '0e9342e7c0d24d11a8cb046d921296c0'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-7c801643'
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
                        table: 'sys_dictionary'
                        id: '1255899bb2fe4caf8e4f6f96b10a1162'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'locale'
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
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '1423309c99fb45df890e30c003399e39'
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z'
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
                        id: '14d8d99ca5c843b082c4fbf5a97c3a49'
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '15f4f0fc46db4e81b6b705b368dc3754'
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '165e8b82bcbd4c3295294f1753f0e9b9'
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4'
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
                        id: '1866eea1913a4bd992f1f39350a608d8'
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
                        id: '1c11166678c847a8aef89222aeba14ac'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--fefe7901.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-ZZMXUADV'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '213320c2b0294e04b4e9ea163be0f286'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-v2-MP3YSRHH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '234047799f794b658dfa43051c9ce68d'
                        key: {
                            name: 'x_1040823_ddg_now/xychartDiagram-S5SC5T6Z.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2354b1095c5a44de8ccfba6432437f02'
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
                        id: '23808aa24cdc4df7b7abaeec9d14dd4b'
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '239150a900194a918f4d9f99f65906cb'
                        key: {
                            name: 'x_1040823_ddg_now/fi-FI-Z5N7JZ37.js.map'
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
                        id: '2638b0e6f87741e88f6bbb78e42dca9e'
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2641fb36c54e446599bb5c0e3dfc0abc'
                        key: {
                            name: 'x_1040823_ddg_now/flowDiagram-HODETNUW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '26a778cb6eec40f68f3aab93d6753a67'
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
                        id: '2929c9566ccd44f2848cccd5ec744bef'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-pako--ce69c75d.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2969dfdd5a9f4734b504818d3a044b03'
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2a047c1b16f74ec6b03f1fd415ef28ae'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H.js.map'
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
                        id: '2b1d5169d49b40b2a480d3c798ad3e8b'
                        key: {
                            name: 'x_1040823_ddg_now/file-save-745eba88'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2bc2cc91fe544d508d7ce98652d89f47'
                        key: {
                            name: 'x_1040823_ddg_now/index.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2c278fad08964f6ea5c88e6894e73534'
                        key: {
                            name: 'x_1040823_ddg_now/km-KH-HSX4SM5Z.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2c6728fd61154d588b9e9e72a624c001'
                        key: {
                            name: 'x_1040823_ddg_now/nn-NO-6E72VCQL'
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
                        id: '2ccd2f4cc26c423f8bee14daa0b28251'
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas'
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
                        id: '2ea52297bd244ca29499b9cf5c094d93'
                        key: {
                            name: 'x_1040823_ddg_now/roundRect'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '2f55f2239c92469eb62350d5a0070e3c'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '30022d7533bc40fa8691b305738858fa'
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '306cd2de3f524e1894c5864cc76922fd'
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
                        id: '334408a40a4a47e3951c0cd664380c4c'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-XXDRQBXY'
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
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '343868cfef43439893d60afdfdc5481a'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-002ab408.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/classDiagram-v2-VYDZK3BY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '35e5868a434d47788630af8dbac3a7ef'
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3609514488c34d8f96814c9e17094543'
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
                        key: {
                            name: 'x_1040823_ddg_now/vendor-@excalidraw-excalidraw--a4a37b31'
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
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U'
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
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '379433c481dd4c45a6aa640c5e27f4f6'
                        key: {
                            name: 'x_1040823_ddg_now/pl-PL-T2D74RX3'
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
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '39347773cf4c4ee184df9233c8eeb8f8'
                        key: {
                            name: 'x_1040823_ddg_now/cynefin-OW5HDTMX'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '39c594ab9cf94a6fbbb6ae0717f4eda5'
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
                        key: {
                            name: 'x_1040823_ddg_now/vendor-mermaid--fa178057'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3a76cace296943f4a5f653275626b2c5'
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
                        table: 'sys_documentation'
                        id: '3de1ac740a244badbb38a3bfa73c22ac'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_field_type'
                            language: 'en'
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
                        id: '3f675295c4d34d5d8b97f7e18bac15cb'
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '3fb4c4116cda482c80d55f513f69cdb7'
                        key: {
                            name: 'x_1040823_ddg_now/sankeyDiagram-P5KCCOFB'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '40b5cdd0bbcc418dba193d4075f49478'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG'
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
                        table: 'sys_dictionary'
                        id: '41cc4ed39ed14b819323f83cc688dcb7'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'seed'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4273af7faaab41a5b860ef17de2a3df6'
                        key: {
                            name: 'x_1040823_ddg_now/railroadDiagram-O6MQD6OU'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4285003592244e37a81ca67ac9fae2b3'
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
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '436844af73954b7ca69491c4815d59e7'
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
                        table: 'sys_dictionary'
                        id: '43b9107954bd41d7bb827b888be99d94'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'name'
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
                        key: {
                            name: 'x_1040823_ddg_now/hu-HU-A5ZG7DT2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '46dc71ed97eb406596669076fa86284a'
                        key: {
                            name: 'x_1040823_ddg_now/sv-SE-XGPEYMSR.js.map'
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
                        table: 'sys_dictionary'
                        id: '47b72576f5b846959fb942c8fcac0231'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'field_name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4818c63ad77244c7a27cbda6ab3f7a7c'
                        key: {
                            name: 'x_1040823_ddg_now/uk-UA-QMV73CPH.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '49885e8212df41d2a793f81ccbce8086'
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4b47ddfcf7694421af23c6be8430b5c2'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4c8beecb669b4f529d0ad9a9b69eeed0'
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4e018227762b4a8c914209ba57c9d989'
                        key: {
                            name: 'x_1040823_ddg_now/de-DE-XR44H4JA.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4e22cd793ba24ca78cbe3ed85f12abfe'
                        key: {
                            name: 'x_1040823_ddg_now/id-ID-SAP4L64H'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4ed16f67c961439f83f37c2e9657b045'
                        key: {
                            name: 'x_1040823_ddg_now/zh-HK-E62DVLB3'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '4ef07340a8ec4742b62c7ae41b4e5719'
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/diagram-VX7I27RA'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '50f94efd475c4b80a4ada7215ba3c63e'
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5100ad0d1bef4e03a7ab3b774c2a8cf8'
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
                        table: 'sys_ux_lib_asset'
                        id: '51dc0375cc3d41148c7c8035c2d881bd'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-IMKFNOWR'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '520596bd88d248cf8629ca43414aa39b'
                        key: {
                            name: 'x_1040823_ddg_now/erDiagram-RLTQ6QDP.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '52d353df9e614911a0dc9423f4d9c5f7'
                        key: {
                            name: 'x_1040823_ddg_now/kaa-6HZHGXH3'
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
                        table: 'sys_dictionary'
                        id: '550d463743b24beca3193c01fba06195'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'from_field'
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
                        id: '568ad144ef6f40ba9ba9a557e1c03e08'
                        key: {
                            name: 'x_1040823_ddg_now/percentages-BXMCSKIN.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '56cb301287c24d90b6e543ea51870420'
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '574b5094a5014fd49bc02d8dd5d18fc6'
                        key: {
                            name: 'x_1040823_ddg_now/oc-FR-POXYY2M6'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '578076fcc62247ada527b751ad8443fc'
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
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--fefe7901'
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
                        key: {
                            name: 'x_1040823_ddg_now/tr-TR-DEFEU3FU.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5960ebb7678a4837b3aaae268251eac5'
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE'
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
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '59fd80364e9840b491f4414265438366'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-SVP7TREG.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5a18a78025774989b7653ec8e3b9bc9d'
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A.js.map'
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
                        id: '5c5fce5c82714dd9a286823680f93836'
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5c740631302f4ed2bf694365525a92e8'
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/bg-BG-XCXSNQG7.js.map'
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
                        id: '5effffe5dd0344718c39db478688a05a'
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '5fb1f30033f94d70b14720211763fb68'
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2'
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
                        id: '628c96a78750436ba4f8199a984d93dc'
                        key: {
                            name: 'x_1040823_ddg_now/ishikawaDiagram-5VMMS53U.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '63bed447b37c41f5a1564be637f235bf'
                        key: {
                            name: 'x_1040823_ddg_now/gitGraphDiagram-WWUBYQGX'
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
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '67a62df83b304afdb58e7caa437a1ddc'
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
                        table: 'sys_dictionary'
                        id: '6a1333cab705416893f268ddbf198db4'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6ad10b87db964276a06244373fdd6cfc'
                        key: {
                            name: 'x_1040823_ddg_now/da-DK-5WZEPLOC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6b5d5ff2cfb2409480c5fa6cc1aa1d72'
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
                        id: '6cee86db21d24381966afdfbc69bc532'
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6dadc3aa3a14452196f3cb277c3c8583'
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '6f14590b850549828c929ddd795368a2'
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY'
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
                        id: '7349e74da7514c6f9277d811edb66035'
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
                        id: '742c98580eff4431a43d05a0684b5e57'
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
                        table: 'sys_ux_lib_asset'
                        id: '74b8b4bbc5c641ccadbb76c037f1e8d0'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-002ab408'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '751d533acc4d4433ae17e53ec644dd78'
                        key: {
                            name: 'x_1040823_ddg_now/stateDiagram-D77RDMKH'
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
                        id: '78f42070638b49258fdfe9b408323174'
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
                        id: '7bd48ef1d2314da9acc6890afd44696b'
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
                        id: '7c58f444c3c94be1bc11b1f1b8efd36e'
                        key: {
                            name: 'x_1040823_ddg_now/main.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '805fe69f04f7411ba065fdcbdcc565f6'
                        key: {
                            name: 'x_1040823_ddg_now/ebnfDiagram-PWID7BFC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '80ba59a7f41749e096c8385db4cdaacd'
                        key: {
                            name: 'x_1040823_ddg_now/az-AZ-76LH7QW2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '81e288721f30438eb98019efb1ffb234'
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
                        id: '837fce76444b4b32b94d32a3fdf55d54'
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8418240bc33f42bca85230ec0f0b6b80'
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
                        key: {
                            name: 'x_1040823_ddg_now/pt-BR-5N22H2LF.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '88b01adf02d64c37bc349bd6ab8580bd'
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-4ed118d0.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '89056ef2c7d5407ab6910ac0d80ad880'
                        key: {
                            name: 'x_1040823_ddg_now/lt-LT-XHIRWOB4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '894663b0a4d04241832757dda01e05a9'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-TICWLB2K.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8a9da269870e484caac4262c7c6030e4'
                        key: {
                            name: 'x_1040823_ddg_now/quadrantDiagram-AXDQQJYC'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '8aef458c7e5645778384eaecd2c9a7fd'
                        key: {
                            name: 'x_1040823_ddg_now/el-GR-BZB4AONW.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/abnfDiagram-VCTEODGH.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: '90afb928ee2a453aa3727c70cadfeab1'
                        key: {
                            application_file: '36d2e20716754f839ac49c599d7de0db'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '90c70341801d4913bac9afba5895de08'
                        key: {
                            name: 'x_1040823_ddg_now/pegDiagram-XKGWAZYB'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '90ea3c3efcf1450a9f72f9616e657ccf'
                        key: {
                            name: 'x_1040823_ddg_now/layout'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '921b2538f4d84aa0901ecd9025d020cb'
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
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '93a456abd1cb498ebc24874f9f92a837'
                        key: {
                            name: 'x_1040823_ddg_now/kab-KAB-ZGHBKWFO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '94c0efc417b6471e87959d22e68fdee4'
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '94fbb4395df34f8dbe86bca233b9e7fd'
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '968547ca2f3b402c88a305e39ad8b71a'
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '97a377e9d01a4b22b819a71ed046157f'
                        key: {
                            name: 'x_1040823_ddg_now/ku-TR-6OUDTVRD.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '97dafe96c39a45df818f52a88bb6ff87'
                        key: {
                            name: 'x_1040823_ddg_now/pt-PT-UZXXM6DQ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '98ef7f2c8d404eecb03e3ebf08c019ce'
                        key: {
                            name: 'x_1040823_ddg_now/ar-SA-G6X2FPQ2.js.map'
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
                        id: '99f829ef9f244b83af74c65b3e24cb3f'
                        key: {
                            name: 'x_1040823_ddg_now/pa-IN-N4M65BXN'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9a5041c7f3a24070b09a0f59b45a2107'
                        key: {
                            name: 'x_1040823_ddg_now/kanban-definition-UXKFOSKX.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9ab0dd924c5644f0b7b65a95f26f9883'
                        key: {
                            name: 'x_1040823_ddg_now/WhiteboardCanvas.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c416edc8b56450484bb51791ab5e6f8'
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9c911c4de2bb4c5ca405c6fe1c724ac8'
                        key: {
                            name: 'x_1040823_ddg_now/mindmap-definition-YA3MSWOX.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9cc61b88694847318242539ccd3633ca'
                        key: {
                            name: 'x_1040823_ddg_now/dagre-GXQ25YYZ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '9e948ee072ca418a9ade06ad9d5ce82b'
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
                        id: 'a050617a03934b668221747090ef5085'
                        key: {
                            name: 'x_1040823_ddg_now/file-save-3189631c.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/kk-KZ-P5N5QNE5.js.map'
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
                        id: 'a51e75e4b1b24fe2aabf4a416ff26da4'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-5VM5RSS4'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'a5c4f2b450e946bc9df84311611545a9'
                        key: {
                            name: 'x_1040823_ddg_now/cose-bilkent-JH36ORCC'
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
                        key: {
                            name: 'x_1040823_ddg_now/timeline-definition-24CTP7MA'
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
                        table: 'sys_db_object'
                        id: 'aad7bc55dbdd4c81859eb9dbd819f40a'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'aaedc667ea1843c3a638c075c7ce7be9'
                        key: {
                            name: 'x_1040823_ddg_now/zh-TW-RAJ6MFWO'
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
                        key: {
                            application_file: '0e7e2dbb9e4a478bbe134b571786d436'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
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
                        id: 'adeb5f284e1c4244af5d09ff2543c393'
                        key: {
                            name: 'x_1040823_ddg_now/my-MM-5M5IBNSE.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/diagram-S7CK7UJ4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'af2c80e2602645f3ba76def07bb17fd2'
                        key: {
                            name: 'x_1040823_ddg_now/sizeCapture-INFHLROL.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'afd14c17a37849cea711865f9cb1afac'
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM'
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
                        id: 'b1900c30e4ba4814ac9b518abbcc912a'
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b242bdbf79af4ad183f0be5d56ccb1b7'
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b3add6de87974db8882bbb3c0b10d155'
                        key: {
                            name: 'x_1040823_ddg_now/diagram-Z3DM3KII'
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
                        key: {
                            name: 'x_1040823_ddg_now/roundRect.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b5ee3807cf754b5aa50c6cb4a4ca4b36'
                        key: {
                            name: 'x_1040823_ddg_now/subset-worker.chunk'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b62046cd642b4e32bfe2730f7978469f'
                        key: {
                            name: 'x_1040823_ddg_now/fa-IR-HGAKTJCU'
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
                        table: 'sys_ux_lib_asset'
                        id: 'b694fd5dd7434ecd976f310a08d714fe'
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT'
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
                        id: 'b741b23304a74c88a20cfff0e13fe82c'
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
                        key: {
                            name: 'x_1040823_ddg_now/directory-open-01563666.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b80bc204e7e74dbdaf331f7fe55309c7'
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'b83638c2d793444b90a124d70d1412c7'
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
                        table: 'sys_dictionary'
                        id: 'b909c8c45b6449488af0846531f26ce1'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'NULL'
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
                        table: 'ua_table_licensing_config'
                        id: 'b9d484ec0fa24684871cba0adf61cd20'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'b9f31a1b68824ec5b7c6d64a7cd859d2'
                        key: {
                            name: 'x_1040823_ddg_now/th-TH-HPSO5L25'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bb074cf36a664beda8ea6e9598b9c95f'
                        key: {
                            name: 'x_1040823_ddg_now/vi-VN-M7AON7JQ'
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
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bc66207828234af094110aaffecf6366'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-POPQ4Y6H'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'bd1240c2ab2c40f1ad5acf6fc61573cf'
                        key: {
                            name: 'x_1040823_ddg_now/es-ES-U4NZUMDT'
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
                        id: 'bfeec9b2a54e45889edf70b784ef726f'
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c061d2a3dc4d4adb944ef6a8e9bf5d23'
                        key: {
                            name: 'x_1040823_ddg_now/bn-BD-2XOGV67Q.js.map'
                        }
                    },
                    {
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'c0b8d9d569e8452aba6722cd14d71537'
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
                        key: {
                            name: 'x_1040823_ddg_now/hi-IN-IWLTKZ5I'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c0e4d590e50f4880a1c53e29b447b8a2'
                        key: {
                            name: 'x_1040823_ddg_now/pieDiagram-E7YTZNPT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c0f9c9b78da9454e8b011084fb05f572'
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
                        id: 'c19b7640b86f4b48a0c0ee6890eebe34'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-cytoscape--269d8a18.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'c1d58c35559643549b827ad74fd6a292'
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
                        key: {
                            name: 'x_1040823_ddg_now/vennDiagram-4TSXK5OY.js.map'
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
                        id: 'c64d908a251d430c98073b5ebf6b14e9'
                        key: {
                            name: 'x_1040823_ddg_now/layout.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/c4Diagram-7LVT6UL2.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'caa3ffa097674f14a8305af74546edb9'
                        key: {
                            name: 'x_1040823_ddg_now/sl-SI-NN7IZMDC.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cacad19fbb654938939b3097c40d414e'
                        key: {
                            name: 'x_1040823_ddg_now/file-save-3189631c'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cbd7855f033f458c86095536014c1c1b'
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
                        key: {
                            name: 'x_1040823_ddg_now/cs-CZ-2BRQDIVT.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cd972b1e0aba4fb6a1569a84fef560ff'
                        key: {
                            name: 'x_1040823_ddg_now/ru-RU-B4JR7IUQ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ce27e629a5d94aab8c9482edd3e26828'
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
                        id: 'cec9a133aa2d461f9831389621b33546'
                        key: {
                            name: 'x_1040823_ddg_now/it-IT-JPQ66NNP.js.map'
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
                        id: 'd0d6b7495a244c618dd5c45e183ee17f'
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd14dfbfcf2544dc49629635b9c52674b'
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
                        table: 'sys_dictionary'
                        id: 'd3cfbf7737aa49b6b7a90379398c65f9'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd449e5eafea442a58d50b90e82d3b508'
                        key: {
                            name: 'x_1040823_ddg_now/blockDiagram-I7D4REHJ'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd45336bf9b8f41948fa7d755aaa5a75e'
                        key: {
                            name: 'x_1040823_ddg_now/gl-ES-HMX3MZ6V.js.map'
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
                        id: 'd5fc86b65f724583957d799b616f2297'
                        key: {
                            name: 'x_1040823_ddg_now/file-open-7c801643.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd622841c511d44d2aa3cb1d4917b78ce'
                        key: {
                            name: 'x_1040823_ddg_now/infoDiagram-27XIBGKW.js.map'
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
                        id: 'd7b1a3e9e77d4c538964b59a517bc7f9'
                        key: {
                            name: 'x_1040823_ddg_now/nl-NL-IS3SIHDZ.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'd8586e24f8e140c6ae0f5a3bb7d3b484'
                        key: {
                            name: 'x_1040823_ddg_now/requirementDiagram-BXWQKSXE.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/ca-ES-6MX7JW3Y.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'da4ae0a7241a4946bdfa7b3cdc8c293e'
                        key: {
                            name: 'x_1040823_ddg_now/eu-ES-A7QVB2H4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'da6099316eae4b1d8268b76e628d6f74'
                        key: {
                            name: 'x_1040823_ddg_now/chunk-JWPE2WC7'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'da7c7fa1e91740788e427987a43227eb'
                        key: {
                            name: 'x_1040823_ddg_now/journeyDiagram-3NMN7TZE'
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
                        id: 'dd09e1f7f7444d6da78db34c1bc3f254'
                        key: {
                            name: 'x_1040823_ddg_now/sk-SK-C5VTKIMK.js.map'
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
                        id: 'dfb18f2794f9426b9a0c44b62251b6da'
                        key: {
                            name: 'x_1040823_ddg_now/zh-CN-LNUGB5OW.js.map'
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
                        id: 'e32613efbbf640949f19bdc6c6380c1f'
                        key: {
                            name: 'x_1040823_ddg_now/wardleyDiagram-VM6X3IG4.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e350c3429d1a4324b1fa0ee4857e6359'
                        key: {
                            name: 'x_1040823_ddg_now/nb-NO-T6EIAALU.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e3863d9abc55491892de7331e8639d59'
                        key: {
                            name: 'x_1040823_ddg_now/image-blob-reduce.esm'
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
                        key: {
                            name: 'x_1040823_ddg_now/cynefinDiagram-5FMLGOSQ'
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
                        table: 'sys_ws_query_parameter_map'
                        id: 'e73d6d33a39e46d680f10bbecfa81194'
                        key: {
                            web_service_operation: 'a91945975485421dad7667f644db7cae'
                            web_service_query_parameter: '5a83d2b97f6e4f32aa3cf76b54df7eb8'
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
                        key: {
                            name: 'x_1040823_ddg_now/file-save-745eba88.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ea1f24b127b64199b6c28bb8278a21b6'
                        key: {
                            name: 'x_1040823_ddg_now/ja-JP-DBVTYXUO'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ea2a2a4810ac4a65b8df702a5c3d3edd'
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
                        key: {
                            name: 'x_1040823_ddg_now/si-LK-N5RQ5JYF'
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
                        key: {
                            name: 'x_1040823_ddg_now/ko-KR-MTYHY66A'
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
                        table: 'sys_dictionary'
                        id: 'ef2b61af406f41c1a65b00befd151f80'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f02983ff3bc84d8c99bc3844bd839657'
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
                        table: 'sys_dictionary'
                        id: 'f0cea195ebb347688c79d642451780bc'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'row_count'
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
                        key: {
                            application_file: '1c11166678c847a8aef89222aeba14ac'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
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
                        table: 'sys_db_object'
                        id: 'f3d9b16bbd6148a492730bab16dd07d4'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f3dcd57fd9e34581a9f4b6b4c749cab5'
                        key: {
                            name: 'x_1040823_ddg_now/index'
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
                        key: {
                            name: 'x_1040823_ddg_now/ro-RO-JPDTUUEW'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f5fba1e17a5c4c6eb4e848b8ee3b2a5e'
                        key: {
                            name: 'x_1040823_ddg_now/swimlanesDiagram-VR7AAH4N'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f614c2a066e444cbba1845ccf7106a68'
                        key: {
                            name: 'x_1040823_ddg_now/ta-IN-2NMHFXQM.js.map'
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
                        id: 'f7662fe666a74e25a125f38db11b07cc'
                        key: {
                            name: 'x_1040823_ddg_now/image-blob-reduce.esm.js.map'
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
                        key: {
                            name: 'x_1040823_ddg_now/ganttDiagram-EL5Y4UJY.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'f7a6102293394ff09d0e97109677cc37'
                        key: {
                            name: 'x_1040823_ddg_now/he-IL-6SHJWFNN'
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
                        key: {
                            name: 'x_1040823_ddg_now/fr-FR-RHASNOE6.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fb36e8150d294c8ba65aa9fbe30414c8'
                        key: {
                            name: 'x_1040823_ddg_now/architectureDiagram-5GKGNRK7.js.map'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'fd92536cfc8f4511953a86569ec288d3'
                        key: {
                            name: 'x_1040823_ddg_now/mr-IN-CRQNXWMA.js.map'
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
                        table: 'sys_dictionary'
                        id: 'ff63637a83a84e5380f7433060fa638a'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ffdaa7f3f2cd411a8b2bf96b7a0abb17'
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
