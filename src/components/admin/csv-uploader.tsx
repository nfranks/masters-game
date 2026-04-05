'use client';

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Group, Golfer } from '@/lib/types';

interface Props {
  tournamentId: string;
  groups: Group[];
  initialGolfers: (Golfer & { group: { name: string } | null })[];
}

export function CsvUploader({ tournamentId, groups, initialGolfers }: Props) {
  const [golfers, setGolfers] = useState(initialGolfers);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setPreview(result.data as Record<string, string>[]);
      },
    });
  };

  const handleUpload = async () => {
    if (!preview?.length) return;
    setUploading(true);
    try {
      const res = await fetch('/api/golfers/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournamentId, golfers: preview }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success(`Imported ${result.imported} golfers`);
      if (result.errors?.length) {
        toast.warning(`${result.errors.length} warnings: ${result.errors.join(', ')}`);
      }
      setPreview(null);
      // Reload page to show updated list
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Golfer CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            CSV should have columns: <code className="bg-gray-100 px-1 rounded">Name, Group, Rank, Age Range, Region, Rookie, Amateur</code>
          </p>
          <div className="flex gap-4">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> Select CSV File
            </Button>
            {preview && (
              <Button onClick={handleUpload} disabled={uploading} className="bg-green-700 hover:bg-green-800">
                <Check className="w-4 h-4 mr-2" />
                {uploading ? 'Importing...' : `Import ${preview.length} Golfers`}
              </Button>
            )}
          </div>

          {preview && (
            <div className="max-h-64 overflow-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(preview[0] ?? {}).map((col) => (
                      <TableHead key={col} className="text-xs">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {Object.values(row).map((val, j) => (
                        <TableCell key={j} className="text-xs">{val}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.length > 10 && (
                <p className="text-xs text-gray-400 p-2 text-center">
                  ...and {preview.length - 10} more rows
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {golfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Golfers ({golfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {golfers.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{g.group?.name ?? '?'}</Badge>
                      </TableCell>
                      <TableCell>{g.world_ranking ?? '-'}</TableCell>
                      <TableCell>{g.region ?? '-'}</TableCell>
                      <TableCell>{g.age_category ?? '-'}</TableCell>
                      <TableCell className="space-x-1">
                        {g.is_rookie && <Badge className="bg-blue-100 text-blue-800">Rookie</Badge>}
                        {g.is_amateur && <Badge className="bg-purple-100 text-purple-800">Amateur</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
