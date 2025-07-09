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
import { indexerRef, Document } from 'genkit/retriever';
import { Collection, MongoClient, Document as MongoDocument } from 'mongodb';
import { DEFAULT_FIELD_NAME, DEFAULT_BATCH_SIZE } from '../common/constants';
import { IndexerDefinition, IndexerOptions, IndexerOptionsSchema, RetryOptions } from '../common/types';
import { retryWithDelay } from '../common/retry';
import { getCollection } from '../common/connection';

function createMongoDocuments(
    documents: any[],
    embeddings: any[],
    options: IndexerOptions
) {
    const fieldName = options.fieldName ?? DEFAULT_FIELD_NAME;

    return documents.flatMap((document, i) => {
      const embeddingDocuments = document.getEmbeddingDocuments(embeddings[i]);
      return embeddingDocuments.map((embeddingDocument: any, j: number) => {
        const embedding = embeddings[i][j]?.embedding;
        if (!embedding) {
          throw new Error(`Missing embedding for document ${i}, chunk ${j}`);
        }
        return {
          [fieldName]: embedding,
          data: embeddingDocument.data,
          dataType: embeddingDocument.dataType,
          metadata: embeddingDocument.metadata,
          indexedAt: new Date(),
        };
      });
    });
}

async function generateEmbeddings(
    ai: Genkit,
    documents: Array<Document>,
    options: IndexerOptions
) {
    return await Promise.all(
      documents.map((document) =>
        ai.embed({
          embedder: options.embedder,
          options: options.embedderOptions,
          content: document,
        })
      )
    );
    // embed many
}

async function processDocumentBatch(
  ai: Genkit,
  collection: Collection,
  documents: Array<Document>,
  options: IndexerOptions,
  retryOptions?: RetryOptions,
) {
  return retryWithDelay(
    async () => {
      const embeddings = await generateEmbeddings(ai, documents, options);
      const mongoDocuments = createMongoDocuments(documents, embeddings, options);
      await collection.insertMany(mongoDocuments as Array<MongoDocument>, { ordered: false });
    },
    retryOptions?.attempts,
    retryOptions?.delay,
    retryOptions?.jitter,
  );
}

function configureIndexer(
  ai: Genkit,
  client: MongoClient,
  definition: IndexerDefinition
) {
  return ai.defineIndexer(
    {
      name: `mongodb/${definition.id}`,
      configSchema: IndexerOptionsSchema
    },
    async (documents: Array<Document>, options: IndexerOptions) => {

      const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

      try {

        const collection = getCollection(client, options.dbName, options.collectionName, options.dbOptions, options.collectionOptions);

        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          await processDocumentBatch(ai, collection, batch, options, definition.retry);
        }

      } catch (error) {
        throw new Error(`Mongo indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export function defineIndexer(ai: Genkit, client: MongoClient, definition?: IndexerDefinition) {
  if (!definition?.id) {
    return;
  }
  configureIndexer(ai, client, definition);
}

export function mongoIndexerRef(id: string) {
  return indexerRef({
    name: `mongodb/${id}`,
    info: {
      label: `Mongo Indexer - ${id}`,
    },
    configSchema: IndexerOptionsSchema
  });
}