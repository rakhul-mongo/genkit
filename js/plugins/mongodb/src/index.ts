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
import { Options, validateOptions } from './utils/validation';
import { getMongoClient, closeConnections } from './utils/connection';
import { defineIndexer } from './core/indexer';
import { defineRetriever } from './core/retriever';
import { defineCRUDTools } from './tools/crud';
import { defineSearchIndexTools } from './tools/search-indexes';

export function mongodb(
  params: Options[]
): GenkitPlugin {
  return genkitPlugin(
    'mongodb',
    async (ai: Genkit) => {
      try {
        for (const options of params) {

          validateOptions(options);

          const client = await getMongoClient(options.url, options.mongoClientOptions);

          for (const connection of options.connections) {

            const db = client.db(connection.dbName, connection.dbOptions);
            const collection = db.collection(connection.collectionName, connection.collectionOptions);

            for (const indexer of connection.indexers ?? []) {
              defineIndexer(ai, collection, indexer);
            }

            for (const retriever of connection.retrievers ?? []) {
              defineRetriever(ai, collection, retriever);
            }

            if (connection.crudTools) {
              defineCRUDTools(ai, collection, connection.crudTools);
            }

            if (connection.searchIndexTools) {
              defineSearchIndexTools(ai, collection, connection.searchIndexTools);
            }

          }
        }
      } catch (error) {
        await closeConnections();
        throw new Error(`Mongo plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export type { Options as MongoOptions, IndexerOptions as MongoIndexerOptions, RetrieverOptions as MongoRetrieverOptions } from './utils/validation';
export { mongoIndexerRef } from './core/indexer';
export { mongoRetrieverRef } from './core/retriever';
export { mongoToolRef } from './common/constants';
export { RETRIEVER_MODE as MONGO_RETRIEVER_MODE } from './common/constants';

export default mongodb;
