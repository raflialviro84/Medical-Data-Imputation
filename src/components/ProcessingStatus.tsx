
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Settings } from 'lucide-react';

interface ProcessingStatusProps {
  isProcessing: boolean;
  hasResults: boolean;
  progress: number;
  currentStep: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  isProcessing, 
  hasResults, 
  progress, 
  currentStep 
}) => {
  const getStatusIcon = () => {
    if (isProcessing) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (hasResults) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <Settings className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing';
    if (hasResults) return 'Completed';
    return 'Ready';
  };

  const getStatusVariant = () => {
    if (isProcessing) return 'secondary';
    if (hasResults) return 'default';
    return 'outline';
  };

  const processingSteps = [
    'Analyzing data structure',
    'Identifying missing values',
    'Calculating imputation strategy',
    'Applying medical data imputation',
    'Validating results',
    'Generating report'
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {getStatusIcon()}
            Processing Status
          </span>
          <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isProcessing && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Current Step:</p>
                <p className="text-sm text-muted-foreground">{currentStep}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Processing Steps:</p>
                <div className="space-y-1">
                  {processingSteps.map((step, index) => {
                    const stepProgress = (progress / 100) * processingSteps.length;
                    const isCompleted = index < stepProgress;
                    const isCurrent = index === Math.floor(stepProgress);
                    
                    return (
                      <div key={step} className="flex items-center gap-2 text-sm">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted" />
                        )}
                        <span className={isCompleted ? 'text-green-600' : isCurrent ? 'text-primary' : 'text-muted-foreground'}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {hasResults && !isProcessing && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Data imputation completed successfully</span>
            </div>
          )}

          {!isProcessing && !hasResults && (
            <div className="text-center py-4 text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Upload a file to begin processing</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
