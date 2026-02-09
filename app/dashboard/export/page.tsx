'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { exportTransactionsAsCSV, exportDataAsJSON, downloadFile } from '@/lib/export';

export default function ExportPage() {
  const { transactions, categories, tags, goals, currency } = useStore();
  const [csvLoading, setCSVLoading] = useState(false);
  const [jsonLoading, setJSONLoading] = useState(false);

  const handleExportCSV = async () => {
    setCSVLoading(true);
    try {
      const csvContent = exportTransactionsAsCSV(transactions, categories, currency);
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(csvContent, `finsulium-transactions-${timestamp}.csv`, 'text/csv');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV');
    } finally {
      setCSVLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setJSONLoading(true);
    try {
      const jsonContent = exportDataAsJSON({
        transactions,
        categories,
        tags,
        goals,
        currency,
        exportDate: new Date().toISOString(),
      });
      const timestamp = new Date().toISOString().split('T')[0];
      downloadFile(jsonContent, `finsulium-export-${timestamp}.json`, 'application/json');
    } catch (error) {
      console.error('Failed to export JSON:', error);
      alert('Failed to export JSON');
    } finally {
      setJSONLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Export Data</h1>
        <p className="text-muted-foreground mt-1">
          Download your financial data - you own it!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileJson className="w-5 h-5 mr-2" />
              Export as JSON
            </CardTitle>
            <CardDescription>
              Complete data export including all metadata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Perfect for backups and data migration. Includes all transactions,
              categories, tags, goals, and settings.
            </p>
            <Button onClick={handleExportJSON} disabled={jsonLoading || transactions.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {jsonLoading ? 'Exporting...' : 'Download JSON'}
            </Button>
            {transactions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                No transactions to export
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Export as CSV
            </CardTitle>
            <CardDescription>
              Spreadsheet-friendly format for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Opens in Excel, Google Sheets, or any spreadsheet software.
              Great for custom analysis and reporting.
            </p>
            <Button onClick={handleExportCSV} disabled={csvLoading || transactions.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              {csvLoading ? 'Exporting...' : 'Download CSV'}
            </Button>
            {transactions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                No transactions to export
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Encryption Notice</CardTitle>
          <CardDescription>
            Your data security information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            ℹ️ Exported data is automatically decrypted for readability in
            spreadsheets and backups. Your data remains encrypted in the database
            when encryption is enabled. Keep your encryption key safe - you&apos;ll
            need it to access encrypted data in the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
