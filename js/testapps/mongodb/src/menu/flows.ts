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

import { Document, z } from 'genkit';
import { ai } from '../genkit.js';
import { AnswerOutputSchema, MenuItem, MenuItemSchema, MenuQuestionInputSchema } from '../types.js';
import { mongoIndexerRef, mongoRetrieverRef } from 'genkitx-mongodb';
import { MONGODB_COLLECTION_NAME, MONGODB_DB_NAME } from '../config.js';
import { menuPrompt } from './prompts.js';
import { googleAI } from '@genkit-ai/googleai';

const embedder = googleAI.embedder('text-embedding-004');

export const menuIndexerFlow = ai.defineFlow(
  {
    name: 'menuIndexFlow',
    inputSchema: z.array(MenuItemSchema),
    outputSchema: z.object({ rows: z.number() }),
  },
  async (menuItems) => {
    const documents = menuItems.map((menuItem) => {
      const text = `${menuItem.title} ${menuItem.price} \n ${menuItem.description}`;
      return Document.fromText(text, menuItem);
    });

    await ai.index({
      indexer: mongoIndexerRef('menuIndexer'),
      documents,
      options: {
        dbName: MONGODB_DB_NAME,
        collectionName: MONGODB_COLLECTION_NAME,
        fieldName: 'item',
        batchSize: 50,
        embedder,
      }
    });
    return { rows: menuItems.length };
  }
);

export const menuRetrieveVectorFlow = ai.defineFlow(
  {
    name: 'menuRetrieveVectorFlow',
    inputSchema: MenuQuestionInputSchema,
    outputSchema: AnswerOutputSchema,
  },
  async (input) => {
    const docs = await ai.retrieve({
      retriever: mongoRetrieverRef('menuRetriever'),
      query: input.question,
      options: {
        dbName: MONGODB_DB_NAME,
        collectionName: MONGODB_COLLECTION_NAME,
        vector: {
          embedder,
          index: "item",
          path: "item",
          exact: false,
          numCandidates: 10,
          limit: 3,
        }
      },
    });

    const menuData: Array<MenuItem> = docs.map(
      (doc) => (doc.metadata || {}) as MenuItem
    );

    const response = await menuPrompt({
      menuData: menuData,
      question: input.question,
    });
    return { answer: response.text };
  }
);

export const menuRetrieveTextFlow = ai.defineFlow(
  {
    name: 'menuRetrieveTextFlow',
    inputSchema: MenuQuestionInputSchema,
    outputSchema: AnswerOutputSchema,
  },
  async (input) => {
    const docs = await ai.retrieve({
      retriever: mongoRetrieverRef('menuRetriever'),
      query: input.question,
      options: {
        dbName: MONGODB_DB_NAME,
        collectionName: MONGODB_COLLECTION_NAME,
        text: {
          index: "data",
          path: "data",
          limit: 3,
          fuzzy: {
            maxEdits: 2,
            prefixLength: 0,
            maxExpansions: 50,
          }
        }
      },
    });

    const menuData: Array<MenuItem> = docs.map(
      (doc) => (doc.metadata || {}) as MenuItem
    );

    const response = await menuPrompt({
      menuData: menuData,
      question: input.question,
    });
    return { answer: response.text };
  }
);