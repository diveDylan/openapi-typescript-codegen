import * as path from 'path';

import type { Client } from '../client/interfaces/Client';
import { HttpClient } from '../index';
import { mkdir, rmdir, exists } from './fileSystem';
import { isSubDirectory } from './isSubdirectory';
import { Templates } from './registerHandlebarTemplates';
import { writeClientCore } from './writeClientCore';
import { writeClientIndex } from './writeClientIndex';
import { writeClientModels } from './writeClientModels';
import { writeClientSchemas } from './writeClientSchemas';
import { writeClientServices } from './writeClientServices';

/**
 * Write our OpenAPI client, using the given templates at the given output path.
 * @param client Client object with all the models, services, etc.
 * @param templates Templates wrapper with all loaded Handlebars templates
 * @param output The relative location of the output directory
 * @param httpClient The selected httpClient (fetch, xhr or node)
 * @param useOptions Use options or arguments functions
 * @param useUnionTypes Use union types instead of enums
 * @param exportCore: Generate core client classes
 * @param exportServices: Generate services
 * @param exportModels: Generate models
 * @param exportSchemas: Generate schemas
 */
export async function writeClient(
    client: Client,
    templates: Templates,
    output: string,
    httpClient: HttpClient,
    useOptions: boolean,
    useUnionTypes: boolean,
    exportCore: boolean,
    exportServices: boolean,
    exportModels: boolean,
    exportSchemas: boolean,
    alias: string
): Promise<void> {
    const outputPath = path.resolve(process.cwd(), output);
    // cancel write core
    const outputPathCore = alias ? '' : path.resolve(outputPath, 'core');
    const outputPathModels = path.resolve(outputPath, 'models');
    const outputPathSchemas = path.resolve(outputPath, 'schemas');
    const outputPathServices = path.resolve(outputPath, 'services');

    if (!isSubDirectory(process.cwd(), output)) {
        throw new Error(`Output folder is not a subdirectory of the current working directory`);
    }

    await rmdir(outputPathModels);
    await rmdir(outputPathSchemas);
    await rmdir(outputPathServices);
    await mkdir(outputPath);
    const coreExists = await exists(outputPathCore)
    console.log('outputPathCore', outputPathCore,coreExists )
    if (exportCore && outputPathCore && !coreExists) {
        await mkdir(outputPathCore);
        await writeClientCore(client, templates, outputPathCore, httpClient);
    }

    if (exportServices) {
        await mkdir(outputPathServices);
        await writeClientServices(client.services, templates, outputPathServices, httpClient, useUnionTypes, useOptions, alias);
    }

    if (exportSchemas) {
        await mkdir(outputPathSchemas);
        await writeClientSchemas(client.models, templates, outputPathSchemas, httpClient, useUnionTypes);
    }

    if (exportModels) {
        await mkdir(outputPathModels);
        await writeClientModels(client.models, templates, outputPathModels, httpClient, useUnionTypes);
    }

    await writeClientIndex(client, templates, outputPath, useUnionTypes, exportCore, exportServices, exportModels, exportSchemas, alias);
}
