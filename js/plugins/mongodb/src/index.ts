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
import { MongoDBOptions, MongoConnection, validateMongoDBOptions } from './validation';
import { createMongoConnection, cleanupConnections } from './connection';
import { defineIndexer } from './indexer';
import { defineRetriever } from './retriever';
import { defineCRUDTools } from './crud';

export function mongodb(
  params: MongoDBOptions[]
): GenkitPlugin {
  return genkitPlugin(
    'mongodb',
    async (ai: Genkit) => {
      const connections: MongoConnection[] = [];

      try {
        for (const mongoDBOptions of params) {

          validateMongoDBOptions(mongoDBOptions);

          const connection = await createMongoConnection(mongoDBOptions);
          connections.push(connection);

          defineIndexer(ai, connection.collection);
          defineRetriever(ai, connection.collection);
          defineCRUDTools(ai, connection.collection);

        }
      } catch (error) {
        await cleanupConnections(connections);
        throw new Error(`MongoDB plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export type { MongoDBOptions, MongoDBIndexerOptions, MongoDBRetrieverOptions } from './validation';
export { mongodbIndexerRef } from './indexer';
export { mongodbRetrieverRef } from './retriever';
export { RETRIEVAL_MODE } from './constants';

export default mongodb;
