import { DashboardLayout } from "@/components/DashboardLayout";
import { useIngestChatMessage, useMessages, useDeleteMessage, useDeleteAllMessages } from "@/hooks/use-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { User, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Messages() {
  const { data: messages, isLoading, dataUpdatedAt, refetch } = useMessages();
  const ingestChat = useIngestChatMessage();
  const deleteMessage = useDeleteMessage();
  const deleteAllMessages = useDeleteAllMessages();
  const [form, setForm] = useState({
    channel: 'whatsapp' as 'whatsapp' | 'telegram' | 'other',
    senderRole: 'customer' as 'customer' | 'admin',
    businessAccount: 'bizora-fashion',
    from: '+919999999999',
    message: 'I order 5 saree',
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    ingestChat.mutate(form);
  };

  const getMeta = (parsedData: unknown) => {
    if (!parsedData || typeof parsedData !== 'object') return { channel: '-', businessAccount: '-', senderRole: '-' };
    const record = parsedData as { channel?: string; businessAccount?: string; senderRole?: string };
    return {
      channel: record.channel || '-',
      businessAccount: record.businessAccount || '-',
      senderRole: record.senderRole || '-',
    };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Message Log</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground">
            <p>Raw incoming WhatsApp messages and parsing results.</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>
                Live refresh • {dataUpdatedAt ? `Updated ${format(new Date(dataUpdatedAt), 'HH:mm:ss')}` : 'Waiting for data'}
              </span>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Simulate Chat Ingest</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <select
                  id="channel"
                  value={form.channel}
                  onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value as 'whatsapp' | 'telegram' | 'other' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAccount">Business Account</Label>
                <Input
                  id="businessAccount"
                  value={form.businessAccount}
                  onChange={(event) => setForm((prev) => ({ ...prev, businessAccount: event.target.value }))}
                  placeholder="your-business-handle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderRole">Sender Role</Label>
                <select
                  id="senderRole"
                  value={form.senderRole}
                  onChange={(event) => setForm((prev) => ({ ...prev, senderRole: event.target.value as 'customer' | 'admin' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from">Customer Number</Label>
                <Input
                  id="from"
                  value={form.from}
                  onChange={(event) => setForm((prev) => ({ ...prev, from: event.target.value }))}
                  placeholder="+91..."
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  placeholder="I order 5 saree"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" disabled={ingestChat.isPending}>
                  {ingestChat.isPending ? 'Ingesting...' : 'Ingest Message'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Incoming Stream</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteAllMessages.mutate()}
                disabled={deleteAllMessages.isPending || !messages?.length}
              >
                {deleteAllMessages.isPending ? 'Clearing...' : 'Clear All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No messages received.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Business Account</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead className="max-w-[300px]">Message Body</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Order Created</TableHead>
                    <TableHead>Received At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages?.map((msg) => {
                    const meta = getMeta(msg.parsedData);
                    return (
                      <TableRow key={msg.id}>
                        <TableCell>
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{meta.channel}</TableCell>
                        <TableCell className="text-sm">{meta.businessAccount}</TableCell>
                        <TableCell className="font-mono text-sm">{msg.fromNumber}</TableCell>
                        <TableCell className="capitalize">{meta.senderRole}</TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate" title={msg.messageBody}>{msg.messageBody}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full max-w-[80px] h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  msg.confidenceScore > 0.8 ? "bg-emerald-500" : 
                                  msg.confidenceScore > 0.5 ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ width: `${(msg.confidenceScore || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((msg.confidenceScore || 0) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {msg.isOrderCreated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
                              No
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, HH:mm') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMessage.mutate(msg.id)}
                            disabled={deleteMessage.isPending}
                            title="Delete message"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
