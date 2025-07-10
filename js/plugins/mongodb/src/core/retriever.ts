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

import { retrieverRef, Document } from "genkit/retriever";
import { BaseDefinition, EmbedderOptions, HybridSearchOptions, RetrieverOptions, RetrieverOptionsSchema, RetryOptions, TextSearchOptions, validateRetrieverOptions, VectorSearchOptions } from "../common/types";
import { DEFAULT_LIMIT } from "../common/constants";
import { Genkit } from "genkit";
import { Collection, MongoClient, Document as MongoDocument } from "mongodb";
import { retryWithDelay } from "../common/retry";
import { getCollection } from "../common/connection";

async function createTextSearchPipeline(query: string, options: TextSearchOptions) {
  const { index, path, matchCriteria, fuzzy, limit } = options;
  return [
    {
      $search: {
        index,
        text: {
          query: query,
          path,
          matchCriteria,
          fuzzy,
        },
      }
    },
    {
      $limit: limit ?? DEFAULT_LIMIT,
    }
  ];
}

async function createVectorSearchPipeline(queryVector: number[], options: VectorSearchOptions) {
  const { index, path, exact, numCandidates, filter, limit } = options;
  return [
    {
      $vectorSearch: {
        index,
        queryVector,
        path,
        exact,
        numCandidates,
        filter: filter ?? {},
        limit: limit ?? DEFAULT_LIMIT,
      }
    },
  ];
}

async function executeSearchPipeline(collection: Collection, pipeline: any[], retryOptions?: RetryOptions): Promise<MongoDocument[]> {
  return retryWithDelay(
    async () => {
      return await collection.aggregate(pipeline).toArray();
    },
    retryOptions
  );
}

async function convertResultsToDocuments(results: MongoDocument[]): Promise<Document[]> {
  return results.map((result) => {
    return Document.fromData(result.data, result.dataType, result.metadata);
  });
}

async function generateEmbeddings(
  ai: Genkit,
  document: Document,
  options: EmbedderOptions
) {
  return await ai.embed({
    embedder: options.embedder,
    options: options.embedderOptions,
    content: document,
  });
}

async function retrieveText(collection: Collection, query: string, options: TextSearchOptions, retryOptions?: RetryOptions) {
  try {
    const pipeline = await createTextSearchPipeline(query, options);
    const results = await executeSearchPipeline(collection, pipeline, retryOptions);
    const documents = await convertResultsToDocuments(results);

    return { documents };
  } catch (error) {
    throw new Error(`Text search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function retrieveVector(ai: Genkit, collection: Collection, document: Document, options: VectorSearchOptions, retryOptions?: RetryOptions) {
  try {
    const embeddings = await generateEmbeddings(ai, document, options);
    const queryVector = embeddings[0].embedding;

    const pipeline = await createVectorSearchPipeline(queryVector, options);
    const results = await executeSearchPipeline(collection, pipeline, retryOptions);
    const documents = await convertResultsToDocuments(results);

    return { documents };
  } catch (error) {
    throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function retrieveHybrid(ai: Genkit, collection: Collection, document: Document, options: HybridSearchOptions, retryOptions?: RetryOptions) {
  try {
    // TODO: Implement hybrid search combining text and vector search

    return {
      documents: [],
      metadata: {},
    };
  } catch (error) {
    throw new Error(`Hybrid search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function configureRetriever(
  ai: Genkit,
  client: MongoClient,
  definition: BaseDefinition,
) {
  return ai.defineRetriever(
    {
      name: `mongodb/${definition.id}`,
      configSchema: RetrieverOptionsSchema
    },
    async (document: Document, options: RetrieverOptions) => {
      try {

        validateRetrieverOptions(options);

        const collection = getCollection(client, options.dbName, options.collectionName, options.dbOptions, options.collectionOptions);

        if ('text' in options && options.text) {
          return await retrieveText(collection, document.data, options.text, definition.retry);
        }

        if ('vector' in options && options.vector) {
          return await retrieveVector(ai, collection, document, options.vector, definition.retry);
        }

        if ('hybrid' in options && options.hybrid) {
          return await retrieveHybrid(ai, collection, document, options.hybrid, definition.retry);
        }

        throw new Error(`No retrieval options provided: ${options}`);

      } catch (error) {
        throw new Error(`Mongo retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export function defineRetriever(ai: Genkit, client: MongoClient, definition?: BaseDefinition) {
  if (!definition?.id) {
    return;
  }
  configureRetriever(ai, client, definition);
}

export function mongoRetrieverRef (id: string) {
    return retrieverRef({
      name: `mongodb/${id}`,
      info: {
        label: `Mongo Retriever - ${id}`
      },
      configSchema: RetrieverOptionsSchema
    });
}