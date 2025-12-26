import { useState, useCallback } from 'react';
import mammoth from 'mammoth';

interface ImportState {
  isImporting: boolean;
  error: string | null;
}

export function useWordImport() {
  const [state, setState] = useState<ImportState>({
    isImporting: false,
    error: null,
  });

  const importWordFile = useCallback(async (file: File): Promise<string> => {
    if (!file.name.endsWith('.docx')) {
      throw new Error('Chỉ hỗ trợ file .docx');
    }

    setState({ isImporting: true, error: null });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      setState({ isImporting: false, error: null });
      
      if (result.messages.length > 0) {
        console.warn('Word import warnings:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi import file';
      setState({ isImporting: false, error: errorMessage });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isImporting: false, error: null });
  }, []);

  return {
    ...state,
    importWordFile,
    reset,
  };
}
