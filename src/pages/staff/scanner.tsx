import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, Loader2, Keyboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ScanResult {
  ok: boolean;
  result?: string;
  event?: string;
  attendee?: string;
  seat?: string;
  section?: string;
  error?: string;
}

export default function StaffScanner() {
  const [manualToken, setManualToken] = useState('');
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [gateName, setGateName] = useState('Gate A');
  const inputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('validate_ticket_scan', {
        p_qr_token: token,
        p_gate_name: gateName,
        p_device_info: navigator.userAgent,
      });
      if (error) throw error;
      return data as ScanResult;
    },
    onSuccess: (data) => {
      setLastResult(data);
      if (data.ok && data.result === 'valid') {
        toast.success(`Valid ticket — ${data.attendee} · ${data.seat}`);
      } else if (data.result === 'already_used') {
        toast.error('Ticket already used');
      } else {
        toast.error(data.error ?? data.result ?? 'Invalid');
      }
      setManualToken('');
      inputRef.current?.focus();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : 'Scan failed');
    },
  });

  const handleScan = (token: string) => {
    if (!token.trim()) return;
    scanMutation.mutate(token.trim());
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
            <ScanLine className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Ticket Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Scan or enter a ticket QR token.</p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium">Gate</label>
          <select
            value={gateName}
            onChange={(e) => setGateName(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {['Gate A', 'Gate B', 'Gate C', 'VIP Entry'].map((g) => (
              <option key={g} value={g} className="bg-card">{g}</option>
            ))}
          </select>
        </div>

        <Card className="bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Keyboard className="h-4 w-4" /> Manual entry
          </div>
          <Input
            ref={inputRef}
            placeholder="Paste QR token or ticket number"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan(manualToken)}
            className="mb-3"
            autoFocus
          />
          <Button
            className="w-full gradient-primary"
            onClick={() => handleScan(manualToken)}
            disabled={!manualToken.trim() || scanMutation.isPending}
          >
            {scanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
            Validate ticket
          </Button>
        </Card>

        {lastResult && (
          <Card className={`mt-4 p-6 ${
            lastResult.result === 'valid' ? 'border-emerald-500/40 bg-emerald-500/5' :
            lastResult.result === 'already_used' ? 'border-amber-500/40 bg-amber-500/5' :
            'border-destructive/40 bg-destructive/5'
          }`}>
            <div className="flex items-start gap-3">
              {lastResult.result === 'valid' ? (
                <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-emerald-400" />
              ) : lastResult.result === 'already_used' ? (
                <AlertTriangle className="h-8 w-8 flex-shrink-0 text-amber-400" />
              ) : (
                <XCircle className="h-8 w-8 flex-shrink-0 text-destructive" />
              )}
              <div>
                <p className="text-lg font-bold capitalize">{lastResult.result ?? 'Error'}</p>
                {lastResult.event && <p className="text-sm text-muted-foreground">{lastResult.event}</p>}
                {lastResult.attendee && <p className="text-sm font-medium">{lastResult.attendee}</p>}
                {lastResult.seat && (
                  <div className="mt-2 flex gap-2">
                    <Badge variant="secondary">Seat {lastResult.seat}</Badge>
                    {lastResult.section && <Badge variant="outline">{lastResult.section}</Badge>}
                  </div>
                )}
                {lastResult.error && <p className="mt-1 text-xs text-destructive">{lastResult.error}</p>}
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo ticket token</p>
          <p className="mt-1 font-mono">demo-qr-token-0000000000000000000000000000000000000000000001</p>
          <p className="mt-1">Paste this to test a valid scan. Scanning it twice shows "already_used".</p>
        </div>
      </div>
    </div>
  );
}
