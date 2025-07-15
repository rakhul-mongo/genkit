# MongoDB Plugin Test Application

This test application demonstrates the comprehensive capabilities of the MongoDB plugin for Genkit, showcasing vector search, text search, CRUD operations, search index management, and multimodal document processing.

## Features Demonstrated

- **Vector Search**: Semantic search using embeddings with MongoDB's vector search capabilities
- **Text Search**: Full-text search with fuzzy matching and synonyms support
- **CRUD Operations**: Create, read, update, and delete documents by ID
- **Search Index Management**: Create, list, and drop search indexes
- **Multimodal Processing**: Image indexing and retrieval using multimodal embeddings
- **Menu Understanding**: Restaurant menu analysis with both vector and text search
- **Batch Indexing**: Efficient document indexing with configurable batch sizes

## Prerequisites

- **Node.js** (version 18 or higher)
- **MongoDB** (6.0+ with Atlas Search or local search indexes)
- **Google Cloud Project** with Vertex AI enabled
- **Google AI API** access for embeddings

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=your_database_name
MONGODB_COLLECTION_NAME=your_collection_name
MONGODB_MEDIA_COLLECTION_NAME=your_media_collection
MONGODB_IMAGE_COLLECTION_NAME=your_image_collection

# Google Cloud Configuration
PROJECT_ID=your_google_cloud_project_id
LOCATION=us-central1
```

## Installation

```bash
pnpm install
```

## Running the Application

### Development Mode

```bash
pnpm run dev
```

### Start with Genkit UI

```bash
pnpm run start
```

This will start the Genkit UI where you can interact with all the flows and prompts.

## Application Structure

### Core Features

#### 1. Menu Understanding (`src/core/menu/`)

Demonstrates restaurant menu analysis with multiple search strategies:

- **Menu Indexer Flow**: Indexes menu items with embeddings for semantic search
- **Vector Search Flow**: Finds relevant menu items using semantic similarity
- **Text Search Flow**: Performs full-text search with fuzzy matching

**Example Usage:**
```typescript
// Index menu items
await ai.runFlow('Menu - Indexer Flow', menuItems);

// Search by semantic similarity
await ai.runFlow('Menu - Retrieve Vector Flow', { question: "What vegetarian options do you have?" });

// Search by text matching
await ai.runFlow('Menu - Retrieve Text Flow', { question: "Show me items with chicken" });
```

#### 2. Image Processing (`src/core/image/`)

Demonstrates multimodal document processing with image embeddings:

- **Image Indexer Flow**: Indexes images with multimodal embeddings using Vertex AI's multimodalEmbedding001
- **Image Retriever Flow**: Finds similar images using vector search with cosine similarity

**Example Usage:**
```typescript
// Index an image with description
await ai.runFlow('Image - Indexer Flow', {
  name: 'cat',
  description: 'A fluffy orange cat sitting on a windowsill'
});

// Find similar images by providing an image name
await ai.runFlow('Image - Retrieve Flow', { name: 'cat' });
```

**Key Features:**
- Uses multimodal embeddings for image understanding
- Supports image similarity search
- Configurable field names for image data and metadata
- Optional data storage with `skipData` option

### Tool Management

#### 3. CRUD Operations (`src/crud/`)

Demonstrates basic database operations by document ID:

- **CRUD Management Flow**: Handles create, read, update, and delete operations

**Available Tools:**
- `mongodb/crud/create` - Create new documents
- `mongodb/crud/read` - Read documents by ID
- `mongodb/crud/update` - Update documents by ID
- `mongodb/crud/delete` - Delete documents by ID

#### 4. Search Index Management (`src/search-index/`)

Demonstrates search index administration:

- **Search Index Management Flow**: Manages search indexes

**Available Tools:**
- `mongodb/search-index/create` - Create new search indexes
- `mongodb/search-index/list` - List existing indexes
- `mongodb/search-index/drop` - Drop search indexes

## Configuration

### MongoDB Plugin Setup

The application configures the MongoDB plugin with:

```typescript
mongodb([{
  url: MONGODB_URL,
  indexer: { id: 'indexer' },
  retriever: { id: 'retriever' },
  crudTools: { id: 'crudTools' },
  searchIndexTools: { id: 'searchIndexTools' },
}])
```

### AI Models Used

- **Google AI**: `gemini-2.5-flash` for text generation
- **Google AI**: `text-embedding-004` for text embeddings
- **Vertex AI**: `multimodalEmbedding001` for image embeddings

## Example Workflows

### 1. Menu Analysis Workflow

1. **Index Menu Items**: Use the Menu Indexer Flow to add menu items to the database
2. **Semantic Search**: Use Vector Search Flow to find items based on meaning
3. **Text Search**: Use Text Search Flow for exact text matching with fuzzy search

### 2. Image Search Workflow

1. **Index Images**: Use Image Indexer Flow to add images with descriptions and generate multimodal embeddings
2. **Find Similar Images**: Use Image Retriever Flow to find visually similar images using vector search
3. **Image Processing**: Demonstrates multimodal embeddings for image similarity search with configurable field names
4. **Metadata Management**: Store and retrieve image metadata for enhanced search capabilities

### 3. Database Management Workflow

1. **Create Documents**: Use CRUD tools to add new documents
2. **Query Documents**: Use CRUD tools to retrieve documents by ID
3. **Update Documents**: Use CRUD tools to modify existing documents
4. **Delete Documents**: Use CRUD tools to remove documents

### 4. Search Index Workflow

1. **Create Indexes**: Use search index tools to create text and vector search indexes
2. **List Indexes**: Use search index tools to view existing indexes
3. **Manage Indexes**: Use search index tools to drop indexes when needed

## Testing

### Using Example Data

Each flow includes example JSON files that you can use as inputs in the Genkit UI:

- `src/core/menu/examples/` - Sample menu items
- `src/core/image/examples/` - Sample image data
- `src/crud/examples/` - Sample CRUD operations
- `src/search-index/examples/` - Sample index configurations

### Interactive Testing

1. Start the application with `pnpm run start`
2. Open the Genkit UI in your browser
3. Navigate to the Flows section
4. Select any flow and use the example data or provide your own inputs
5. View the results and examine the MongoDB collections

## Database Schema

### Menu Collection
```typescript
{
  item: number[],           // Vector embedding
  data: string,             // Menu item text
  dataType: string,         // Document type
  metadata: MenuItem,       // Menu item metadata
  createdAt: Date           // Indexing timestamp
}
```

### Image Collection
```typescript
{
  image: number[],          // Multimodal embedding
  imageType: string,        // Document type
  imageMetadata: object,    // Image metadata
  createdAt: Date           // Indexing timestamp
}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Search Indexes**: Verify that search indexes are created before using search features
3. **Environment Variables**: Check that all required environment variables are set
4. **Google Cloud**: Ensure proper authentication and API access

### Search Index Requirements

For text search, create a search index on the `data` field:
```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "data": {
        "type": "string",
        "analyzer": "lucene.english"
      }
    }
  }
}
```

For vector search, create a search index on the embedding field:
```json
{
  "mappings": {
    "dynamic": true,
    "fields": {
      "item": {
        "type": "vector",
        "dimensions": 768,
        "similarity": "cosine"
      }
    }
  }
}
```

## License

Apache 2.0

This test application demonstrates the capabilities of the MongoDB plugin for Genkit. For more information about the plugin, see the [plugin documentation](../plugins/mongodb/README.md).