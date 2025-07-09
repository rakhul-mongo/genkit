/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Genkit } from 'genkit';
import { MongoClient } from 'mongodb';
import { retryWithDelay } from '../common/retry';
import { InputSearchIndexCreateSchema, InputSearchIndexDropSchema, InputSearchIndexListSchema, OutputSearchIndexCreateSchema, OutputSearchIndexDropSchema, OutputSearchIndexListSchema, SearchIndexToolsDefinition } from '../common/types';
import { SEARCH_INDEX_TOOL_ID, toolRef } from '../common/constants';
import { getCollection } from '../common/connection';

function configureCreateSearchIndexTool(ai: Genkit, client: MongoClient, options: SearchIndexToolsDefinition) {
  ai.defineTool(
    {
      name: toolRef(options.id, SEARCH_INDEX_TOOL_ID.create),
      description: `Create a text search index on MongoDB`,
      inputSchema: InputSearchIndexCreateSchema,
      outputSchema: OutputSearchIndexCreateSchema,
    },
    async (input) => {

      const collection = getCollection(client, input.dbName, input.collectionName, input.dbOptions, input.collectionOptions);

      try {
        const result = await retryWithDelay(
          async () => {
            return await collection.createSearchIndex(input.schema);
          },
          options.retry?.attempts,
          options.retry?.delay,
          options.retry?.jitter,
        );

        return {
          indexName: result,
          success: true,
          message: `Search index creation operation started successfully: ${result}`,
        };
      } catch (error) {
        return {
          indexName: '',
          success: false,
          message: `Failed to create search index: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

function configureListSearchIndexesTool(ai: Genkit, client: MongoClient, options: SearchIndexToolsDefinition) {
  ai.defineTool(
    {
      name: toolRef(options.id, SEARCH_INDEX_TOOL_ID.list),
      description: `List all indexes on MongoDB`,
      inputSchema: InputSearchIndexListSchema,
      outputSchema: OutputSearchIndexListSchema,
    },
    async (input) => {

      const collection = getCollection(client, input.dbName, input.collectionName, input.dbOptions, input.collectionOptions);

      try {
        const indexes = await retryWithDelay(
          async () => {
            return await collection.listSearchIndexes().toArray();
          },
          options.retry?.attempts,
          options.retry?.delay,
          options.retry?.jitter,
        );

        return {
          indexes,
          success: true,
          message: `Found ${indexes.length} indexes on collection ${collection.collectionName}`,
        };
      } catch (error) {
        return {
          indexes: [],
          success: false,
          message: `Failed to list indexes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

function configureDropSearchIndexTool(ai: Genkit, client: MongoClient, options: SearchIndexToolsDefinition) {
  ai.defineTool(
    {
      name: toolRef(options.id, SEARCH_INDEX_TOOL_ID.drop),
      description: `Drop an index by name from MongoDB`,
      inputSchema: InputSearchIndexDropSchema,
      outputSchema: OutputSearchIndexDropSchema,
    },
    async (input) => {

      const collection = getCollection(client, input.dbName, input.collectionName, input.dbOptions, input.collectionOptions);

      try {
        await retryWithDelay(
          async () => {
            return await collection.dropSearchIndex(input.indexName);
          },
          options.retry?.attempts,
          options.retry?.delay,
          options.retry?.jitter,
        );

        return {
          success: true,
          message: `Index ${input.indexName} drop operation started successfully`,
        };
      } catch (error) {
        return {
          success: false,
          message: `Failed to drop index: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

export function defineSearchIndexTools(ai: Genkit, client: MongoClient, definition?: SearchIndexToolsDefinition) {

  if (!definition?.id) {
    return;
  }
  configureCreateSearchIndexTool(ai, client, definition);
  configureListSearchIndexesTool(ai, client, definition);
  configureDropSearchIndexTool(ai, client, definition);

}
