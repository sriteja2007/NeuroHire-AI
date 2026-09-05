"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", applications: 4 },
  { name: "Tue", applications: 7 },
  { name: "Wed", applications: 2 },
  { name: "Thu", applications: 9 },
  { name: "Fri", applications: 5 },
  { name: "Sat", applications: 1 },
  { name: "Sun", applications: 3 },
];

export function DashboardChart() {
  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
          />
          <Tooltip 
            cursor={{ fill: "hsl(var(--muted)/0.5)" }}
            contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} 
          />
          <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
