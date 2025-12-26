import { useRef, useState, useCallback } from 'react';
import { RichTextEditor, RichTextEditorRef } from '@/components/editor/RichTextEditor';
import { EditorActions } from '@/components/editor/EditorActions';
import { useWebhookProcessor } from '@/hooks/useWebhookProcessor';
import { useWordImport } from '@/hooks/useWordImport';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://rasp.nthang91.io.vn/webhook/translate-formal';

const Index = () => {
  const editorRef = useRef<RichTextEditorRef>(null);
  const [wordCount, setWordCount] = useState(0);
  const { toast } = useToast();

  const {
    isProcessing,
    progress,
    currentChunk,
    totalChunks,
    processText,
  } = useWebhookProcessor();

  const { isImporting, importWordFile } = useWordImport();

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      setWordCount(editorRef.current.getWordCount());
    }
  }, []);

  const handleImportFile = useCallback(async (file: File) => {
    try {
      const html = await importWordFile(file);
      editorRef.current?.setContent(html);
      toast({
        title: 'Import thành công',
        description: `Đã import file ${file.name}`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi import',
        description: error instanceof Error ? error.message : 'Không thể import file',
        variant: 'destructive',
      });
    }
  }, [importWordFile, toast]);

  const handleProcess = useCallback(async () => {
    if (!editorRef.current) return;

    const text = editorRef.current.getText();
    
    if (!text.trim()) {
      toast({
        title: 'Không có nội dung',
        description: 'Vui lòng nhập hoặc import nội dung để xử lý',
        variant: 'destructive',
      });
      return;
    }

    try {
      const processedText = await processText(WEBHOOK_URL, text);
      
      // Replace content with processed result.
      // `processText` always returns HTML (either from webhook or formatted from plain text).
      editorRef.current.setContent(processedText);
      
      toast({
        title: 'Xử lý hoàn tất',
        description: 'Nội dung đã được cập nhật',
      });
    } catch (error) {
      toast({
        title: 'Lỗi xử lý',
        description: error instanceof Error ? error.message : 'Không thể xử lý văn bản',
        variant: 'destructive',
      });
    }
  }, [processText, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            Text Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trình soạn thảo văn bản với tích hợp n8n webhook
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        <EditorActions
          wordCount={wordCount}
          onImportFile={handleImportFile}
          onProcess={handleProcess}
          isProcessing={isProcessing}
          isImporting={isImporting}
          progress={progress}
          currentChunk={currentChunk}
          totalChunks={totalChunks}
        />

        <RichTextEditor
          ref={editorRef}
          onChange={handleContentChange}
        />
      </main>
    </div>
  );
};

export default Index;
