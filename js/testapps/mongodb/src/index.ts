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

// Export all of the example prompts and flows

// menu
export { menuIndexerFlow } from './menu/core/core-flows.js';
export { menuRetrieveTextFlow } from './menu/core/core-flows.js';
export { menuRetrieveVectorFlow } from './menu/core/core-flows.js';
export { menuPrompt } from './menu/core/core-prompts.js';

// crud
export { conversationalCRUDFlow } from './menu/crud/crud-flows.js';
export { crudPrompt } from './menu/crud/crud-prompts.js';

// search index
export { conversationalSearchIndexFlow } from './menu/search-index/search-index-flows.js';
export { searchIndexPrompt } from './menu/search-index/search-index-prompts.js';