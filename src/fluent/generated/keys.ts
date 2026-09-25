import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
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
                        id: '0c55ce94acf949b19a1bb939f252aa24'
                        key: {
                            name: 'x_1040823_ddg_now/main'
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
                        table: 'sys_dictionary'
                        id: '171eb44e450541e08502acea99f88172'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'sidebar_collapsed'
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
                        table: 'ua_table_licensing_config'
                        id: '23611262e8b24f21b61939927a0fa758'
                        key: {
                            name: 'x_1040823_ddg_now_config'
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
                        id: '2aa557999e564fbbb8922d04ead09a42'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/ConfigDetail.js.map'
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
                        id: '2e58de66e3984785b75ccb5df457396f'
                        deleted: true
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--df8484ac.js.map'
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
                        table: 'sys_dictionary'
                        id: '33c01599655e41b9afdc651b7cc74c24'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'user'
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
                        table: 'sys_choice_set'
                        id: '36b2b527aa0a4a6682516a226d2ec12e'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'mode'
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
                        table: 'sys_documentation'
                        id: '37e3d526a0f3499bbf586043b1209cb4'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'name'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: '57850660ab5b4baf8db688b5bf7c51d4'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
                            element: 'config'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: '5cd511f5512749b38a081ac1598450cc'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'metadata'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: '5f3b44b8b22549be9d82a6a6f877dacc'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'user'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: '6c31fd7b92a341fa92fc9f1957f27332'
                        key: {
                            name: 'x_1040823_ddg_now_mapping'
                            element: 'field_name'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: '7265013260e349d495f5c49f81113384'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'options'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: '7784c9a6a2fd4f5792ec2bae9df60045'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'description'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: '82c584b856944d58ac8d3442a9f9750b'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'theme'
                            language: 'en'
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
                        table: 'sn_glider_source_artifact_m2m'
                        id: '886201b116c144778e423917a5bd3705'
                        key: {
                            application_file: '0c55ce94acf949b19a1bb939f252aa24'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
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
                        table: 'sn_glider_source_artifact_m2m'
                        id: '99a97464e6174ee785ac8e7d55ad16f2'
                        deleted: true
                        key: {
                            application_file: 'bfaa799b1b6444878b2734c57d44d9c5'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
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
                        table: 'sys_documentation'
                        id: '9f1a2d73b3e442fc9dfe836821c81730'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'preview_row_limit'
                            language: 'en'
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
                        table: 'sys_index'
                        id: 'a4305cf60a0f45069012150e774f1dcb'
                        key: {
                            logical_table_name: 'x_1040823_ddg_now_template'
                            col_name_string: 'name'
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
                        table: 'sys_db_object'
                        id: 'aad7bc55dbdd4c81859eb9dbd819f40a'
                        key: {
                            name: 'x_1040823_ddg_now_dataset'
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
                        id: 'b41ec80974a34525aae28f023d2b0817'
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
                        table: 'ua_table_licensing_config'
                        id: 'b66e5abc8d7543da84cb8ad6cf4e115f'
                        key: {
                            name: 'x_1040823_ddg_now_template'
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
                        table: 'sys_dictionary'
                        id: 'bbc227b060ec4fb19dfd7680e9635ecc'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'default_export_format'
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
                        table: 'sys_ws_query_parameter_map'
                        id: 'c889f354bd39403ab91f51c53b23ad30'
                        key: {
                            web_service_operation: '2eb7f0e396014ea7b559557e564c34ca'
                            web_service_query_parameter: '9eb1cbe3456d48b48a2a2302e6340136'
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
                        table: 'sys_documentation'
                        id: 'd0988c649a5d4a5abbb8ff1ff6e53426'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'NULL'
                            language: 'en'
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
                        table: 'sys_documentation'
                        id: 'd50867524183474bbf6e39000519688d'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'sidebar_collapsed'
                            language: 'en'
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
                        table: 'sn_glider_source_artifact_m2m'
                        id: 'd9487a872bd748358cac072f70d87440'
                        deleted: true
                        key: {
                            application_file: 'eba82aab22214b088d2075ddd36403b4'
                            source_artifact: '650b7396177945b9893176e707cb3df5'
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
                        table: 'sys_documentation'
                        id: 'eaaa74a2b95a4eac9dd498ab2b59065f'
                        key: {
                            name: 'x_1040823_ddg_now_config'
                            element: 'name'
                            language: 'en'
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
                        id: 'f3160ec32c8445a88e99d94312566f76'
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
                        table: 'sys_dictionary'
                        id: 'f4456850596e4e72bc46de85bb749a8d'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'order'
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
                        table: 'sys_documentation'
                        id: 'f78c63289c6a43c6a6b7616c956ebd94'
                        key: {
                            name: 'x_1040823_ddg_now_field'
                            element: 'config'
                            language: 'en'
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
                        id: 'fddd2d1243cb4de3b74ab66c71d586be'
                        key: {
                            name: 'x_1040823_ddg_now/vendor-lucide-react--b66a787f'
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
                        table: 'sys_dictionary'
                        id: 'ff63637a83a84e5380f7433060fa638a'
                        key: {
                            name: 'x_1040823_ddg_now_user_pref'
                            element: 'NULL'
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
