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
import { MAX_BATCH_SIZE, MAX_LIMIT, MAX_NUM_CANDIDATES, RETRIEVAL_MODE } from './constants';

export type EmbedderCustomOptions = z.ZodTypeAny;

export interface MongoConnection {
    client: MongoClient;
    db: any;
    collection: Collection;
}

export const MongoOptionsSchema = z.object({
  url: z.string().url('Invalid Mongo URL'),
  mongoClientOptions: z.any().optional(),
  dbName: z.string().min(1, 'Database name is required'),
  dbOptions: z.any().optional(),
  collectionName: z.string().min(1, 'Collection name is required'),
  collectionOptions: z.any().optional(),
});

export type MongoOptions = z.infer<typeof MongoOptionsSchema>;


export function validateMongoOptions(options: MongoOptions) {
  try {
    MongoOptionsSchema.parse(options);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

export const MongoIndexerOptionsSchema = z.object({
  embedder: z.custom<EmbedderArgument<EmbedderCustomOptions>>(),
  embedderOptions: z.any().optional(),
  embeddingField: z.string().min(1).optional(),
  contentField: z.string().min(1).optional(),
  contentTypeField: z.string().min(1).optional(),
  batchSize: z.number().int().positive().max(MAX_BATCH_SIZE).optional(),
});

export type MongoIndexerOptions = z.infer<typeof MongoIndexerOptionsSchema>;

export function validateMongoIndexerOptions(options: MongoIndexerOptions) {
  try {
    MongoIndexerOptionsSchema.parse(options);
  } catch (validationError) {
    throw new Error(`Invalid Mongo Indexer options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

const textSearchSchema = z.object({
  index: z.string().optional(),
  path: z.string().min(1, 'Path is required'),
  matchCriteria: z.enum(['all', 'any']).optional(),
  fuzzy: z.object({
    maxEdits: z.number().min(1).max(2).optional(),
    prefixLength: z.number().optional(),
    maxExpansions: z.number().optional(),
  }).optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).optional(),
});

export type TextSearchOptions = z.infer<typeof textSearchSchema>;

const embedderOptionsSchema = z.object({
  embedder: z.custom<EmbedderArgument<EmbedderCustomOptions>>(),
  embedderOptions: z.any().optional(),
})

export type EmbedderOptions = z.infer<typeof embedderOptionsSchema>;

const vectorSearchSchema = embedderOptionsSchema.extend({
  index: z.string().min(1, 'Index is required'),
  path: z.string().min(1, 'Path is required'),
  exact: z.boolean().optional(),
  numCandidates: z.number().int().positive().max(MAX_NUM_CANDIDATES).optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).optional(),
  filter: z.record(z.any()).optional(),
}).superRefine((data, ctx) => {
  if (data.exact === false && !data.numCandidates) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "numCandidates required when exact is false", path: ["numCandidates"] });
  }
  if (data.numCandidates && data.exact === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "exact required when numCandidates provided", path: ["exact"] });
  }
  if (data.limit && data.numCandidates && data.limit > data.numCandidates) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "limit cannot exceed numCandidates", path: ["limit"] });
  }
});

export type VectorSearchOptions = z.infer<typeof vectorSearchSchema>;

const hybridSearchSchema = embedderOptionsSchema.extend({});

export type HybridSearchOptions = z.infer<typeof hybridSearchSchema>;

const textModeSchema = z.object({
  mode: z.literal(RETRIEVAL_MODE.TEXT),
  text: textSearchSchema,
});

const vectorModeSchema = z.object({
  mode: z.literal(RETRIEVAL_MODE.VECTOR),
  vector: vectorSearchSchema,
});

const hybridModeSchema = z.object({
  mode: z.literal(RETRIEVAL_MODE.HYBRID),
  hybrid: hybridSearchSchema,
});

export const MongoRetrieverOptionsSchema = z.discriminatedUnion('mode', [
  textModeSchema,
  vectorModeSchema,
  hybridModeSchema,
]);

export type MongoRetrieverOptions = z.infer<typeof MongoRetrieverOptionsSchema>;

export function validateMongoRetrieverOptions(options: MongoRetrieverOptions) {
  try {
    MongoRetrieverOptionsSchema.parse(options);
  } catch (validationError) {
    throw new Error(`Invalid Mongo Retriever options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}