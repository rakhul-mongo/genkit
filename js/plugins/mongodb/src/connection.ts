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

import { MongoClient } from 'mongodb';
import { MongoOptions, MongoConnection } from './validation';

export async function createMongoConnection(options: MongoOptions): Promise<MongoConnection> {
  try {
    const client = new MongoClient(options.url, options.mongoClientOptions);
    await client.connect();

    const db = client.db(options.dbName, options.dbOptions);
    const collection = db.collection(options.collectionName, options.collectionOptions);

    return { client, db, collection };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create MongoDB connection: ${errorMessage}`);
  }
}

async function closeMongoConnection(connection: MongoConnection): Promise<void> {
  try {
    await connection.client.close();
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}

export async function cleanupConnections(connections: MongoConnection[]): Promise<void> {
  if (!connections || connections.length === 0) {
    return;
  }

  const closePromises = connections.map(connection => closeMongoConnection(connection));

  try {
    await Promise.allSettled(closePromises);
  } catch (error) {
    console.error('Error during connection cleanup:', error);
  }
}