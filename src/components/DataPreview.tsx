
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Database } from 'lucide-react';

interface DataPreviewProps {
  data: any[];
  fileName: string;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, fileName }) => {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const previewRows = data.slice(0, 5);
  
  const getMissingValueCount = (column: string) => {
    return data.filter(row => 
      row[column] === null || 
      row[column] === undefined || 
      row[column] === '' || 
      row[column] === 'N/A' ||
      row[column] === 'NaN'
    ).length;
  };

  const totalRows = data.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Data Preview
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            {fileName}
          </span>
          <Badge variant="secondary">{totalRows} rows</Badge>
          <Badge variant="secondary">{columns.length} columns</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {columns.slice(0, 8).map(column => {
              const missingCount = getMissingValueCount(column);
              const missingPercentage = ((missingCount / totalRows) * 100).toFixed(1);
              
              return (
                <div key={column} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm truncate" title={column}>
                    {column}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {missingCount > 0 ? (
                      <span className="text-orange-600">
                        {missingCount} missing ({missingPercentage}%)
                      </span>
                    ) : (
                      <span className="text-green-600">Complete</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(column => (
                    <TableHead key={column} className="font-medium">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map(column => {
                      const value = row[column];
                      const isEmpty = value === null || value === undefined || value === '' || value === 'N/A' || value === 'NaN';
                      
                      return (
                        <TableCell key={column} className={isEmpty ? 'text-muted-foreground italic' : ''}>
                          {isEmpty ? 'Missing' : String(value)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {data.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing first 5 rows of {totalRows} total rows
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataPreview;
