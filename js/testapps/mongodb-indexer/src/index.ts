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
import { mongodb, mongoIndexerRef } from 'genkitx-mongodb';
import { genkit } from 'genkit';
import { Document } from 'genkit/retriever';
import { MONGODB_COLLECTION_NAME, MONGODB_DB_NAME, MONGODB_URL } from './config';

const ai = genkit({
  plugins: [
    googleAI(),
    mongodb([{
      url: MONGODB_URL,
      indexer: { id: 'indexer' },
    }])
  ]
});

async function main() {
  console.log("Indexing documents...");
  await ai.index({
    indexer: mongoIndexerRef('indexer'),
    documents: [
      Document.fromText('The space shuttle launched successfully from Cape Canaveral.', { id: 'doc1' }),
      Document.fromText('A delicious recipe for making vegan lasagna at home.', { id: 'doc2' }),
      Document.fromText('A brief history of the Apollo moon missions.', { id: 'doc3' }),
      Document.fromText('Climate change is accelerating due to greenhouse gas emissions.', { id: 'doc4' }),
      Document.fromText('The Great Wall of China stretches over 13,000 miles and was built over centuries.', { id: 'doc5' }),
      Document.fromText('Apple announced new features for iOS 18 at the annual developer conference.', { id: 'doc6' }),
      Document.fromText('The Amazon rainforest is home to over 3 million species of plants and animals.', { id: 'doc7' }),
      Document.fromText('A beginner\'s guide to investing in mutual funds and ETFs.', { id: 'doc8' }),
      Document.fromText('Top 10 destinations to visit in Europe during spring.', { id: 'doc9' }),
      Document.fromText('Understanding the basics of machine learning and neural networks.', { id: 'doc10' }),
      Document.fromText('The human brain has around 86 billion neurons.', { id: 'doc11' }),
      Document.fromText('The World Health Organization declared the end of the global pandemic emergency.', { id: 'doc12' }),
      Document.fromText('Mount Everest is the tallest mountain on Earth at 8,848 meters above sea level.', { id: 'doc13' }),
      Document.fromText('A healthy breakfast includes protein, fiber, and complex carbohydrates.', { id: 'doc14' }),
      Document.fromText('The Python programming language is popular for data science and automation.', { id: 'doc15' }),
      // test using media
    ],
    options: {
      dbName: MONGODB_DB_NAME,
      collectionName: MONGODB_COLLECTION_NAME,
      fieldName: 'item',
      batchSize: 50,
      embedder: googleAI.embedder('text-embedding-004'),
    }
  });

  console.log('✅ Documents indexed successfully!');
}

main().catch(console.error);
