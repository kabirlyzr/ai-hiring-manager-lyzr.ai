import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PDFViewerProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, isOpen, onClose }) => {
  const [url, setUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setUrl(fileUrl);
      return () => URL.revokeObjectURL(fileUrl);
    }
  }, [file]);

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Resume Preview</DialogTitle>
        </DialogHeader>
        <div className="mt-2 h-full">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};