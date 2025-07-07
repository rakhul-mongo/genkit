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

async function main() {
  console.log("Testing MongoDB CRUD tools...");

  const toolPrefix = `mongodb/${MONGODB_DB_NAME}/${MONGODB_COLLECTION_NAME}`;
  console.log(`Using tool prefix: ${toolPrefix}`);

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash'),
      prompt: `
      Using the available tools,
      Please insert a new document with {"name": "John Doe", "email": "john.doe@example.com", "age": 50}.
      With the insertedId, find the document by id and return the document.
      Now update the document with the inserted id to update: {$set: {age: 12}} using the available tool.
      Also update the document with the id as "686b48d887a2f1c12113a16d" to update: {$set: {name: "bob"}} and options: {upsert: true} using the available tool.
      `,
      // Now delete the documents with those two ids
      tools: [
        `${toolPrefix}/insertOne`,
        `${toolPrefix}/findById`,
        `${toolPrefix}/updateOneById`,
        `${toolPrefix}/deleteOneById`,
      ],
      maxTurns: 10,
    });

    console.log('✅ Generation result:', text);
    console.log("\n🎉 CRUD tools test completed!");
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Execute the main function
main().catch(console.error);
