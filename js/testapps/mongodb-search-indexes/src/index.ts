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
import { mongodb } from 'genkitx-mongodb';
import { genkit } from 'genkit';
import { MONGODB_COLLECTION_NAME, MONGODB_DB_NAME, MONGODB_TEXT_SEARCH_FIELD_NAME, MONGODB_TEXT_SEARCH_INDEX_NAME, MONGODB_URL, MONGODB_VECTOR_SEARCH_FIELD_NAME, MONGODB_VECTOR_SEARCH_INDEX_NAME, MONGODB_VECTOR_SEARCH_NUM_DIMENSIONS, MONGODB_VECTOR_SEARCH_SIMILARITY } from './config';

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

async function createTextSearchIndex() {
  console.log("Testing MongoDB Index Management tools...");

  await ai.generate({
    model: googleAI.model('gemini-2.0-flash'),
    prompt: 'Test',
  });

  const toolPrefix = `mongodb/${MONGODB_DB_NAME}/${MONGODB_COLLECTION_NAME}`;
  console.log(`Using tool prefix: ${toolPrefix}`);

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
      Using the available tools,
      Please create a search index on the collection with the following definition:
      {
        name: "${MONGODB_TEXT_SEARCH_INDEX_NAME}",
        definition: {
          "mappings": {
            "dynamic": false,
            "fields": {
              "${MONGODB_TEXT_SEARCH_FIELD_NAME}": {
                "type": "string"
              }
            }
          }
        },
        type: "search"
      }

      Please list all indexes.
      `,
      tools: [
        `${toolPrefix}/listSearchIndexes`,
        `${toolPrefix}/createSearchIndex`,
      ],
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function dropTextSearchIndex() {
  console.log("Testing MongoDB Index Management tools...");

  await ai.generate({
    model: googleAI.model('gemini-2.0-flash'),
    prompt: 'Test',
  });

  const toolPrefix = `mongodb/${MONGODB_DB_NAME}/${MONGODB_COLLECTION_NAME}`;
  console.log(`Using tool prefix: ${toolPrefix}`);

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
      Using the available tools,
      Please drop the search index with name "${MONGODB_TEXT_SEARCH_INDEX_NAME}"
      Please list all indexes.
      `,
      tools: [
        `${toolPrefix}/dropSearchIndex`,
        `${toolPrefix}/listSearchIndexes`,
      ],
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function createVectorSearchIndex() {
  console.log("Testing MongoDB Index Management tools...");

  await ai.generate({
    model: googleAI.model('gemini-2.0-flash'),
    prompt: 'Test',
  });

  const toolPrefix = `mongodb/${MONGODB_DB_NAME}/${MONGODB_COLLECTION_NAME}`;
  console.log(`Using tool prefix: ${toolPrefix}`);

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
      Using the available tools,
      Please create a search index on the collection with the following definition:
      {
        name: "${MONGODB_VECTOR_SEARCH_INDEX_NAME}",
        definition: {
          "fields": [
            {
              "type": "vector",
              "path": "${MONGODB_VECTOR_SEARCH_FIELD_NAME}",
              "numDimensions": ${MONGODB_VECTOR_SEARCH_NUM_DIMENSIONS},
              "similarity": "${MONGODB_VECTOR_SEARCH_SIMILARITY}"
            }
          ]
        },
        type: "vectorSearch"
      }

      Please list all indexes.
      `,
      tools: [
        `${toolPrefix}/createSearchIndex`,
        `${toolPrefix}/listSearchIndexes`,
      ],
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function dropVectorSearchIndex() {
  console.log("Testing MongoDB Index Management tools...");

  await ai.generate({
    model: googleAI.model('gemini-2.0-flash'),
    prompt: 'Test',
  });

  const toolPrefix = `mongodb/${MONGODB_DB_NAME}/${MONGODB_COLLECTION_NAME}`;
  console.log(`Using tool prefix: ${toolPrefix}`);

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
      Using the available tools,
      Please drop the search index with name "${MONGODB_VECTOR_SEARCH_INDEX_NAME}"
      Please list all indexes.
      `,
      tools: [
        `${toolPrefix}/dropSearchIndex`,
        `${toolPrefix}/listSearchIndexes`,
      ],
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 Search Indexes tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// createTextSearchIndex().catch(console.error);
// createVectorSearchIndex().catch(console.error);
// dropTextSearchIndex().catch(console.error);
// dropVectorSearchIndex().catch(console.error);
