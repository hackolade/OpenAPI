const modelConfig = {
    modelName: 'modelName',
    openapi: 'dbVersion',
    termsOfService: 'termsOfService',
    info: 'info',
    servers: 'servers',
    security: 'security',
    tags: [{
        name: 'tagName',
        description: 'tagDescription',
        externalDocs: {
            description: 'tagExternalDocsDescription',
            url: 'tagExternalDocsUrl'
        }
    }],
    externalDocs: {
        description: 'externalDocsDescription',
        url: 'externalDocsUrl'
    },
    scopesExtensions: 'scopesExtensions'
};

const entityConfig = {
    request: {
        tags: ['tag'],
        summary: 'summary',
        description: 'description',
        externalDocs: [{
            description: 'externalDocsDescription',
            url: 'externalDocsUrl'
        }],
        operationId: 'operationId',
        deprecated: 'deprecated',
        security: 'security',
        servers: 'servers'
    },
    response: {
        description: 'description'
    }
};

module.exports = {
    modelConfig,
    entityConfig
};