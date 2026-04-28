# Muninn

<p align="center">
  <img src="src/logo/muninn-mark.png" alt="Muninn logo" width="128" />
</p>

Muninn is a memory-backed RAG assistant for portfolio sites. It answers from a bundled corpus, streams responses from Groq, and returns citation metadata so every answer can point back to its source.

Named after Odin's raven of memory, Muninn is designed to be small, cheap to run, and easy to deploy.

## Features

- Build-time MiniLM embeddings with `@xenova/transformers`
- Bundled JSON vector index, no hosted vector database
- Groq `llama-3.3-70b-versatile` streaming responses
- Citation chips via the `x-muninn-citations` response header
- Optional Upstash Redis rate limiting
- Next.js App Router API route at `/api/muninn`

## Tech Stack

- Next.js 16
- React 19
- Vercel AI SDK
- Groq
- MiniLM local embeddings
- Upstash Ratelimit, optional

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run build:muninn
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required:

```bash
GROQ_API_KEY=
```

Optional:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

If Upstash variables are missing, Muninn still runs locally and skips rate limiting.

## Corpus

Muninn's memory lives in `data/corpus.json`.

After editing the corpus, rebuild the index:

```bash
npm run build:muninn
```

This writes `data/muninn-index.json`, which is imported directly by the runtime route. The app does not need a database or a vector-store service.

## API

`POST /api/muninn`

Request:

```json
{
  "messages": [
    { "role": "user", "content": "Explain Muninn's RAG architecture." }
  ]
}
```

Response:

- Body: plain text stream
- Header: `x-muninn-citations`, URL-encoded JSON citation metadata

## Scripts

```bash
npm run dev           # start local dev server
npm run build:muninn  # rebuild vector index
npm run build         # build index, then build Next app
npm run start         # start production server
npm run lint          # run ESLint
```

## Deployment

1. Push this folder as its own repository.
2. Add `GROQ_API_KEY` to the deployment environment.
3. Optionally add Upstash Redis REST credentials.
4. Deploy with the default Next.js build command: `npm run build`.

## License

MIT
# Muninn

Muninn is a RAG-backed portfolio assistant. It answers questions from a bundled memory index, streams responses from Groq, and returns citation metadata with each answer.


## Stack

- Next.js App Router
- Groq `llama-3.3-70b-versatile`
- Local MiniLM embeddings via `@xenova/transformers`
- JSON vector index in `data/muninn-index.json`
- Optional Upstash rate limiting

## Setup

```bash
npm install
cp .env.example .env.local
npm run build:muninn
npm run dev
```

Required:

```bash
GROQ_API_KEY=
```

Optional:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Corpus

Edit `data/corpus.json`, then run:

```bash
npm run build:muninn
```

The build script embeds each corpus item and writes `data/muninn-index.json`. The runtime route imports that JSON directly, so deploys do not need a vector database.

## API

`POST /api/muninn`

```json
{
  "messages": [
    { "role": "user", "content": "What can you tell me about Param's open-source work?" }
  ]
}
```

The response body is a plain text stream. Citation chips are returned in the `x-muninn-citations` response header.
