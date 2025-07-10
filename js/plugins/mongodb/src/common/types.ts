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
import { MAX_LIMIT, MAX_NUM_CANDIDATES } from './constants';
import { CollectionOptions, DbOptions, MongoClientOptions } from 'mongodb';

export type EmbedderCustomOptions = z.ZodTypeAny;

const RetryOptionsSchema = z.object({
  retryAttempts: z.number().int().positive().optional(),
  baseDelay: z.number().int().positive().optional(),
  jitterFactor: z.number().int().positive().optional(),
});

export type RetryOptions = z.infer<typeof RetryOptionsSchema>;

const EmbedderOptionsSchema = z.object({
  embedder: z.custom<EmbedderArgument<EmbedderCustomOptions>>(),
  embedderOptions: z.any().optional(),
})

export type EmbedderOptions = z.infer<typeof EmbedderOptionsSchema>;


const DatabaseCollectionSchema = z.object({
  dbName: z.string().min(1, 'Database name is required'),
  dbOptions: (z.any() as z.ZodType<DbOptions>).optional() ,
  collectionName: z.string().min(1, 'Collection name is required'),
  collectionOptions: (z.any() as z.ZodType<CollectionOptions>).optional(),
});

// Indexer

export const IndexerOptionsSchema = DatabaseCollectionSchema.and(EmbedderOptionsSchema).and(z.object({
  fieldName: z.string().min(1).optional(),
  batchSize: z.number().int().positive().optional(),
}));

export type IndexerOptions = z.infer<typeof IndexerOptionsSchema>;

export function validateIndexerOptions(options: IndexerOptions) {
  try {
    IndexerOptionsSchema.parse(options);
  } catch (validationError) {
    throw new Error(`Invalid Mongo indexer options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

// Retriever

const TextSearchSchema = z.object({
  index: z.string().min(1, 'Index is required'),
  path: z.string().min(1, 'Path is required'),
  matchCriteria: z.enum(['all', 'any']).optional(),
  fuzzy: z.object({
    maxEdits: z.number().min(1).max(2).optional(),
    prefixLength: z.number().optional(),
    maxExpansions: z.number().optional(),
  }).optional(),
  limit: z.number().int().positive().max(MAX_LIMIT).optional(),
});

export type TextSearchOptions = z.infer<typeof TextSearchSchema>;

const VectorSearchSchema = EmbedderOptionsSchema.and(z.object({
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
}));

export type VectorSearchOptions = z.infer<typeof VectorSearchSchema>;

const HybridSearchSchema = EmbedderOptionsSchema.and(z.object({}));

export type HybridSearchOptions = z.infer<typeof HybridSearchSchema>;

export const RetrieverOptionsSchema = DatabaseCollectionSchema.and(z.union([
  z.object({ text: TextSearchSchema }),
  z.object({ vector: VectorSearchSchema }),
  z.object({ hybrid: HybridSearchSchema }),
]));

export type RetrieverOptions = z.infer<typeof RetrieverOptionsSchema>;

export function validateRetrieverOptions(options: RetrieverOptions) {
  try {
    RetrieverOptionsSchema.parse(options);
  } catch (validationError) {
    throw new Error(`Invalid Mongo retriever options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}
// Crud

export const InputCreateSchema = z.object({
  dbName: z.string().describe('The name of the database to use'),
  dbOptions: z.object({}).passthrough().describe('The database options to use').optional(),
  collectionName: z.string().describe('The name of the collection to use'),
  collectionOptions: z.object({}).passthrough().describe('The collection options to use').optional(),
  document: z.object({}).passthrough().describe('The document data to insert'),
});

export type InputCreate = z.infer<typeof InputCreateSchema>;

export function validateCreateOptions(input: InputCreate) {
  try {
    InputCreateSchema.parse(input);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

export const OutputCreateSchema = z.object({
  insertedId: z.string().describe('The ID of the inserted document'),
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Operation result message'),
});

export const InputReadSchema = z.object({
  dbName: z.string().describe('The name of the database to use'),
  dbOptions: z.object({}).passthrough().describe('The database options to use').optional(),
  collectionName: z.string().describe('The name of the collection to use'),
  collectionOptions: z.object({}).passthrough().describe('The collection options to use').optional(),
  id: z.string().describe('The document ID to retrieve'),
});

export type InputRead = z.infer<typeof InputReadSchema>;

export function validateReadOptions(input: InputRead) {
  try {
    InputReadSchema.parse(input);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}
export const OutputReadSchema = z.object({
  document: z.record(z.any()).nullable().describe('The retrieved document or null if not found'),
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Operation result message'),
});

export const InputUpdateSchema = z.object({
  dbName: z.string().describe('The name of the database to use'),
  dbOptions: z.object({}).passthrough().describe('The database options to use').optional(),
  collectionName: z.string().describe('The name of the collection to use'),
  collectionOptions: z.object({}).passthrough().describe('The collection options to use').optional(),
  id: z.string().describe('The document ID to update'),
  update: z.object({}).passthrough().describe('The MongoDB update operations to apply (must use atomic operators like $set, $unset, $inc, etc.)'),
  options: z.object({}).passthrough().describe('The MongoDB update options to apply').optional(),
});

export type InputUpdate = z.infer<typeof InputUpdateSchema>;

export function validateUpdateOptions(input: InputUpdate) {
  try {
    InputUpdateSchema.parse(input);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}
export const OutputUpdateSchema = z.object({
  matchedCount: z.number().describe('Number of documents that matched the filter'),
  modifiedCount: z.number().describe('Number of documents that were modified'),
  upsertedId: z.string().nullable().describe('ID of the upserted document if upsert was true'),
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Operation result message'),
});

export const InputDeleteSchema = z.object({
  dbName: z.string().describe('The name of the database to use'),
  dbOptions: z.object({}).passthrough().describe('The database options to use').optional(),
  collectionName: z.string().describe('The name of the collection to use'),
  collectionOptions: z.object({}).passthrough().describe('The collection options to use').optional(),
  id: z.string().describe('The document ID to delete'),
});

export type InputDelete = z.infer<typeof InputDeleteSchema>;

export function validateDeleteOptions(input: InputDelete) {
  try {
    InputDeleteSchema.parse(input);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

export const OutputDeleteSchema = z.object({
  deletedCount: z.number().describe('Number of documents that were deleted'),
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Operation result message'),
});

// Search Index

export const InputSearchIndexCreateSchema = z.object({
  dbName: z.string().describe('The name of the database to use'),
  dbOptions: z.object({}).passthrough().describe('The database options to use').optional(),
  collectionName: z.string().describe('The name of the collection to use'),
  collectionOptions: z.object({}).passthrough().describe('The collection options to use').optional(),
  schema: z.object({
    name: z.string().describe('Name of the index'),
    definition: z.object({}).passthrough().describe('The index definition'),
    type: z.enum(['search', 'vectorSearch']).describe('Type of the index'),
  }).describe('The index schema'),
});

export type InputSearchIndexCreate = z.infer<typeof InputSearchIndexCreateSchema>;

export function validateSearchIndexCreateOptions(input: InputSearchIndexCreate) {
  try {
    InputSearchIndexCreateSchema.parse(input);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

export const OutputSearchIndexCreateSchema =z.object({
  indexName: z.string().describe('Name of the created index'),
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Operation result message'),
});

export const InputSearchIndexListSchema = z.object({
  dbName: z.string().describe('The name of the database to use'),
  dbOptions: z.object({}).passthrough().describe('The database options to use').optional(),
  collectionName: z.string().describe('The name of the collection to use'),
  collectionOptions: z.object({}).passthrough().describe('The collection options to use').optional(),
});

export type InputSearchIndexList = z.infer<typeof InputSearchIndexListSchema>;

export function validateSearchIndexListOptions(input: InputSearchIndexList) {
  try {
    InputSearchIndexListSchema.parse(input);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

export const OutputSearchIndexListSchema = z.object({
  indexes: z.array(z.record(z.any())).describe('Array of index definitions'),
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Operation result message'),
});

export const InputSearchIndexDropSchema = z.object({
  dbName: z.string().describe('The name of the database to use'),
  dbOptions: z.object({}).passthrough().describe('The database options to use').optional(),
  collectionName: z.string().describe('The name of the collection to use'),
  collectionOptions: z.object({}).passthrough().describe('The collection options to use').optional(),
  indexName: z.string().describe('Name of the index to drop'),
});

export type InputSearchIndexDrop = z.infer<typeof InputSearchIndexDropSchema>;

export function validateSearchIndexDropOptions(input: InputSearchIndexDrop) {
  try {
    InputSearchIndexDropSchema.parse(input);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}

export const OutputSearchIndexDropSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful'),
  message: z.string().describe('Operation result message'),
});

  // Definition


const BaseDefinitionSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  retry: RetryOptionsSchema.optional(),
});

export type BaseDefinition = z.infer<typeof BaseDefinitionSchema>;

export const ConnectionDefinitionSchema = z.object({
  url: z.string().url('Invalid  URL'),
  mongoClientOptions: (z.any() as z.ZodType<MongoClientOptions>).optional(),
  indexer: BaseDefinitionSchema.optional(),
  retriever: BaseDefinitionSchema.optional(),
  crudTools: BaseDefinitionSchema.optional(),
  searchIndexTools: BaseDefinitionSchema.optional(),
}).refine(
  (data) => {
    return (
      (data.indexer || data.retriever || data.crudTools || data.searchIndexTools)
    );
  },
  {
    message: "At least one of indexer, retriever, crudTools, or searchIndexTools must be provided",
    path: ["indexer"]
  }
);

export type ConnectionDefinition = z.infer<typeof ConnectionDefinitionSchema>;

export function validateConnectionDefinition(definition: ConnectionDefinition) {
  try {
    ConnectionDefinitionSchema.parse(definition);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}
