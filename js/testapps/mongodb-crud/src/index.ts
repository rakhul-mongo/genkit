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
import { mongoCrudToolsRefArray, mongodb } from 'genkitx-mongodb';
import { genkit } from 'genkit';
import { MONGODB_COLLECTION_NAME, MONGODB_DB_NAME, MONGODB_URL } from './config';


const ai = genkit({
  plugins: [
    googleAI(),
    mongodb([{
      url: MONGODB_URL,
      crudTools: { id: 'crud' }
    }])
  ]
});

async function main() {
  console.log("Testing MongoDB CRUD tools...");

  try {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt: `
      Using the available tools,
      For the following database: ${MONGODB_DB_NAME} and collection: ${MONGODB_COLLECTION_NAME}
      Please insert a new document with {"name": "John Doe", "email": "john.doe@example.com", "age": 50}.
      Now update the document with the inserted id to update: {$set: {age: 12}} using the available tool.
      With the id of the document, find the document by id and return the document.
      Also, Update a new document with the id as "686b48d887a2f1c12113a16d" to update: {$set: {name: "bob"}} and options: {upsert: true} using the available tool.
      Now delete the documents with those two ids
      `,
      // Please insert a new document with {"name": "John Doe", "email": "john.doe@example.com", "age": 50}.
      // Now update the document with the inserted id to update: {$set: {age: 12}} using the available tool.
      // With the insertedId, find the document by id and return the document.
      // Also update the document with the id as "686b48d887a2f1c12113a16d" to update: {$set: {name: "bob"}} and options: {upsert: true} using the available tool.
      // Now delete the documents with those two ids
      tools: [
        ...mongoCrudToolsRefArray('crud'),
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
