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
import { googleAI } from '@genkit-ai/googleai';
import { mongodb, mongodbRetrieverRef, RETRIEVAL_MODE } from 'genkitx-mongodb';
import { genkit } from 'genkit';
import { MONGODB_COLLECTION_NAME, MONGODB_DB_NAME, MONGODB_URL } from './config';

const ai = genkit({
  plugins: [
    googleAI(),
    mongodb([
        {
          url: MONGODB_URL,
          dbName: MONGODB_DB_NAME,
          collectionName: MONGODB_COLLECTION_NAME,
        },
      ]
    ),
  ],
});

const retriever = mongodbRetrieverRef({ dbName: MONGODB_DB_NAME, collectionName: MONGODB_COLLECTION_NAME });

async function main() {

  console.log("Retrieving documents...");

  const documents = await ai.retrieve({
    retriever,
    query: "The space shuttle launched successfully from Cape Canaveral.",
    options: {
      mode: RETRIEVAL_MODE.VECTOR,
      vector: {
        embedder: googleAI.embedder('text-embedding-004'),
        index: "embedding1",
        path: "embedding1",
        exact: false,
        numCandidates: 10,
        limit: 3,
      },
    }
  });

  console.log('✅ Documents retrieved successfully!');
  for (const document of documents) {
    console.log(document.data);
  }
}

main().catch(console.error);
