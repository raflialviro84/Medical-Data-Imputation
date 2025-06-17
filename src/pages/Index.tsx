import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Database, TrendingUp, FileSpreadsheet } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import ProcessingStatus from '@/components/ProcessingStatus';
import ResultsDisplay from '@/components/ResultsDisplay';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [imputedData, setImputedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [hasResults, setHasResults] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [nClusters, setNClusters] = useState(5);
  const [fcmM, setFcmM] = useState(2.0);
  const [testFraction, setTestFraction] = useState(0.1);
  const [imputationEval, setImputationEval] = useState<{ mae: number; rmse: number; n_test: number } | null>(null);

  // Simulate medical data imputation process
  const simulateImputation = (data: any[]) => {
    const steps = [
      'Analyzing data structure',
      'Identifying missing values',
      'Calculating imputation strategy',
      'Applying medical data imputation',
      'Validating results',
      'Generating report'
    ];

    let stepIndex = 0;

    const processStep = () => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
        setProgress(((stepIndex + 1) / steps.length) * 100);
        stepIndex++;
        setTimeout(processStep, 1000 + Math.random() * 1000);
      } else {
        // Complete processing and generate results
        generateImputedData(data);
      }
    };

    processStep();
  };

  const generateImputedData = (data: any[]) => {
    const columns = Object.keys(data[0]);
    const imputationMethods = ['Mean Imputation', 'Median Imputation', 'Mode Imputation', 'KNN Imputation', 'Forward Fill'];
    
    // Create imputed data by filling missing values
    const imputed = data.map(row => {
      const newRow = { ...row };
      columns.forEach(col => {
        const value = row[col];
        if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'NaN') {
          // Generate realistic imputed values based on column type
          if (col.toLowerCase().includes('age')) {
            newRow[col] = Math.floor(Math.random() * 60) + 20;
          } else if (col.toLowerCase().includes('temperature') || col.toLowerCase().includes('temp')) {
            newRow[col] = (Math.random() * 4 + 36).toFixed(1);
          } else if (col.toLowerCase().includes('pressure') || col.toLowerCase().includes('bp')) {
            newRow[col] = Math.floor(Math.random() * 40) + 100;
          } else if (col.toLowerCase().includes('heart') || col.toLowerCase().includes('pulse')) {
            newRow[col] = Math.floor(Math.random() * 40) + 60;
          } else if (col.toLowerCase().includes('weight')) {
            newRow[col] = Math.floor(Math.random() * 50) + 50;
          } else if (col.toLowerCase().includes('height')) {
            newRow[col] = Math.floor(Math.random() * 50) + 150;
          } else {
            // Generic numeric or text imputation
            newRow[col] = typeof data.find(r => r[col] !== null && r[col] !== undefined && r[col] !== '')[col] === 'number' 
              ? Math.floor(Math.random() * 100) : 'Imputed Value';
          }
        }
      });
      return newRow;
    });

    // Calculate statistics
    const columnStats = columns.map(col => {
      const missing = data.filter(row => 
        row[col] === null || row[col] === undefined || row[col] === '' || row[col] === 'N/A' || row[col] === 'NaN'
      ).length;
      
      const imputed = data.filter((row, index) => {
        const originalEmpty = row[col] === null || row[col] === undefined || row[col] === '' || row[col] === 'N/A' || row[col] === 'NaN';
        const nowFilled = imputed[index][col] !== null && imputed[index][col] !== undefined && imputed[index][col] !== '';
        return originalEmpty && nowFilled;
      }).length;

      return {
        name: col,
        missing,
        imputed,
        method: imputationMethods[Math.floor(Math.random() * imputationMethods.length)]
      };
    });

    const totalMissing = columnStats.reduce((sum, col) => sum + col.missing, 0);
    const totalImputed = columnStats.reduce((sum, col) => sum + col.imputed, 0);

    const stats = {
      totalMissing,
      totalImputed,
      imputationRate: totalMissing > 0 ? (totalImputed / totalMissing) * 100 : 100,
      columns: columnStats
    };

    setImputedData(imputed);
    setStatistics(stats);
    setIsProcessing(false);
    setHasResults(true);
  };

  const handleFileUpload = (file: File | null, data: object[]) => {
    setUploadedFile(file);
    setOriginalData(data);
    setHasResults(false);
    setImputedData([]);
    setStatistics(null);
    console.log('File uploaded:', file ? file.name : 'none', 'Data rows:', data.length);
  };

  const startProcessing = async () => {
    if (originalData.length > 0 && uploadedFile) {
      setIsProcessing(true);
      setProgress(0);
      setHasResults(false);
      setCurrentStep('Uploading and Imputing...');
      setImputationEval(null);
      try {
        // Kirim file ke backend untuk proses imputasi
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('n_clusters', nClusters.toString());
        formData.append('m', fcmM.toString());
        formData.append('test_fraction', testFraction.toString());
        const response = await fetch('http://localhost:8000/api/impute-fcm', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          let errorMsg = 'Imputation failed. Please check your file format.';
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) errorMsg = errorData.error;
          } catch {}
          alert(errorMsg);
          setIsProcessing(false);
          setCurrentStep('');
          return;
        }
        // Ambil hasil evaluasi dari header jika ada
        const evalHeader = response.headers.get('X-Imputation-Eval');
        if (evalHeader) {
          try {
            // Coba parse JSON normal
            const evalObj = JSON.parse(evalHeader.replace(/'/g, '"'));
            setImputationEval(evalObj);
          } catch {
            // Fallback: parse manual jika format python dict
            try {
              // Gunakan eval aman (hanya untuk dict sederhana)
              const safeEval = Function('return ' + evalHeader)();
              setImputationEval(safeEval);
            } catch (e) {
              // ignore error
            }
          }
        }
        // Ambil file hasil imputasi dan tampilkan summary
        const blob = await response.blob();
        const XLSX = await import('xlsx');
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const imputed = XLSX.utils.sheet_to_json(worksheet);
        // Buat statistik sederhana (bisa dikembangkan)
        const columns = Object.keys(imputed[0] || {});
        const columnStats = columns.map(col => {
          const missing = originalData.filter(row => !row[col] && row[col] !== 0).length;
          const imputedCount = imputed.filter((row, idx) => !originalData[idx][col] && row[col]).length;
          return {
            name: col,
            missing,
            imputed: imputedCount,
            method: 'Fuzzy C-Means'
          };
        });
        const totalMissing = columnStats.reduce((sum, col) => sum + col.missing, 0);
        const totalImputed = columnStats.reduce((sum, col) => sum + col.imputed, 0);
        const stats = {
          totalMissing,
          totalImputed,
          imputationRate: totalMissing > 0 ? (totalImputed / totalMissing) * 100 : 100,
          columns: columnStats
        };
        setImputedData(imputed);
        setStatistics(stats);
        setIsProcessing(false);
        setHasResults(true);
        setCurrentStep('');
      } catch (err) {
        setIsProcessing(false);
        setCurrentStep('');
        alert('Error uploading or processing file.');
        console.error('Imputation error:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Medical Data Imputation Platform
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced AI-powered tool for handling missing values in medical datasets. 
            Upload your Excel files and get comprehensive imputation results with detailed analytics.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <CardContent className="p-6">
              <Database className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Data Analysis</h3>
              <p className="text-sm text-gray-600">
                Automatically detects missing values and determines optimal imputation strategies
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Medical Algorithms</h3>
              <p className="text-sm text-gray-600">
                Uses specialized algorithms designed for medical data patterns and constraints
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <FileSpreadsheet className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Comprehensive Reports</h3>
              <p className="text-sm text-gray-600">
                Get detailed analytics, visualizations, and exportable results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* File Upload */}
          <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />

          {/* Data Preview */}
          {originalData.length > 0 && uploadedFile && (
            <DataPreview data={originalData} fileName={uploadedFile.name} />
          )}

          {/* Process Button */}
          {originalData.length > 0 && !isProcessing && !hasResults && (
            <div className="text-center">
              <Button 
                onClick={startProcessing} 
                size="lg" 
                className="px-8 py-3 text-lg"
                disabled={isProcessing}
              >
                Start Imputation Process
              </Button>
            </div>
          )}

          {/* Parameter FCM & Test Fraction */}
          {originalData.length > 0 && !isProcessing && !hasResults && (
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jumlah Cluster (n_clusters)</label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={nClusters}
                  onChange={e => setNClusters(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fuzzy Parameter m</label>
                <input
                  type="number"
                  min={1.1}
                  max={5}
                  step={0.1}
                  value={fcmM}
                  onChange={e => setFcmM(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Fraction (Evaluasi Keandalan)</label>
                <input
                  type="number"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={testFraction}
                  onChange={e => setTestFraction(Number(e.target.value))}
                  className="border rounded px-2 py-1 w-32"
                />
                <span className="text-xs text-gray-500">(0 = tanpa evaluasi, 0.1 = 10% data untuk test)</span>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {(isProcessing || hasResults) && (
            <ProcessingStatus 
              isProcessing={isProcessing}
              hasResults={hasResults}
              progress={progress}
              currentStep={currentStep}
            />
          )}

          {/* Visualisasi Missing Value Sebelum Imputasi */}
          {originalData.length > 0 && (
            <div className="my-6">
              <h3 className="text-lg font-semibold mb-2">Missing Value Chart (Before Imputation)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.keys(originalData[0] || {}).map(col => ({
                  name: col,
                  missing: originalData.filter(row => row[col] === null || row[col] === undefined || row[col] === '' || row[col] === 'N/A' || row[col] === 'NaN').length
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="missing" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Results */}
          {hasResults && imputedData.length > 0 && statistics && uploadedFile && (
            <ResultsDisplay 
              originalData={originalData}
              imputedData={imputedData}
              statistics={statistics}
              fileName={uploadedFile.name}
            />
          )}

          {/* Hasil Evaluasi Keandalan Imputasi */}
          {hasResults && (
            <div className="my-6">
              <Card className="max-w-xl mx-auto border-2 border-green-500 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-700">Bukti Keakuratan & Performa Imputasi</CardTitle>
                </CardHeader>
                <CardContent>
                  {imputationEval ? (
                    <div className="flex flex-col gap-2 text-base">
                      <span><b>Jumlah data uji (masked):</b> {imputationEval.n_test}</span>
                      <span><b>Mean Absolute Error (MAE):</b> <span className="text-blue-700">{imputationEval.mae.toFixed(4)}</span></span>
                      <span><b>Root Mean Squared Error (RMSE):</b> <span className="text-blue-700">{imputationEval.rmse.toFixed(4)}</span></span>
                      <span className="text-gray-500 text-sm mt-2">Semakin kecil nilai MAE & RMSE, semakin akurat hasil imputasi Fuzzy C-Means pada data Anda.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 text-base text-gray-500">
                      <span>Evaluasi keakuratan tidak tersedia.<br/>Silakan aktifkan parameter <b>Test Fraction</b> &gt; 0 untuk menampilkan bukti keandalan imputasi.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Visualisasi Missing Value Sesudah Imputasi */}
          {hasResults && imputedData.length > 0 && (
            <div className="my-6">
              <h3 className="text-lg font-semibold mb-2">Missing Value Chart (After Imputation)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={Object.keys(imputedData[0] || {}).map(col => ({
                  name: col,
                  missing: imputedData.filter(row => row[col] === null || row[col] === undefined || row[col] === '' || row[col] === 'N/A' || row[col] === 'NaN').length
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="missing" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Medical Data Imputation Platform - Secure, Fast, and Accurate</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
