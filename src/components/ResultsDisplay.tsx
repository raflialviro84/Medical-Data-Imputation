
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Database, FileSpreadsheet } from 'lucide-react';

interface ResultsDisplayProps {
  originalData: any[];
  imputedData: any[];
  statistics: {
    totalMissing: number;
    totalImputed: number;
    imputationRate: number;
    columns: Array<{
      name: string;
      missing: number;
      imputed: number;
      method: string;
    }>;
  };
  fileName: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  originalData, 
  imputedData, 
  statistics, 
  fileName 
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  const exportToExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      // Add original data sheet
      const originalWS = XLSX.utils.json_to_sheet(originalData);
      XLSX.utils.book_append_sheet(workbook, originalWS, 'Original Data');
      
      // Add imputed data sheet
      const imputedWS = XLSX.utils.json_to_sheet(imputedData);
      XLSX.utils.book_append_sheet(workbook, imputedWS, 'Imputed Data');
      
      // Add statistics sheet
      const statsWS = XLSX.utils.json_to_sheet(statistics.columns);
      XLSX.utils.book_append_sheet(workbook, statsWS, 'Statistics');
      
      XLSX.writeFile(workbook, `${fileName}_imputed.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const chartData = statistics.columns.map(col => ({
    name: col.name.length > 15 ? col.name.substring(0, 15) + '...' : col.name,
    missing: col.missing,
    imputed: col.imputed,
    fullName: col.name
  }));

  const methodData = statistics.columns.reduce((acc, col) => {
    const existing = acc.find(item => item.method === col.method);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ method: col.method, count: 1 });
    }
    return acc;
  }, [] as Array<{ method: string; count: number }>);

  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Imputation Results
            </CardTitle>
            <Button onClick={exportToExcel} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary">{statistics.totalImputed} values imputed</Badge>
            <Badge variant="secondary">{statistics.imputationRate.toFixed(1)}% completion rate</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="charts">Charts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total Records</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{originalData.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Values Imputed</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{statistics.totalImputed}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Completion Rate</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{statistics.imputationRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Column Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statistics.columns.map(column => (
                    <Card key={column.name}>
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm truncate" title={column.name}>
                          {column.name}
                        </h4>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Missing:</span>
                            <span className="text-red-600">{column.missing}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Imputed:</span>
                            <span className="text-green-600">{column.imputed}</span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {column.method}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Original Data (Sample)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(originalData[0] || {}).slice(0, 4).map(col => (
                              <TableHead key={col} className="text-xs">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {originalData.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              {Object.keys(originalData[0] || {}).slice(0, 4).map(col => {
                                const value = row[col];
                                const isEmpty = value === null || value === undefined || value === '' || value === 'N/A';
                                return (
                                  <TableCell key={col} className={`text-xs ${isEmpty ? 'text-red-500 italic' : ''}`}>
                                    {isEmpty ? 'Missing' : String(value)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Imputed Data (Sample)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(imputedData[0] || {}).slice(0, 4).map(col => (
                              <TableHead key={col} className="text-xs">{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {imputedData.slice(0, 5).map((row, index) => (
                            <TableRow key={index}>
                              {Object.keys(imputedData[0] || {}).slice(0, 4).map(col => {
                                const originalValue = originalData[index]?.[col];
                                const newValue = row[col];
                                const wasImputed = (originalValue === null || originalValue === undefined || originalValue === '' || originalValue === 'N/A') && newValue !== null && newValue !== undefined && newValue !== '';
                                
                                return (
                                  <TableCell key={col} className={`text-xs ${wasImputed ? 'text-green-600 font-medium' : ''}`}>
                                    {String(newValue)}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detailed Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Missing Values</TableHead>
                        <TableHead>Imputed Values</TableHead>
                        <TableHead>Imputation Method</TableHead>
                        <TableHead>Success Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statistics.columns.map(column => (
                        <TableRow key={column.name}>
                          <TableCell className="font-medium">{column.name}</TableCell>
                          <TableCell className="text-red-600">{column.missing}</TableCell>
                          <TableCell className="text-green-600">{column.imputed}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{column.method}</Badge>
                          </TableCell>
                          <TableCell>
                            {column.missing > 0 ? ((column.imputed / column.missing) * 100).toFixed(1) : '100.0'}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Missing vs Imputed by Column</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(label, payload) => {
                            const item = chartData.find(d => d.name === label);
                            return item?.fullName || label;
                          }}
                        />
                        <Bar dataKey="missing" fill="#ef4444" name="Missing" />
                        <Bar dataKey="imputed" fill="#22c55e" name="Imputed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Imputation Methods Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={methodData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ method, percent }) => `${method} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {methodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
