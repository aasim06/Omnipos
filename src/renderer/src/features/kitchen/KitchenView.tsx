import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Badge,
  Body1,
  Body2,
  Caption1,
  Text,
  Subtitle1,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input,
  Select,
  Label,
  TabList,
  Tab,
  TabValue,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Clock24Regular,
  Food24Filled,
  Timer24Regular,
  BowlSalad24Regular,
  Add20Regular,
  Delete16Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { KitchenPageSkeleton } from '@/components/skeletons/PageSkeletons';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';

/* ── Zod Validation Schema for Manual KDS Ticket ── */
const rushTicketSchema = z.object({
  customerName: z.string().min(2, 'Customer / Table name is required (min 2 chars)'),
  orderType: z.string().min(1, 'Order type is required'),
  itemName: z.string().min(2, 'Item name is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
});

type RushTicketFormValues = z.infer<typeof rushTicketSchema>;

const useStyles = makeStyles({
  container: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  ticketGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '18px',
  },
  ticketCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
  ticketHeader: {
    padding: '14px 18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  itemList: {
    padding: '16px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 10px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
  },
  cardFooter: {
    padding: '12px 18px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    gap: '12px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '14px',
  },
  errorMessage: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '12px',
    fontWeight: 500,
  },
});

interface KitchenTicket {
  id: string;
  orderId: string;
  status: 'pending' | 'cooking' | 'ready' | 'served';
  orderType?: string;
  createdAt: string;
  order?: {
    lines: Array<{
      id?: string;
      name: string;
      quantity: number;
      variantLabel?: string;
      notes?: string;
    }>;
  };
}

export function KitchenView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form for Manual KOT / Rush Ticket
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RushTicketFormValues>({
    resolver: zodResolver(rushTicketSchema) as any,
    defaultValues: {
      customerName: '',
      orderType: 'Dine-In',
      itemName: '',
      quantity: 1,
      notes: '',
    },
  });

  // Query tickets with live 4-second auto-refresh
  const { data: tickets = [], isLoading } = useQuery<KitchenTicket[]>({
    queryKey: ['kitchen-tickets'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/kitchen/tickets`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 4000,
  });

  // Mutation: Update status (Pending -> Cooking -> Ready -> Served)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/kitchen/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
    },
  });

  // Mutation: Create manual rush ticket (POST)
  const createTicketMutation = useMutation({
    mutationFn: async (data: RushTicketFormValues) => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/kitchen/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
      setIsDialogOpen(false);
      reset();
    },
  });

  // Mutation: Cancel / Delete Ticket (DELETE)
  const deleteTicketMutation = useMutation({
    mutationFn: async (id: string) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/kitchen/tickets/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
    },
  });

  const onSubmit = (data: RushTicketFormValues) => {
    createTicketMutation.mutate(data);
  };

  // Filter tickets by tab
  const filteredTickets = tickets.filter((t) => {
    if (activeTab === 'all') return true;
    return t.status === activeTab;
  });

  if (isLoading && tickets.length === 0) {
    return <KitchenPageSkeleton />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Kitchen Display System (KDS)
          </Subtitle1>
          <Text
            as="p"
            size={200}
            style={{ color: tokens.colorNeutralForeground2, marginTop: '4px', marginBottom: 0, display: 'block', fontSize: '13px' }}
          >
            Chef order queue — auto-synced live with POS counter &amp; online orders
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge appearance="tint" color="brand" size="large" icon={<Timer24Regular />}>
            {tickets.length} Active Order{tickets.length !== 1 ? 's' : ''}
          </Badge>

          {/* Manual Rush Ticket Dialog Trigger */}
          <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<Add20Regular />}>
                + Manual Rush Ticket
              </Button>
            </DialogTrigger>
            <DialogSurface style={{ maxWidth: '460px' }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogBody>
                  <DialogTitle style={{ fontWeight: 700 }}>Add Manual Rush Order Ticket</DialogTitle>
                  <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    <div className={styles.formGroup}>
                      <Label required htmlFor="customerName" style={{ fontWeight: 600 }}>Customer / Table Name</Label>
                      <Input id="customerName" {...register('customerName')} placeholder="e.g. Table 4 / Phone Order" />
                      {errors.customerName && <span className={styles.errorMessage}>{errors.customerName.message}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <Label required htmlFor="orderType" style={{ fontWeight: 600 }}>Order Type</Label>
                      <Select id="orderType" {...register('orderType')}>
                        <option value="Dine-In">Dine-In</option>
                        <option value="Takeaway">Takeaway</option>
                        <option value="Delivery">Delivery</option>
                        <option value="VIP Rush">VIP Rush</option>
                      </Select>
                      {errors.orderType && <span className={styles.errorMessage}>{errors.orderType.message}</span>}
                    </div>

                    <ProductAutocomplete
                      id="itemName"
                      label="Food Item Name"
                      required
                      filterModule="fastfood"
                      value={watch('itemName') || ''}
                      onChange={(val) => setValue('itemName', val, { shouldValidate: true })}
                      placeholder="Search or select food (e.g. Zinger, Burger, Fries)..."
                      error={errors.itemName?.message}
                    />

                    <div className={styles.formGroup}>
                      <Label required htmlFor="quantity" style={{ fontWeight: 600 }}>Quantity</Label>
                      <Input id="quantity" type="number" min={1} {...register('quantity')} />
                      {errors.quantity && <span className={styles.errorMessage}>{errors.quantity.message}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <Label htmlFor="notes" style={{ fontWeight: 600 }}>Kitchen Preparation Notes</Label>
                      <Input id="notes" {...register('notes')} placeholder="e.g. No mayo, make it spicy" />
                    </div>
                  </DialogContent>

                  <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Button
                      appearance="subtle"
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      style={{
                        borderRadius: '8px',
                        fontWeight: 600,
                        padding: '8px 18px',
                        border: `1px solid ${tokens.colorNeutralStroke1}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      appearance="primary"
                      type="submit"
                      disabled={createTicketMutation.isPending}
                      style={{
                        backgroundColor: '#E51937',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        fontWeight: 700,
                        padding: '9px 22px',
                        minWidth: '140px',
                        whiteSpace: 'nowrap',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
                      }}
                    >
                      {createTicketMutation.isPending ? 'Sending...' : 'Send to Kitchen'}
                    </Button>
                  </DialogActions>
                </DialogBody>
              </form>
            </DialogSurface>
          </Dialog>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className={styles.filterBar}>
        <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value)}>
          <Tab value="all">All Active ({tickets.length})</Tab>
          <Tab value="pending">Pending ({tickets.filter((t) => t.status === 'pending').length})</Tab>
          <Tab value="cooking">Cooking ({tickets.filter((t) => t.status === 'cooking').length})</Tab>
          <Tab value="ready">Ready for Pickup ({tickets.filter((t) => t.status === 'ready').length})</Tab>
        </TabList>
      </div>

      {/* ── Ticket Grid or Empty State ── */}
      {filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          <BowlSalad24Regular style={{ width: 56, height: 56, opacity: 0.35, color: tokens.colorNeutralForeground3 }} />
          <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground2, display: 'block', fontSize: '16px' }}>
            Kitchen Queue is Clear
          </Body1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
            No tickets under &quot;{String(activeTab).toUpperCase()}&quot;. New orders from POS counter will appear here automatically.
          </Caption1>
        </div>
      ) : (
        <div className={styles.ticketGrid}>
          {filteredTickets.map((ticket, idx) => {
            const isCooking = ticket.status === 'cooking';
            const isReady = ticket.status === 'ready';

            // Calculate elapsed minutes
            const elapsedMins = Math.max(0, Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 60000));

            return (
              <div key={ticket.id} className={styles.ticketCard}>
                {/* Card Header: icon badge + number + status */}
                <div
                  className={styles.ticketHeader}
                  style={{
                    backgroundColor: isReady ? 'rgba(16, 124, 65, 0.08)' : isCooking ? 'rgba(245, 158, 11, 0.08)' : tokens.colorNeutralBackground1,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Body1 style={{ fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
                        Ticket #{String(idx + 1).padStart(3, '0')}
                      </Body1>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: elapsedMins > 15 ? '#EF4444' : elapsedMins > 8 ? '#F59E0B' : '#10B981',
                        }}
                      >
                        ⏱ {elapsedMins}m ago
                      </span>
                    </div>
                    <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {ticket.orderType ? ` · ${ticket.orderType}` : ' · Dine-In'}
                    </Caption1>
                  </div>

                  <Badge
                    appearance="tint"
                    color={isReady ? 'success' : isCooking ? 'warning' : 'informative'}
                    size="medium"
                  >
                    {ticket.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Item List */}
                <div className={styles.itemList}>
                  {(ticket.order?.lines || []).map((line, lIdx) => (
                    <div key={line.id || lIdx} className={styles.itemRow}>
                      <div>
                        <Body2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>
                          {line.name}
                        </Body2>
                        {line.variantLabel && (
                          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                            {line.variantLabel}
                          </Caption1>
                        )}
                        {line.notes && (
                          <Caption1 style={{ color: '#D97706', fontStyle: 'italic', display: 'block', fontSize: '12px' }}>
                            Chef Note: {line.notes}
                          </Caption1>
                        )}
                      </div>
                      <Badge appearance="filled" color="brand" size="large">
                        ×{line.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Card Footer: actions */}
                <div className={styles.cardFooter}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Delete16Regular />}
                      title="Cancel / Delete Ticket"
                      onClick={() => deleteTicketMutation.mutate(ticket.id)}
                    />
                    <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
                      Ref: #{ticket.orderId?.slice(-6) || '—'}
                    </Caption1>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {ticket.status === 'pending' && (
                      <Button
                        appearance="primary"
                        size="small"
                        icon={<Clock24Regular />}
                        style={{ backgroundColor: '#E51937', borderRadius: '6px' }}
                        onClick={() => updateStatusMutation.mutate({ id: ticket.id, status: 'cooking' })}
                      >
                        Start Cooking
                      </Button>
                    )}

                    {ticket.status === 'cooking' && (
                      <Button
                        appearance="primary"
                        size="small"
                        style={{ backgroundColor: '#107C41', borderColor: '#107C41', borderRadius: '6px' }}
                        icon={<CheckmarkCircle24Filled />}
                        onClick={() => updateStatusMutation.mutate({ id: ticket.id, status: 'ready' })}
                      >
                        Mark Ready
                      </Button>
                    )}

                    {ticket.status === 'ready' && (
                      <Button
                        appearance="outline"
                        size="small"
                        style={{ borderRadius: '6px' }}
                        onClick={() => updateStatusMutation.mutate({ id: ticket.id, status: 'served' })}
                      >
                        Mark Served
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
