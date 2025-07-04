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
import { Collection, Document as MongoDocument } from 'mongodb';
import { CONTENT_FIELD, CONTENT_TYPE_FIELD, EMBEDDING_FIELD, DEFAULT_BATCH_SIZE, MONGODB_IDENTIFIER } from './constants';
import { MongoDBIndexerOptions, MongoDBIndexerOptionsSchema, validateMongoDBIndexerOptions } from './validation';
import { retryWithBackoff } from './retry';

function createMongoDBDocuments(
    documents: any[],
    embeddings: any[],
    options: MongoDBIndexerOptions
) {
    const embeddingField = options.embeddingField ?? EMBEDDING_FIELD;
    const contentField = options.contentField ?? CONTENT_FIELD;
    const contentTypeField = options.contentTypeField ?? CONTENT_TYPE_FIELD;

    return documents.flatMap((document, i) => {
      const embeddingDocuments = document.getEmbeddingDocuments(embeddings[i]);
      return embeddingDocuments.map((embeddingDocument: any, j: number) => {
        const embedding = embeddings[i][j]?.embedding;
        if (!embedding) {
          throw new Error(`Missing embedding for document ${i}, chunk ${j}`);
        }
        return {
          [embeddingField]: embedding,
          ...(embeddingDocument.data != null ? { [contentField]: embeddingDocument.data } : {}),
          ...(embeddingDocument.dataType ? { [contentTypeField]: embeddingDocument.dataType } : {}),
          metadata: embeddingDocument.metadata,
          indexedAt: new Date(),
        };
      });
    });
}

async function generateEmbeddings(
    ai: Genkit,
    documents: Array<Document>,
    options: MongoDBIndexerOptions
) {
    return await Promise.all(
      documents.map((document) =>
        ai.embed({
          embedder: options.embedder,
          content: document,
          options: options.embedderOptions,
        })
      )
    );
}

async function processDocumentBatch(
  ai: Genkit,
  collection: Collection,
  documents: Array<Document>,
  options: MongoDBIndexerOptions,
) {
  return retryWithBackoff(
    async () => {
      const embeddings = await generateEmbeddings(ai, documents, options);
      const mongoDocuments = createMongoDBDocuments(documents, embeddings, options);
      await collection.insertMany(mongoDocuments as Array<MongoDocument>, { ordered: false });
    },
  );
}

export function defineIndexer(
  ai: Genkit,
  collection: Collection,
) {
  return ai.defineIndexer(
    {
      name: MONGODB_IDENTIFIER(collection.dbName, collection.collectionName),
    },
    async (documents: Array<Document>, options: MongoDBIndexerOptions) => {
      console.log(`Processing ${documents.length} documents for MongoDB indexing`);
      validateMongoDBIndexerOptions(options);

      const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;

      try {
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          await processDocumentBatch(ai, collection, batch, options);
        }

        console.log(`Successfully indexed ${documents.length} documents`);
      } catch (error) {
        console.error('Error during MongoDB indexing:', error);
        throw new Error(`MongoDB indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  );
}

export function mongodbIndexerRef(indexerName: {dbName: string, collectionName: string}) {
  const mongoDbIndexerName = MONGODB_IDENTIFIER(indexerName.dbName, indexerName.collectionName);
  return indexerRef({
    name: mongoDbIndexerName,
    info: {
      label: `MongoDB Indexer - ${mongoDbIndexerName}`,
    },
    configSchema: MongoDBIndexerOptionsSchema.optional(),
  });
}