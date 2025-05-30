
import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  title: string;
  description: string;
  acceptedTypes: string;
  onFileUpload: (file: File) => void;
  uploadedFile: File | null;
}

const FileUploadZone = ({ 
  title, 
  description, 
  acceptedTypes, 
  onFileUpload, 
  uploadedFile 
}: FileUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (acceptedTypes.includes(fileExtension)) {
        onFileUpload(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: `Please upload a ${acceptedTypes} file.`,
          variant: "destructive",
        });
      }
    }
  }, [acceptedTypes, onFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleRemoveFile = () => {
    // Reset the input value
    const input = document.getElementById(`file-${title}`) as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <Card className={`border-2 border-dashed transition-colors ${
      isDragOver 
        ? 'border-blue-400 bg-blue-50' 
        : uploadedFile 
          ? 'border-green-400 bg-green-50' 
          : 'border-gray-300 hover:border-gray-400'
    }`}>
      <CardContent className="p-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="text-center"
        >
          <div className="mb-4">
            {uploadedFile ? (
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            ) : (
              <Upload className={`h-12 w-12 mx-auto ${
                isDragOver ? 'text-blue-600' : 'text-gray-400'
              }`} />
            )}
          </div>

          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>

          {uploadedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-green-700 bg-green-100 rounded-lg p-3">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{uploadedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-6 w-6 p-0 text-green-700 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                File uploaded successfully. You can replace it by selecting a new file.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Accepted formats: {acceptedTypes}
              </p>
            </div>
          )}

          <input
            id={`file-${title}`}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant={uploadedFile ? "outline" : "default"}
            className="mt-4"
            onClick={() => document.getElementById(`file-${title}`)?.click()}
          >
            {uploadedFile ? 'Replace File' : 'Select File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadZone;
