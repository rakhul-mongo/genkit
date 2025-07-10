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

import { z } from 'genkit';

export const MenuItemSchema = z.object({
  title: z.string().describe('The name of the menu item'),
  description: z
    .string()
    .describe('Details including ingredients and preparation'),
  price: z.number().describe('Price in dollars'),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

export const QuestionInputSchema = z.object({
  question: z.string(),
});

export const AnswerOutputSchema = z.object({
  answer: z.string(),
});

export const DataMenuQuestionInputSchema = z.object({
  menuData: z.array(MenuItemSchema),
  question: z.string(),
});

export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type AnswerOutput = z.infer<typeof AnswerOutputSchema>;
export type DataMenuPromptInput = z.infer<typeof DataMenuQuestionInputSchema>;
