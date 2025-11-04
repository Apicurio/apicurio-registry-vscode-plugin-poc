import { buildNavigationTree, TreeNode } from '../treeBuilder';
import { Library } from '@apicurio/data-models';

describe('treeBuilder', () => {
    describe('buildNavigationTree', () => {
        describe('OpenAPI 3.0', () => {
            it('should build tree with Info node', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: {
                        title: 'Test API',
                        version: '1.0.0'
                    },
                    paths: {}
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                expect(tree).toContainEqual(
                    expect.objectContaining({
                        id: 'info',
                        label: 'Info',
                        type: 'info'
                    })
                );
            });

            it('should build tree with Servers node and children', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: { title: 'Test', version: '1.0' },
                    servers: [
                        { url: 'https://api.example.com', description: 'Production' },
                        { url: 'https://dev.api.example.com', description: 'Development' }
                    ],
                    paths: {}
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const serversNode = tree.find(n => n.id === 'servers');
                expect(serversNode).toBeDefined();
                expect(serversNode?.children).toHaveLength(2);
                expect(serversNode?.children?.[0]).toMatchObject({
                    id: 'server-0',
                    label: 'Production',
                    type: 'server'
                });
                expect(serversNode?.children?.[1]).toMatchObject({
                    id: 'server-1',
                    label: 'Development',
                    type: 'server'
                });
            });

            it('should build tree with Paths and Operations', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {
                        '/users': {
                            get: {
                                operationId: 'getUsers',
                                summary: 'Get all users'
                            },
                            post: {
                                operationId: 'createUser',
                                summary: 'Create a user'
                            }
                        },
                        '/users/{id}': {
                            get: {
                                operationId: 'getUser',
                                summary: 'Get a user'
                            },
                            delete: {
                                operationId: 'deleteUser'
                            }
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const pathsNode = tree.find(n => n.id === 'paths');
                expect(pathsNode).toBeDefined();
                expect(pathsNode?.children).toHaveLength(2);

                // Check /users path
                const usersPath = pathsNode?.children?.find(n => n.id === 'path-/users');
                expect(usersPath).toMatchObject({
                    label: '/users',
                    type: 'path',
                    path: '/users'
                });
                expect(usersPath?.children).toHaveLength(2);
                expect(usersPath?.children?.[0]).toMatchObject({
                    id: 'path-/users-get',
                    label: 'GET: getUsers',
                    type: 'operation',
                    path: '/users'
                });

                // Check /users/{id} path
                const userIdPath = pathsNode?.children?.find(n => n.id === 'path-/users/{id}');
                expect(userIdPath?.children).toHaveLength(2);
            });

            it('should build tree with Components > Schemas', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {},
                    components: {
                        schemas: {
                            User: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    name: { type: 'string' }
                                }
                            },
                            Error: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' }
                                }
                            }
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const componentsNode = tree.find(n => n.id === 'components');
                expect(componentsNode).toBeDefined();

                const schemasNode = componentsNode?.children?.find(n => n.id === 'schemas');
                expect(schemasNode).toBeDefined();
                expect(schemasNode?.children).toHaveLength(2);
                expect(schemasNode?.children?.[0]).toMatchObject({
                    id: 'schema-User',
                    label: 'User',
                    type: 'schema',
                    path: 'User'
                });
            });

            it('should build tree with Security', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {},
                    components: {
                        securitySchemes: {
                            'api_key': {
                                type: 'apiKey',
                                name: 'api_key',
                                in: 'header'
                            },
                            'oauth2': {
                                type: 'oauth2',
                                flows: {}
                            }
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const securityNode = tree.find(n => n.id === 'security');
                expect(securityNode).toBeDefined();
                expect(securityNode?.children).toHaveLength(2);
                expect(securityNode?.children?.[0]).toMatchObject({
                    id: 'security-api_key',
                    label: 'api_key',
                    type: 'securityScheme'
                });
            });

            it('should build tree with Tags', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {},
                    tags: [
                        { name: 'users', description: 'User operations' },
                        { name: 'admin', description: 'Admin operations' }
                    ]
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const tagsNode = tree.find(n => n.id === 'tags');
                expect(tagsNode).toBeDefined();
                expect(tagsNode?.children).toHaveLength(2);
                expect(tagsNode?.children?.[0]).toMatchObject({
                    id: 'tag-users',
                    label: 'users',
                    type: 'tag',
                    path: 'users'
                });
            });
        });

        describe('OpenAPI 2.0 (Swagger)', () => {
            it('should build tree for Swagger spec', () => {
                const spec = {
                    swagger: '2.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {
                        '/users': {
                            get: {
                                operationId: 'getUsers'
                            }
                        }
                    },
                    definitions: {
                        User: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' }
                            }
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                // Should have Info
                expect(tree.find(n => n.id === 'info')).toBeDefined();

                // Should have Paths
                const pathsNode = tree.find(n => n.id === 'paths');
                expect(pathsNode).toBeDefined();

                // Should have Definitions (not Components)
                const definitionsNode = tree.find(n => n.id === 'definitions');
                expect(definitionsNode).toBeDefined();
                expect(definitionsNode?.children).toHaveLength(1);
                expect(definitionsNode?.children?.[0]).toMatchObject({
                    id: 'definition-User',
                    label: 'User',
                    type: 'schema'
                });
            });

            it('should handle securityDefinitions in Swagger', () => {
                const spec = {
                    swagger: '2.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {},
                    securityDefinitions: {
                        'api_key': {
                            type: 'apiKey',
                            name: 'api_key',
                            in: 'header'
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const securityNode = tree.find(n => n.id === 'security');
                expect(securityNode).toBeDefined();
                expect(securityNode?.children?.[0]).toMatchObject({
                    id: 'security-api_key',
                    label: 'api_key',
                    type: 'securityScheme'
                });
            });
        });

        describe('AsyncAPI', () => {
            it('should build tree with Info node', () => {
                const spec = {
                    asyncapi: '2.0.0',
                    info: {
                        title: 'Test AsyncAPI',
                        version: '1.0.0'
                    },
                    channels: {}
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                expect(tree).toContainEqual(
                    expect.objectContaining({
                        id: 'info',
                        label: 'Info',
                        type: 'info'
                    })
                );
            });

            it('should build tree with Servers', () => {
                const spec = {
                    asyncapi: '2.0.0',
                    info: { title: 'Test', version: '1.0' },
                    servers: {
                        production: {
                            url: 'kafka://prod.example.com',
                            protocol: 'kafka',
                            description: 'Production Kafka'
                        },
                        development: {
                            url: 'kafka://dev.example.com',
                            protocol: 'kafka',
                            description: 'Development Kafka'
                        }
                    },
                    channels: {}
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const serversNode = tree.find(n => n.id === 'servers');
                expect(serversNode).toBeDefined();
                expect(serversNode?.children).toHaveLength(2);
                expect(serversNode?.children?.[0]).toMatchObject({
                    id: 'server-production',
                    label: 'Production Kafka',
                    type: 'server'
                });
            });

            it('should build tree with Channels and Operations', () => {
                const spec = {
                    asyncapi: '2.0.0',
                    info: { title: 'Test', version: '1.0' },
                    channels: {
                        'user/signedup': {
                            description: 'User signed up channel',
                            subscribe: {
                                message: {
                                    name: 'UserSignedUp'
                                }
                            },
                            publish: {
                                message: {
                                    name: 'UserSignedUpAck'
                                }
                            }
                        },
                        'user/deleted': {
                            subscribe: {
                                message: {
                                    name: 'UserDeleted'
                                }
                            }
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const channelsNode = tree.find(n => n.id === 'channels');
                expect(channelsNode).toBeDefined();
                expect(channelsNode?.children).toHaveLength(2);

                const signedupChannel = channelsNode?.children?.find(n => n.id === 'channel-user/signedup');
                expect(signedupChannel).toMatchObject({
                    label: 'user/signedup',
                    type: 'channel',
                    path: 'user/signedup'
                });
                expect(signedupChannel?.children).toHaveLength(2); // publish + subscribe

                const deletedChannel = channelsNode?.children?.find(n => n.id === 'channel-user/deleted');
                expect(deletedChannel?.children).toHaveLength(1); // only subscribe
            });

            it('should build tree with Components > Messages and Schemas', () => {
                const spec = {
                    asyncapi: '2.0.0',
                    info: { title: 'Test', version: '1.0' },
                    channels: {},
                    components: {
                        messages: {
                            UserSignedUp: {
                                payload: {
                                    type: 'object'
                                }
                            },
                            UserDeleted: {
                                payload: {
                                    type: 'object'
                                }
                            }
                        },
                        schemas: {
                            User: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' }
                                }
                            }
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const componentsNode = tree.find(n => n.id === 'components');
                expect(componentsNode).toBeDefined();

                const messagesNode = componentsNode?.children?.find(n => n.id === 'messages');
                expect(messagesNode).toBeDefined();
                expect(messagesNode?.children).toHaveLength(2);
                expect(messagesNode?.children?.[0]).toMatchObject({
                    id: 'message-UserSignedUp',
                    label: 'UserSignedUp',
                    type: 'message'
                });

                const schemasNode = componentsNode?.children?.find(n => n.id === 'schemas');
                expect(schemasNode).toBeDefined();
                expect(schemasNode?.children).toHaveLength(1);
            });
        });

        describe('Edge cases', () => {
            it('should throw error for unknown document type', () => {
                const spec = {
                    someOtherField: 'value'
                };

                // @apicurio/data-models throws error for unknown/unsupported types
                expect(() => {
                    Library.readDocument(spec);
                }).toThrow();
            });

            it('should handle empty paths object', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {}
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                const pathsNode = tree.find(n => n.id === 'paths');
                expect(pathsNode).toBeUndefined(); // No paths node if empty
            });

            it('should handle missing optional sections', () => {
                const spec = {
                    openapi: '3.0.0',
                    info: { title: 'Test', version: '1.0' },
                    paths: {
                        '/test': {
                            get: {}
                        }
                    }
                };

                const document = Library.readDocument(spec);
                const tree = buildNavigationTree(document);

                // Should only have Info and Paths
                expect(tree).toHaveLength(2);
                expect(tree.find(n => n.id === 'servers')).toBeUndefined();
                expect(tree.find(n => n.id === 'components')).toBeUndefined();
                expect(tree.find(n => n.id === 'security')).toBeUndefined();
                expect(tree.find(n => n.id === 'tags')).toBeUndefined();
            });
        });
    });
});
