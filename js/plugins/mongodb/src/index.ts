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
import { MongoOptions, MongoConnection, validateMongoOptions } from './validation';
import { createMongoConnection, cleanupConnections } from './connection';
import { defineIndexer } from './indexer';
import { defineRetriever } from './retriever';
import { defineCRUDTools } from './crud';
import { defineSearchIndexTools } from './search-indexes';

export function mongodb(
  params: MongoOptions[]
): GenkitPlugin {
  return genkitPlugin(
    'mongodb',
    async (ai: Genkit) => {
      const connections: MongoConnection[] = [];

      try {
        for (const mongoOptions of params) {

          validateMongoOptions(mongoOptions);

          const connection = await createMongoConnection(mongoOptions);
          connections.push(connection);

          defineIndexer(ai, connection.collection);
          defineRetriever(ai, connection.collection);
          defineCRUDTools(ai, connection.collection);
          defineSearchIndexTools(ai, connection.collection);
        }
      } catch (error) {
        await cleanupConnections(connections);
        throw new Error(`Mongo plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export type { MongoOptions, MongoIndexerOptions, MongoRetrieverOptions } from './validation';
export { mongoIndexerRef } from './indexer';
export { mongoRetrieverRef } from './retriever';
export { RETRIEVAL_MODE } from './constants';

export default mongodb;
