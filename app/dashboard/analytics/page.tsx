'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Visualize your spending patterns and trends
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Construction className="w-5 h-5 mr-2" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Analytics features are in development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Where It Went - Spending by category pie charts</li>
            <li>Mood Monitor - Emotional spending patterns</li>
            <li>Tag Deep Dive - Custom tag analysis</li>
            <li>Net Worth Tracker - Income vs expenses over time</li>
            <li>Trend Analysis - Monthly and yearly comparisons</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
