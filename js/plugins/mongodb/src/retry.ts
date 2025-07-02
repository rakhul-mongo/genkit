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

import { BASE_RETRY_DELAY_MS, MAX_RETRY_DELAY_MS, JITTER_FACTOR, RETRY_ATTEMPTS } from './constants';

function calculateBackoffDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    jitterFactor: number
  ): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, maxDelay);
    const jitterRange = cappedDelay * jitterFactor;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;

    return Math.max(0, cappedDelay + jitter);
  }

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retryAttempts: number = RETRY_ATTEMPTS,
  baseDelay: number = BASE_RETRY_DELAY_MS,
  maxDelay: number = MAX_RETRY_DELAY_MS,
  jitterFactor: number = JITTER_FACTOR
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === retryAttempts) {
        throw lastError;
      }
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay, jitterFactor);
      console.warn(`Attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError!;
}
