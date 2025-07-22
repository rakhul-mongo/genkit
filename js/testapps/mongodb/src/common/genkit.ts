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
import { vertexAI } from '@genkit-ai/vertexai';
import { genkit } from 'genkit';
import { mongodb } from 'genkitx-mongodb';
import { LOCATION, MONGO_MCP_URL, MONGODB_URL } from './config';
import { createMcpHost } from '@genkit-ai/mcp';

export const ai = genkit({
  plugins: [
    googleAI(),
    vertexAI({
      location: LOCATION,
    }),
    mongodb([
      {
        url: MONGODB_URL,
        indexer: { id: 'indexer' },
        retriever: { id: 'retriever' },
        crudTools: { id: 'crudTools' },
        searchIndexTools: { id: 'searchIndexTools' },
      },
    ]),
  ],
});

export const GEMINI_MODEL = googleAI.model('gemini-2.5-flash');

export const MONGO_MCP_HOST = createMcpHost({
  name: 'mcp-host',
  mcpServers: {
    "MongoDB": {
      "command": "npx",
      "args": [
        "-y",
        "mongodb-mcp-server",
        "--connectionString",
        MONGO_MCP_URL,
      ]
    }
  }
});

export const MONGO_TOOLS = async () => {
  return await MONGO_MCP_HOST.getActiveTools(ai);
};