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
import { MAX_LIMIT, MAX_NUM_CANDIDATES, RETRIEVER_MODE } from '../common/constants';
import { CollectionOptions, DbOptions, MongoClientOptions } from 'mongodb';

export type EmbedderCustomOptions = z.ZodTypeAny;

const RetryOptionsSchema = z.object({
  attempts: z.number().int().positive().optional(),
  delay: z.number().int().positive().optional(),
  jitter: z.number().int().positive().optional(),
});

export type RetryOptions = z.infer<typeof RetryOptionsSchema>;

const EmbedderOptionsSchema = z.object({
  embedder: z.custom<EmbedderArgument<EmbedderCustomOptions>>(),
  embedderOptions: z.any().optional(),
})

export type EmbedderOptions = z.infer<typeof EmbedderOptionsSchema>;

const BaseOptionsSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  retry: RetryOptionsSchema.optional(),
});

export const IndexerOptionsSchema =  z.object({
  embeddingField: z.string().min(1).optional(),
  contentField: z.string().min(1).optional(),
  contentTypeField: z.string().min(1).optional(),
  batchSize: z.number().int().positive().optional(),
}).and(EmbedderOptionsSchema).and(BaseOptionsSchema);

export type IndexerOptions = z.infer<typeof IndexerOptionsSchema>;

const TextSearchSchema = z.object({
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

export type TextSearchOptions = z.infer<typeof TextSearchSchema>;

const VectorSearchSchema = EmbedderOptionsSchema.extend({
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

export type VectorSearchOptions = z.infer<typeof VectorSearchSchema>;

const HybridSearchSchema = EmbedderOptionsSchema.extend({});

export type HybridSearchOptions = z.infer<typeof HybridSearchSchema>;

const TextModeSchema = z.object({
  mode: z.literal(RETRIEVER_MODE.TEXT),
  text: TextSearchSchema,
});

const VectorModeSchema = z.object({
  mode: z.literal(RETRIEVER_MODE.VECTOR),
  vector: VectorSearchSchema,
});

const HybridModeSchema = z.object({
  mode: z.literal(RETRIEVER_MODE.HYBRID),
  hybrid: HybridSearchSchema,
});

export const RetrieverOptionsSchema = z.discriminatedUnion('mode', [
  TextModeSchema,
  VectorModeSchema,
  HybridModeSchema,
]).and(BaseOptionsSchema);

export type RetrieverOptions = z.infer<typeof RetrieverOptionsSchema>;

const CrudToolsSchema = z.object({
  createId: z.string().optional(),
  readId: z.string().optional(),
  updateId: z.string().optional(),
  deleteId: z.string().optional(),
  retry: RetryOptionsSchema.optional(),
}).refine(
  (data) => {
    return data.createId || data.readId || data.updateId || data.deleteId;
  },
  {
    message: "At least one of createId, readId, updateId, or deleteId must be provided",
    path: ["createId"]
  }
);

export type CrudToolsOptions = z.infer<typeof CrudToolsSchema>;

const SearchIndexToolsSchema = z.object({
  createId: z.string().optional(),
  readId: z.string().optional(),
  deleteId: z.string().optional(),
  retry: RetryOptionsSchema.optional(),
}).refine(
  (data) => {
    return data.createId || data.readId || data.deleteId;
  },
  {
    message: "At least one of createId, readId, or deleteId must be provided",
    path: ["createId"]
  }
);

export type SearchIndexToolsOptions = z.infer<typeof SearchIndexToolsSchema>;

const ConnectionOptionsSchema = z.object({
  dbName: z.string().min(1, 'Database name is required'),
  dbOptions: (z.any() as z.ZodType<DbOptions>).optional() ,
  collectionName: z.string().min(1, 'Collection name is required'),
  collectionOptions: (z.any() as z.ZodType<CollectionOptions>).optional(),
  indexers: z.array(IndexerOptionsSchema).optional(),
  retrievers: z.array(RetrieverOptionsSchema).optional(),
  crudTools: CrudToolsSchema.optional(),
  searchIndexTools: SearchIndexToolsSchema.optional(),
}).refine(
  (data) => {
    return (
      (data.indexers && data.indexers.length > 0) ||
      (data.retrievers && data.retrievers.length > 0) ||
      data.crudTools ||
      data.searchIndexTools
    );
  },
  {
    message: "At least one of indexers, retrievers, crudTools, or searchIndexTools must be provided",
    path: ["indexers"]
  }
);

export const OptionsSchema = z.object({
  url: z.string().url('Invalid  URL'),
  mongoClientOptions: (z.any() as z.ZodType<MongoClientOptions>).optional(),
  connections: z.array(ConnectionOptionsSchema).min(1, 'At least one connection is required'),
});

export type Options = z.infer<typeof OptionsSchema>;


export function validateOptions(options: Options) {
  try {
    OptionsSchema.parse(options);
  } catch (validationError) {
    throw new Error(`Invalid Mongo options: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
  }
}
