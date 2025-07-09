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

export const CONTENT_FIELD = "content";
export const CONTENT_TYPE_FIELD = "content_type";
export const EMBEDDING_FIELD = "embedding";

export const DEFAULT_BATCH_SIZE = 100;

export const RETRY_ATTEMPTS = 0;
export const BASE_RETRY_DELAY_MS = 1000;
export const JITTER_FACTOR = 0.1;


export const MAX_NUM_CANDIDATES = 10000;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 1000;

export enum RETRIEVER_MODE {
  TEXT = "text",
  VECTOR = "vector",
  HYBRID = "hybrid"
}

export const mongoToolRef = (id: string) => `mongodb/${id}`;