import { useState, useCallback } from 'react';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
  error: string | null;
}

interface ChunkInfo {
  text: string;
  startIndex: number;
  endIndex: number;
}

const MAX_WORDS_PER_CHUNK = 300;

// Check if text contains HTML tags
function containsHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text);
}

// Convert plain text to HTML with proper paragraph formatting
function formatPlainTextToHtml(text: string): string {
  // If already contains HTML, return as-is
  if (containsHtml(text)) {
    return text;
  }
  
  // Split by double newlines or single newlines for paragraphs
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // Wrap each paragraph in <p> tags, preserving single line breaks within paragraphs
  return paragraphs
    .map(p => {
      // Replace single newlines with <br> within paragraphs
      const withLineBreaks = p.replace(/\n/g, '<br>');
      return `<p>${withLineBreaks}</p>`;
    })
    .join('');
}

function splitTextIntoChunks(text: string): ChunkInfo[] {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const chunks: ChunkInfo[] = [];
  
  let currentIndex = 0;
  for (let i = 0; i < words.length; i += MAX_WORDS_PER_CHUNK) {
    const chunkWords = words.slice(i, i + MAX_WORDS_PER_CHUNK);
    const chunkText = chunkWords.join(' ');
    chunks.push({
      text: chunkText,
      startIndex: currentIndex,
      endIndex: currentIndex + chunkText.length,
    });
    currentIndex += chunkText.length + 1; // +1 for space
  }
  
  return chunks;
}

async function sendToWebhook(webhookUrl: string, text: string): Promise<string> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Support various response formats
  if (typeof data === 'string') {
    return data;
  }
  if (data.paraphrased) {
    return data.paraphrased;
  }
  if (data.text) {
    return data.text;
  }
  if (data.result) {
    return data.result;
  }
  if (data.output) {
    return data.output;
  }
  if (data.processed) {
    return data.processed;
  }
  
  // If response is an object, try to get any string value
  const values = Object.values(data);
  const stringValue = values.find(v => typeof v === 'string');
  if (stringValue) {
    return stringValue as string;
  }
  
  throw new Error('Invalid response format from webhook');
}

export function useWebhookProcessor() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    error: null,
  });

  const processText = useCallback(async (
    webhookUrl: string,
    text: string,
    onChunkProcessed?: (processedText: string, chunkIndex: number) => void
  ): Promise<string> => {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    const chunks = splitTextIntoChunks(text);
    
    if (chunks.length === 0) {
      return '';
    }

    setState({
      isProcessing: true,
      progress: 0,
      currentChunk: 0,
      totalChunks: chunks.length,
      error: null,
    });

    const processedChunks: string[] = [];

    try {
      for (let i = 0; i < chunks.length; i++) {
        setState(prev => ({
          ...prev,
          currentChunk: i + 1,
          progress: Math.round(((i) / chunks.length) * 100),
        }));

        const processedText = await sendToWebhook(webhookUrl, chunks[i].text);
        processedChunks.push(processedText);
        
        onChunkProcessed?.(processedText, i);

        setState(prev => ({
          ...prev,
          progress: Math.round(((i + 1) / chunks.length) * 100),
        }));
      }

      setState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100,
      }));

      // Auto-format plain text response to HTML paragraphs
      const combinedText = processedChunks.join('\n\n');
      return formatPlainTextToHtml(combinedText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      currentChunk: 0,
      totalChunks: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    processText,
    reset,
  };
}
