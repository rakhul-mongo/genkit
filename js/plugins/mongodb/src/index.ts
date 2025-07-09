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
import { genkitPlugin, GenkitPlugin } from 'genkit/plugin';
import { ConnectionDefinition, validateConnectionDefinition } from './common/types';
import { getMongoClient, closeConnections } from './common/connection';
import { defineIndexer } from './core/indexer';
import { defineRetriever } from './core/retriever';
import { defineCRUDTools } from './tools/crud';
import { defineSearchIndexTools } from './tools/search-indexes';

export function mongodb(
  connections: ConnectionDefinition[]
): GenkitPlugin {
  return genkitPlugin(
    'mongodb',
    async (ai: Genkit) => {
      try {
        for (const connection of connections) {

          validateConnectionDefinition(connection);

          const client = await getMongoClient(connection.url, connection.mongoClientOptions);

          defineIndexer(ai, client, connection.indexer);
          defineRetriever(ai, client, connection.retriever);
          defineCRUDTools(ai, client, connection.crudTools);
          defineSearchIndexTools(ai, client, connection.searchIndexTools);

        }
      } catch (error) {
        await closeConnections();
        throw new Error(`Mongo plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export type {
  ConnectionDefinition as MongoConnectionDefinition,
  IndexerDefinition as MongoIndexerDefinition,
  RetrieverDefinition as MongoRetrieverDefinition,
  CrudToolsDefinition as MongoCrudToolsDefinition,
  SearchIndexToolsDefinition as MongoSearchIndexToolsDefinition,
  RetrieverOptions as MongoRetrieverOptions,
  IndexerOptions as MongoIndexerOptions,
  TextSearchOptions as MongoTextSearchOptions,
  VectorSearchOptions as MongoVectorSearchOptions,
  HybridSearchOptions as MongoHybridSearchOptions,
} from './common/types';
export { mongoIndexerRef } from './core/indexer';
export { mongoRetrieverRef } from './core/retriever';
export { mongoCrudToolsRefArray, mongoSearchIndexToolsRefArray } from './common/constants';

export default mongodb;
