# API Keys Setup

This application requires API keys for AI-powered features. Follow these steps to configure your environment:

## Required API Keys

### 1. Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Add it to your `.env` file as `VITE_API_KEY` and `VITE_GEMINI_API_KEY`

### 2. Hugging Face API Key (Optional - for fallback AI service)
1. Visit [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Sign in or create an account
3. Click "New token"
4. Give it a name and select "read" permissions
5. Copy the token
6. Add it to your `.env` file as `VITE_HUGGING_FACE_API_KEY`

## Setup Instructions

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace the placeholder values with your actual API keys:
   ```env
   VITE_API_KEY=your_actual_google_gemini_api_key_here
   VITE_GEMINI_API_KEY=your_actual_google_gemini_api_key_here
   VITE_HUGGING_FACE_API_KEY=your_actual_hugging_face_api_key_here
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

## Security Notes

- **Never commit your `.env` file to version control** - it's already included in `.gitignore`
- Keep your API keys secure and don't share them publicly
- For production, use environment-specific configuration methods
- You can regenerate API keys if they're compromised

## Features Enabled by API Keys

- **Google Gemini**: AI-powered medical record summaries and insights
- **Hugging Face**: Backup AI service when Gemini is unavailable
- Both services help with:
  - Medical history summarization
  - Drug interaction analysis
  - Treatment insights
  - Health monitoring suggestions

## Troubleshooting

If AI features aren't working:
1. Check that your API keys are correctly set in `.env`
2. Ensure you have sufficient quota/API credits
3. Check the browser console for error messages
4. Verify your internet connection

## Free Tier Limits

Both services offer free tiers with usage limits:
- **Google Gemini**: Generous free tier for development
- **Hugging Face**: Limited inference API calls per month

For production use, consider upgrading to paid plans.