# content_generation

## AI generation setup

Content and code generation use OpenRouter when `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` are configured. OpenRouter is OpenAI-compatible and the backend sends requests to its chat completions endpoint. Copy `backend/.env.example` to `backend/.env`, add your credentials, and restart the backend:

```powershell
Copy-Item backend/.env.example backend/.env
npm --prefix backend run dev
```

To use OpenAI directly instead, configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The backend keeps the API key server-side. Without a configured provider key, generation returns a clearly labeled demo response instead of an AI-generated result.

The Generator accepts up to five attachments (10 MB per file, 20 MB total): images (JPEG, PNG, WEBP, GIF), PDF, Word/PowerPoint/Excel and OpenDocument files, RTF, EPUB, CSV, Markdown, HTML, plain text, JSON, XML, and common source files. Images are sent as visual inputs, so choose a vision-capable model. Documents are parsed to text before being sent as reference context. Unsupported or unreadable files are rejected with an explanation.