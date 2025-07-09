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
import { EmbedderOptions, HybridSearchOptions, RetrieverOptions, RetryOptions, TextSearchOptions, VectorSearchOptions } from "../utils/validation";
import { DEFAULT_LIMIT, RETRIEVER_MODE } from "../common/constants";
import { Genkit } from "genkit";
import { Collection } from "mongodb";
import { retryWithDelay } from "../utils/retry";

async function createTextSearchPipeline(query: string, options: TextSearchOptions) {
  return [
    {
      $search: {
        index: options.index,
        text: {
          query: query,
          path: options.path,
          matchCriteria: options.matchCriteria,
          fuzzy: options.fuzzy,
        },
      }
    },
    {
      $limit: options.limit ?? DEFAULT_LIMIT,
    }
  ];
}

async function createVectorSearchPipeline(queryVector: number[], options: VectorSearchOptions) {
  return [
    {
      $vectorSearch: {
        index: options.index,
        queryVector: queryVector,
        path: options.path,
        exact: options.exact,
        numCandidates: options.numCandidates,
        filter: options.filter ?? {},
        limit: options.limit,
      }
    },
  ];
}

async function executeSearchPipeline(collection: Collection, pipeline: any[], options: RetryOptions) {
  return retryWithDelay(
    async () => {
      return await collection.aggregate(pipeline).toArray();
    },
    options?.attempts,
    options?.delay,
    options?.jitter,
  );
}

async function convertResultsToDocuments(results: any[]): Promise<Document[]> {
  return results.map((result) => {
    return Document.fromData(JSON.stringify(result));
  });
}

async function generateEmbeddings(
  ai: Genkit,
  document: Document,
  options: EmbedderOptions
) {
  return await ai.embed({
    embedder: options.embedder,
    content: document,
    options: options.embedderOptions,
  });
}

async function retrieveText(collection: Collection, query: string, options: TextSearchOptions, retryOptions: RetryOptions) {
  console.log(`Executing text search with query: "${query}"`);

  try {
    const pipeline = await createTextSearchPipeline(query, options);
    const results = await executeSearchPipeline(collection, pipeline, retryOptions);
    const documents = await convertResultsToDocuments(results);

    console.log(`Text search returned ${documents.length} documents`);
    return { documents };
  } catch (error) {
    console.error('Error during text search:', error);
    throw new Error(`Text search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function retrieveVector(ai: Genkit, collection: Collection, document: Document, options: VectorSearchOptions, retryOptions: RetryOptions) {
  console.log(`Executing vector search for document`);

  try {
    const embeddings = await generateEmbeddings(ai, document, options);
    const queryVector = embeddings[0].embedding;

    console.log(`Generated embedding with ${queryVector.length} dimensions`);

    const pipeline = await createVectorSearchPipeline(queryVector, options);
    const results = await executeSearchPipeline(collection, pipeline, retryOptions);
    const documents = await convertResultsToDocuments(results);

    console.log(`Vector search returned ${documents.length} documents`);
    return { documents };
  } catch (error) {
    console.error('Error during vector search:', error);
    throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function retrieveHybrid(ai: Genkit, collection: Collection, document: Document, options: HybridSearchOptions, retryOptions: RetryOptions) {
  console.log(`Executing hybrid search for document`);

  try {
    // TODO: Implement hybrid search combining text and vector search

    console.log(`Hybrid search not yet implemented`);
    return {
      documents: [],
      metadata: {},
    };
  } catch (error) {
    console.error('Error during hybrid search:', error);
    throw new Error(`Hybrid search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function defineRetriever(
  ai: Genkit,
  collection: Collection,
  options: RetrieverOptions,
) {
  return ai.defineRetriever(
    {
      name: `mongodb/${options.id}`,
    },
    async (document: Document) => {
      console.log(`Querying Mongo via retriever with mode: ${options.mode}`);
      try {
        const retryOptions = options.retry ?? {};

        switch (options.mode) {
          case RETRIEVER_MODE.TEXT:
            return await retrieveText(collection, document.data, options.text, retryOptions);
          case RETRIEVER_MODE.VECTOR:
            return await retrieveVector(ai, collection, document, options.vector, retryOptions);
          case RETRIEVER_MODE.HYBRID:
            return await retrieveHybrid(ai, collection, document, options.hybrid, retryOptions);
          default:
            throw new Error(`Invalid retrieval mode: ${(options as any).mode}`);
        }

      } catch (error) {
        console.error('Error during Mongo retrieval:', error);
        throw new Error(`Mongo retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export function mongoRetrieverRef (id: string) {
    return retrieverRef({
      name: `mongodb/${id}`,
      info: {
        label: `Mongo Retriever - ${id}`
      }
    });
}