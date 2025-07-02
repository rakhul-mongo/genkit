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

import { z } from 'genkit';
import { EmbedderArgument } from 'genkit';
import { Collection, MongoClient } from 'mongodb';
import { MAX_BATCH_SIZE } from './constants';

export type EmbedderCustomOptions = z.ZodTypeAny;

export interface MongoConnection {
    client: MongoClient;
    db: any;
    collection: Collection;
}

export const MongoDBOptionsSchema = z.object({
  url: z.string().url('Invalid MongoDB URL'),
  mongoClientOptions: z.any().optional(),
  dbName: z.string().min(1, 'Database name is required'),
  dbOptions: z.any().optional(),
  collectionName: z.string().min(1, 'Collection name is required'),
  collectionOptions: z.any().optional(),
});

export type MongoDBOptions = z.infer<typeof MongoDBOptionsSchema>;

export function validateMongoDBOptions(params: MongoDBOptions[]) {
    for (let i = 0; i < params.length; i++) {
      try {
        MongoDBOptionsSchema.parse(params[i]);
      } catch (validationError) {
        throw new Error(`Invalid MongoDB options at index ${i}: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
      }
    }
}

export const MongoDBIndexerOptionsSchema = z.object({
  embedder: z.custom<EmbedderArgument<EmbedderCustomOptions>>(),
  embedderOptions: z.any().optional(),
  embeddingField: z.string().min(1).optional(),
  contentField: z.string().min(1).optional(),
  contentTypeField: z.string().min(1).optional(),
  batchSize: z.number().int().positive().max(MAX_BATCH_SIZE).optional(),
});

export type MongoDBIndexerOptions = z.infer<typeof MongoDBIndexerOptionsSchema>;

export function validateMongoDBIndexerOptions(mongodbIndexerOptions: MongoDBIndexerOptions[]) {
    for (let i = 0; i < mongodbIndexerOptions.length; i++) {
      try {
        MongoDBIndexerOptionsSchema.parse(mongodbIndexerOptions[i]);
      } catch (validationError) {
        throw new Error(`Invalid MongoDB Indexer options at index ${i}: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
      }
    }
}