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
import { z } from 'genkit';
import { Collection, SearchIndexDescription } from 'mongodb';
import { retryWithDelay } from '../utils/retry';
import { SearchIndexToolsOptions } from '../utils/validation';
import { mongoToolRef } from '../common/constants';

function defineCreateSearchIndexTool(ai: Genkit, collection: Collection, name: string, options: SearchIndexToolsOptions) {
  ai.defineTool(
    {
      name,
      description: `Create a text search index on the MongoDB collection ${collection.collectionName}`,
      inputSchema: z.object({
        name: z.string().describe('Name of the index').optional(),
        definition: z.object({}).passthrough().describe('The index definition'),
        type: z.enum(['search', 'vectorSearch']).describe('Type of the index'),
      }),
      outputSchema: z.object({
        indexName: z.string().describe('Name of the created index'),
        success: z.boolean().describe('Whether the operation was successful'),
        message: z.string().describe('Operation result message'),
      }),
    },
    async (input: SearchIndexDescription) => {
      console.log(`Creating search index on collection ${collection.collectionName} with keys: ${JSON.stringify(input)}`);
      try {
        const result = await retryWithDelay(
          async () => {
            return await collection.createSearchIndex(input);
          },
          options.retry?.attempts,
          options.retry?.delay,
          options.retry?.jitter,
        );

        console.log(`Successfully created search index: ${result}`);
        return {
          indexName: result,
          success: true,
          message: `Search index created successfully: ${result}`,
        };
      } catch (error) {
        console.error('Error creating search index:', error);
        return {
          indexName: '',
          success: false,
          message: `Failed to create search index: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

function defineListSearchIndexesTool(ai: Genkit, collection: Collection, name: string, options: SearchIndexToolsOptions) {
  ai.defineTool(
    {
      name,
      description: `List all indexes on the MongoDB collection ${collection.collectionName}`,
      inputSchema: z.object({}),
      outputSchema: z.object({
        indexes: z.array(z.record(z.any())).describe('Array of index definitions'),
        success: z.boolean().describe('Whether the operation was successful'),
        message: z.string().describe('Operation result message'),
      }),
    },
    async () => {
      console.log(`Listing indexes for collection ${collection.collectionName}`);

      try {
        const indexes = await retryWithDelay(
          async () => {
            return await collection.listSearchIndexes().toArray();
          },
          options.retry?.attempts,
          options.retry?.delay,
          options.retry?.jitter,
        );

        console.log(`Found ${indexes.length} indexes`);
        return {
          indexes,
          success: true,
          message: `Found ${indexes.length} indexes on collection ${collection.collectionName}`,
        };
      } catch (error) {
        console.error('Error listing indexes:', error);
        return {
          indexes: [],
          success: false,
          message: `Failed to list indexes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

function defineDropSearchIndexTool(ai: Genkit, collection: Collection, name: string, options: SearchIndexToolsOptions) {
  ai.defineTool(
    {
      name,
      description: `Drop an index by name from the MongoDB collection ${collection.collectionName}`,
      inputSchema: z.object({
        indexName: z.string().describe('Name of the index to drop'),
      }),
      outputSchema: z.object({
        success: z.boolean().describe('Whether the operation was successful'),
        message: z.string().describe('Operation result message'),
      }),
    },
    async ({ indexName }) => {
      console.log(`Dropping index ${indexName} from collection ${collection.collectionName}`);

      try {
        const result = await retryWithDelay(
          async () => {
            return await collection.dropSearchIndex(indexName);
          },
          options.retry?.attempts,
          options.retry?.delay,
          options.retry?.jitter,
        );

        console.log(`Successfully dropped index: ${result}`);
        return {
          success: true,
          message: `Index ${indexName} dropped successfully`,
        };
      } catch (error) {
        console.error('Error dropping index:', error);
        return {
          success: false,
          message: `Failed to drop index: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );
}

export function defineSearchIndexTools(ai: Genkit, collection: Collection, options: SearchIndexToolsOptions) {
  if (options.createId) {
    defineCreateSearchIndexTool(ai, collection, mongoToolRef(options.createId), options);
  }
  if (options.readId) {
    defineListSearchIndexesTool(ai, collection, mongoToolRef(options.readId), options);
  }
  if (options.deleteId) {
    defineDropSearchIndexTool(ai, collection, mongoToolRef(options.deleteId), options);
  }
}
