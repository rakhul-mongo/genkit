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
import { loadMongoDBIndexer } from './indexer';

export function mongodb(
  params: MongoDBOptions[]
): GenkitPlugin {
  return genkitPlugin(
    'mongodb',
    async (ai: Genkit) => {
      const connections: MongoConnection[] = [];

      try {
        validateMongoDBOptions(params);

        for (const mongoDBOptions of params) {
          const connection = await createMongoConnection(mongoDBOptions);
          connections.push(connection);

          loadMongoDBIndexer(ai, connection);
        }
      } catch (error) {
        await cleanupConnections(connections);
        throw new Error(`MongoDB plugin initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

// Re-export types and functions for external use
export { mongodbIndexerRef } from './indexer';
export type { MongoDBOptions, MongoDBIndexerOptions } from './validation';

export default mongodb;
