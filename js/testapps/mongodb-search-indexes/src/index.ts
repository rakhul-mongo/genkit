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
import { mongodb, mongoSearchIndexToolsRefArray } from 'genkitx-mongodb';
import { genkit } from 'genkit';
import { MONGODB_COLLECTION_NAME, MONGODB_DB_NAME, MONGODB_TEXT_SEARCH_FIELD_NAME, MONGODB_TEXT_SEARCH_INDEX_NAME, MONGODB_URL, MONGODB_VECTOR_SEARCH_FIELD_NAME, MONGODB_VECTOR_SEARCH_INDEX_NAME, MONGODB_VECTOR_SEARCH_NUM_DIMENSIONS, MONGODB_VECTOR_SEARCH_SIMILARITY } from './config';


const ai = genkit({
  plugins: [
    googleAI(),
    mongodb([{
      url: MONGODB_URL,
      searchIndexTools: { id: 'search-indexes' }
    }])
  ]
});

async function createTextSearchIndex(schema: any) {
  console.log("Testing MongoDB Index Management tools...");

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
      Using the available tools,
      For the following dbName: ${MONGODB_DB_NAME} and collectionName: ${MONGODB_COLLECTION_NAME}
      Please create a search index on the collection with the following schema:
      {
        name: "${schema.name}",
        type: "${schema.type}",
        definition: {
          "mappings": {
            "dynamic": false,
            "fields": {
              "${schema.path}": {
                "type": "string"
              }
            }
          }
        },
      }
      `,
      tools: mongoSearchIndexToolsRefArray('search-indexes'),
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function listSearchIndexes() {
  console.log("Testing MongoDB Index Management tools...");

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `
      For the following database: ${MONGODB_DB_NAME} and collection: ${MONGODB_COLLECTION_NAME}
      Using the available tools,
      Please list all indexes
      `,
      tools: mongoSearchIndexToolsRefArray('search-indexes'),
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function dropSearchIndex(indexName: string) {
  console.log("Testing MongoDB Index Management tools...");

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `
      For the following database: ${MONGODB_DB_NAME} and collection: ${MONGODB_COLLECTION_NAME}
      Using the available tools,
      Please drop the search index with name "${indexName}"
      `,
      tools: mongoSearchIndexToolsRefArray('search-indexes'),
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function createVectorSearchIndex(schema: any) {
  console.log("Testing MongoDB Index Management tools...");

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
      For the following database: ${MONGODB_DB_NAME} and collection: ${MONGODB_COLLECTION_NAME}
      Using the available tools,
      Please create a search index on the collection with the following schema:
      {
        name: "${schema.name}",
        definition: {
          "fields": [
            {
              "type": "${schema.type}",
              "path": "${schema.path}",
              "numDimensions": ${schema.numDimensions},
              "similarity": "${schema.similarity}"
            }
          ]
        },
      }
      `,
      tools: mongoSearchIndexToolsRefArray('search-indexes'),
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// dropSearchIndex(`${MONGODB_TEXT_SEARCH_INDEX_NAME}`).catch(console.error);
// dropSearchIndex(`${MONGODB_VECTOR_SEARCH_INDEX_NAME}`).catch(console.error);

listSearchIndexes().catch(console.error);

// createTextSearchIndex({
//   name: MONGODB_TEXT_SEARCH_INDEX_NAME,
//   type: "search",
//   path: MONGODB_TEXT_SEARCH_FIELD_NAME,
// }).catch(console.error);

// createVectorSearchIndex({
//   name: MONGODB_VECTOR_SEARCH_INDEX_NAME,
//   type: "vectorSearch",
//   path: MONGODB_VECTOR_SEARCH_FIELD_NAME,
//   numDimensions: MONGODB_VECTOR_SEARCH_NUM_DIMENSIONS,
//   similarity: MONGODB_VECTOR_SEARCH_SIMILARITY,
// }).catch(console.error);
