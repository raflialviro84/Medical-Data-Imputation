import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileUpload: (file: File | null, data: any[]) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const selectedFile = files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      setError('Please upload an Excel or CSV file (.xlsx, .xls, .csv)');
      return;
    }

    setError('');
    setFile(selectedFile);

    try {
      let jsonData: object[] = [];
      if (selectedFile.name.endsWith('.csv')) {
        const text = await selectedFile.text();
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        const XLSX = await import('xlsx');
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      }

      if (jsonData.length === 0) {
        setError('The uploaded file appears to be empty');
        return;
      }

      onFileUpload(selectedFile, jsonData);
    } catch (err) {
      setError('Error reading file. Please ensure it\'s a valid Excel or CSV file.');
      console.error('File reading error:', err);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  // Fungsi untuk menghapus file dan reset state parent
  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    onFileUpload(null, []);
    // Reset input file agar bisa upload file dengan nama sama
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Medical Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        {file && (
          <div className="flex items-center justify-between bg-gray-50 border rounded-md px-4 py-2 mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-800">{file.name}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleRemoveFile}>
                Delete File
              </Button>
              <Button size="sm" variant="secondary" onClick={handleRemoveFile}>
                Change File
              </Button>
            </div>
          </div>
        )}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${isProcessing || file ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing || !!file}
          />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            Drop your Excel or CSV file here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Supports .xlsx, .xls, and .csv files
          </p>
          <Button variant="outline" disabled={isProcessing || !!file}>
            {isProcessing ? 'Processing...' : 'Select File'}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
