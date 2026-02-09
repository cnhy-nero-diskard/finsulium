'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function GoalsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Financial Goals</h1>
        <p className="text-muted-foreground mt-1">
          Set and track your financial objectives
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Construction className="w-5 h-5 mr-2" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            Goal tracking features are in development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This section will include:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Create savings goals with target amounts and dates</li>
            <li>Track progress towards each goal</li>
            <li>Visualize goal completion percentages</li>
            <li>Set milestone reminders</li>
            <li>What-If Forecasting scenarios</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
