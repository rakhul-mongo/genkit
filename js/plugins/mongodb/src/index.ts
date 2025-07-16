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
import { Connection, validateConnection } from './common/types';
import { getMongoClient, closeConnections } from './common/connection';
import { defineIndexer } from './core/indexer';
import { defineRetriever } from './core/retriever';
import { defineCRUDTools } from './tools/crud';
import { defineSearchIndexTools } from './tools/search-indexes';

export function mongodb(
  connections: Array<Connection>
): GenkitPlugin {

  if (!connections || connections.length === 0) {
    throw new Error('At least one Mongo connection must be provided');
  }

  return genkitPlugin(
    'mongodb',
    async (ai: Genkit) => {
      try {
        for (const connection of connections) {

          const parsedConnection = validateConnection(connection);

          const client = await getMongoClient(parsedConnection.url, parsedConnection.mongoClientOptions);

          defineIndexer(ai, client, parsedConnection.indexer);
          defineRetriever(ai, client, parsedConnection.retriever);
          defineCRUDTools(ai, client, parsedConnection.crudTools);
          defineSearchIndexTools(ai, client, parsedConnection.searchIndexTools);

        }
      } catch (error) {
        await closeConnections();
        throw new Error(`Mongo plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export type {
  Connection as MongoConnection,
  IndexerOptions as MongoIndexerOptions,
  RetrieverOptions as MongoRetrieverOptions,

  RetryOptions as MongoRetryOptions,
  EmbedderOptions as MongoEmbedderOptions,

  InputCreate as MongoInputCreate,
  InputRead as MongoInputRead,
  InputUpdate as MongoInputUpdate,
  InputDelete as MongoInputDelete,

  TextSearchOptions as MongoTextSearchOptions,
  VectorSearchOptions as MongoVectorSearchOptions,
  HybridSearchOptions as MongoHybridSearchOptions,

  InputSearchIndexCreate as MongoInputSearchIndexCreate,
  InputSearchIndexList as MongoInputSearchIndexList,
  InputSearchIndexDrop as MongoInputSearchIndexDrop,

} from './common/types';

export { mongoIndexerRef } from './core/indexer';
export { mongoRetrieverRef } from './core/retriever';
export { mongoCrudToolsRefArray } from './common/constants';
export { mongoSearchIndexToolsRefArray } from './common/constants';

export default mongodb;
