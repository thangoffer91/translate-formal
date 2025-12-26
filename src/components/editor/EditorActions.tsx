import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Send } from 'lucide-react';
import { useRef } from 'react';

interface EditorActionsProps {
  wordCount: number;
  onImportFile: (file: File) => void;
  onProcess: () => void;
  isProcessing: boolean;
  isImporting: boolean;
  progress: number;
  currentChunk: number;
  totalChunks: number;
}

export const EditorActions = ({
  wordCount,
  onImportFile,
  onProcess,
  isProcessing,
  isImporting,
  progress,
  currentChunk,
  totalChunks,
}: EditorActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-4">
      {/* Top actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-4">
          {/* Import button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".docx"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting || isProcessing}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Đang import...' : 'Import Word'}
          </Button>

        </div>

        <div className="flex items-center gap-4">
          {/* Word count */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{wordCount}</span> từ
          </div>

          {/* Process button */}
          <Button
            onClick={onProcess}
            disabled={isProcessing || wordCount === 0}
            className="min-w-[120px]"
          >
            <Send className="h-4 w-4 mr-2" />
            {isProcessing ? 'Đang xử lý...' : 'Xử lý'}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {isProcessing && (
        <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex justify-between text-sm">
            <span className="text-foreground">
              Đang xử lý phần {currentChunk}/{totalChunks}
            </span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
};
