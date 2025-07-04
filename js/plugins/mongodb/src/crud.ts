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
import { z } from 'genkit';
import { Collection, ObjectId } from 'mongodb';
import { MONGODB_IDENTIFIER } from './constants';
import { retryWithBackoff } from './retry';


export function defineCRUDTools(ai: Genkit, collection: Collection) {
  const toolPrefix = MONGODB_IDENTIFIER(collection.dbName, collection.collectionName);

  // Create Document Tool
  ai.defineTool(
    {
      name: `${toolPrefix}/insertOne`,
      description: `Create a new document in the MongoDB collection ${collection.collectionName}`,
      inputSchema: z.object({
        document: z.object({}).passthrough().describe('The document data to insert'),
      }),
      outputSchema: z.object({
        insertedId: z.string().describe('The ID of the inserted document'),
        success: z.boolean().describe('Whether the operation was successful'),
        message: z.string().describe('Operation result message'),
      }),
    },
    async (input) => {
      console.log(`Creating document in collection ${collection.collectionName} with document: ${JSON.stringify(input)}`);

      try {
        const result = await retryWithBackoff(
          async () => {
            return await collection.insertOne(input.document);
          }
        );

        console.log(`Successfully created document with ID: ${result.insertedId}`);
        return {
          insertedId: result.insertedId.toString(),
          success: true,
          message: `Document created successfully with ID: ${result.insertedId}`,
        };
      } catch (error) {
        console.error('Error creating document:', error);
        return {
          insertedId: '',
          success: false,
          message: `Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );

  // Get Document by ID Tool
  ai.defineTool(
    {
      name: `${toolPrefix}/findById`,
      description: `Retrieve a document by its ID from the MongoDB collection ${collection.collectionName}`,
      inputSchema: z.object({
        id: z.string().describe('The document ID to retrieve'),
      }),
      outputSchema: z.object({
        document: z.record(z.any()).nullable().describe('The retrieved document or null if not found'),
        success: z.boolean().describe('Whether the operation was successful'),
        message: z.string().describe('Operation result message'),
      }),
    },
    async ({ id }) => {
      console.log(`Retrieving document with ID: ${id} from collection ${collection.collectionName}`);

      try {
        const result = await retryWithBackoff(
          async () => {
            return await collection.findOne({ _id: new ObjectId(id) });
          }
        );

        if (result) {
          console.log(`Successfully retrieved document with ID: ${id}`);
          return {
            document: result,
            success: true,
            message: `Document retrieved successfully`,
          };
        } else {
          console.log(`Document with ID ${id} not found`);
          return {
            document: null,
            success: true,
            message: `Document with ID ${id} not found`,
          };
        }
      } catch (error) {
        console.error('Error retrieving document:', error);
        return {
          document: null,
          success: false,
          message: `Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );

  // Update Document by ID Tool
  ai.defineTool(
    {
      name: `${toolPrefix}/updateOneById`,
      description: `Update a document by its ID in the MongoDB collection ${collection.collectionName}`,
      inputSchema: z.object({
        id: z.string().describe('The document ID to update'),
        update: z.object({}).passthrough().describe('The MongoDB update operations to apply (must use atomic operators like $set, $unset, $inc, etc.)'),
        // options: z.object({
        //   upsert: z.boolean().optional().describe('If true, create the document if it doesn\'t exist'),
        //   arrayFilters: z.array(z.record(z.any())).optional().describe('Array filters for array update operations'),
        // }).optional(),
      }),
      outputSchema: z.object({
        matchedCount: z.number().describe('Number of documents that matched the filter'),
        modifiedCount: z.number().describe('Number of documents that were modified'),
        upsertedId: z.string().nullable().describe('ID of the upserted document if upsert was true'),
        success: z.boolean().describe('Whether the operation was successful'),
        message: z.string().describe('Operation result message'),
      }),
    },
    async ({ id, update, }) => {// options }) => {
      console.log(`Updating document with ID: ${id} in collection ${collection.collectionName}`);

      try {
        const result = await retryWithBackoff(
          async () => {
            return await collection.updateOne(
              { _id: new ObjectId(id) },
              update,
              // options
            );
          }
        );

        console.log(`Update result - Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
        return {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          upsertedId: result.upsertedId?.toString() || null,
          success: true,
          message: `Update operation completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`,
        };
      } catch (error) {
        console.error('Error updating document:', error);
        return {
          matchedCount: 0,
          modifiedCount: 0,
          upsertedId: null,
          success: false,
          message: `Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );

  // Delete Document by ID Tool
  ai.defineTool(
    {
      name: `${toolPrefix}/deleteOneById`,
      description: `Delete a document by its ID from the MongoDB collection ${collection.collectionName}`,
      inputSchema: z.object({
        id: z.string().describe('The document ID to delete'),
      }),
      outputSchema: z.object({
        deletedCount: z.number().describe('Number of documents that were deleted'),
        success: z.boolean().describe('Whether the operation was successful'),
        message: z.string().describe('Operation result message'),
      }),
    },
    async ({ id }) => {
      console.log(`Deleting document with ID: ${id} from collection ${collection.collectionName}`);

      try {
        const result = await retryWithBackoff(
          async () => {
            return await collection.deleteOne({ _id: new ObjectId(id) });
          }
        );

        console.log(`Delete result - Deleted: ${result.deletedCount} documents`);
        return {
          deletedCount: result.deletedCount,
          success: true,
          message: `Delete operation completed. Deleted: ${result.deletedCount} document(s)`,
        };
      } catch (error) {
        console.error('Error deleting document:', error);
        return {
          deletedCount: 0,
          success: false,
          message: `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }
  );

  console.log(`CRUD tools defined for collection ${collection.collectionName}`);
}