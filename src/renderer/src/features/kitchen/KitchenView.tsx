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
  Print16Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { offlineDb } from '@/lib/offlineDb';
import { printKitchenKot } from '@/lib/kotPrinter';
import { KitchenPageSkeleton } from '@/components/skeletons/PageSkeletons';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { CustomInput, CustomSelect } from '@/components/ui';

/* ── Zod Validation Schema for Manual KDS Ticket with Multiple Items ── */
const rushTicketLineSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  variantLabel: z.string().optional(),
  notes: z.string().optional(),
});

const rushTicketSchema = z.object({
  customerName: z.string().min(2, 'Customer / Table name is required (min 2 chars)'),
  orderType: z.string().min(1, 'Order type is required'),
  lines: z.array(rushTicketLineSchema).min(1, 'At least 1 food item is required'),
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
  activeOrdersChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    paddingTop: '6px',
    paddingBottom: '6px',
    paddingLeft: '14px',
    paddingRight: '14px',
    borderRadius: '9999px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow2,
    userSelect: 'none',
    boxSizing: 'border-box',
    height: '36px',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  chipDotActive: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#E51937',
    boxShadow: '0 0 8px rgba(229, 25, 55, 0.8)',
    animationName: {
      '0%': { transform: 'scale(0.95)', opacity: '0.8' },
      '50%': { transform: 'scale(1.2)', opacity: '1' },
      '100%': { transform: 'scale(0.95)', opacity: '0.8' },
    },
    animationDuration: '2s',
    animationIterationCount: 'infinite',
    flexShrink: 0,
  },
  chipDotClear: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
    flexShrink: 0,
  },
  chipCount: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: '13px',
  },
  chipLabel: {
    color: tokens.colorNeutralForeground2,
    fontSize: '13px',
    fontWeight: 500,
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

  // Form for Manual KOT / Rush Ticket with Multi-Item support
  const {
    register,
    control,
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
      lines: [
        { id: `item_${Date.now()}`, name: '', quantity: 1, notes: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  // Query tickets with live 4-second auto-refresh
  const { data: tickets = [], isLoading } = useQuery<KitchenTicket[]>({
    queryKey: ['kitchen-tickets'],
    queryFn: async () => {
      try {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          const base = await resolveApiUrl();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(`${base}/api/kitchen/tickets`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const remote = await res.json();
            if (Array.isArray(remote)) {
              try {
                localStorage.setItem('cached_kitchen_tickets', JSON.stringify(remote));
              } catch {}
              return remote;
            }
          }
        }
      } catch {
        /* Offline: proceed with local cached tickets or Dexie orders */
      }

      // Offline fallback 1: load from cached tickets
      try {
        const cached = localStorage.getItem('cached_kitchen_tickets');
        if (cached) return JSON.parse(cached);
      } catch {}

      // Offline fallback 2: load from local FastFood orders in Dexie
      try {
        const localOrders = await offlineDb.orders.where('module').equals('fastfood').reverse().limit(25).toArray();
        if (localOrders && localOrders.length > 0) {
          return localOrders.map((o) => ({
            id: o.id,
            orderId: o.id,
            orderType: o.orderType || 'dine-in',
            status: 'pending',
            createdAt: o.createdAt,
            order: {
              id: o.id,
              lines: (o.lines || []).map((l: any) => ({
                id: l.productId || l.id,
                name: l.name,
                quantity: l.quantity,
                notes: l.notes || '',
                variantLabel: l.variantLabel || '',
              })),
            },
          })) as any;
        }
      } catch {}

      return [];
    },
    // When server is offline or fails, back off to 30s instead of spamming every 4s
    refetchInterval: (query) => {
      if (query.state.error) return 30000;
      return 4000;
    },
    refetchIntervalInBackground: false,
    retry: 1,
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
        body: JSON.stringify({
          customerName: data.customerName,
          orderType: data.orderType,
          lines: data.lines.map((l, idx) => ({
            id: l.id || `line_${Date.now()}_${idx}`,
            name: l.name,
            quantity: Number(l.quantity) || 1,
            variantLabel: l.variantLabel || '',
            notes: l.notes || '',
          })),
          // Fallback legacy fields for single-item endpoints
          itemName: data.lines[0]?.name || 'Manual Item',
          quantity: Number(data.lines[0]?.quantity) || 1,
          notes: data.lines[0]?.notes || '',
        }),
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
      setIsDialogOpen(false);
      reset({
        customerName: '',
        orderType: 'Dine-In',
        lines: [{ id: `item_${Date.now()}`, name: '', quantity: 1, notes: '' }],
      });
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
          <div className={styles.activeOrdersChip}>
            <span className={tickets.length > 0 ? styles.chipDotActive : styles.chipDotClear} />
            <Timer24Regular
              style={{
                fontSize: '18px',
                width: '18px',
                height: '18px',
                color: tickets.length > 0 ? '#E51937' : tokens.colorNeutralForeground2,
              }}
            />
            <span className={styles.chipCount}>{tickets.length}</span>
            <span className={styles.chipLabel}>Active Order{tickets.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Manual Rush Ticket Dialog Trigger */}
          <Dialog open={isDialogOpen} onOpenChange={(_, data) => setIsDialogOpen(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<Add20Regular />}>
                Manual Rush Ticket
              </Button>
            </DialogTrigger>
            <DialogSurface style={{ maxWidth: '580px', width: '94vw', padding: '24px', borderRadius: '16px' }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogBody>
                  <DialogTitle style={{ fontWeight: 800, fontSize: '20px', margin: 0, paddingBottom: '12px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                    Add Manual Rush Order Ticket
                  </DialogTitle>
                  <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                    
                    {/* Top Row: Customer Name & Order Type */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
                      <CustomInput
                        id="customerName"
                        label="Customer / Table Name"
                        required
                        placeholder="e.g. Table 4 / Phone Order"
                        {...register('customerName')}
                        error={errors.customerName?.message}
                      />

                      <CustomSelect
                        label="Order Type"
                        required
                        value={watch('orderType') || 'Dine-In'}
                        onChange={(val) => setValue('orderType', val as any, { shouldValidate: true })}
                        options={[
                          { value: 'Dine-In', label: 'Dine-In' },
                          { value: 'Takeaway', label: 'Takeaway' },
                          { value: 'Delivery', label: 'Delivery' },
                          { value: 'VIP Rush', label: 'VIP Rush' },
                        ]}
                        error={errors.orderType?.message}
                      />
                    </div>

                    {/* Food Items Section Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: tokens.colorNeutralForeground1 }}>
                        Food Items ({fields.length})
                      </span>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Add20Regular />}
                        type="button"
                        onClick={() => append({ id: `item_${Date.now()}`, name: '', quantity: 1, notes: '' })}
                        style={{ color: '#E51937', fontWeight: 700, padding: '4px 10px' }}
                      >
                        Add Item
                      </Button>
                    </div>

                    {/* Multi-Item Fields List with Scroll */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '12px',
                            backgroundColor: tokens.colorNeutralBackground3,
                            border: `1px solid ${tokens.colorNeutralStroke2}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                          }}
                        >
                          {/* Item Header Pill & Delete */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                color: '#E51937',
                                backgroundColor: 'rgba(229, 25, 55, 0.1)',
                                border: '1px solid rgba(229, 25, 55, 0.25)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              Item #{index + 1}
                            </span>
                            {fields.length > 1 && (
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Delete16Regular style={{ color: '#EF4444' }} />}
                                type="button"
                                onClick={() => remove(index)}
                                title="Remove this item"
                                aria-label="Remove item"
                                style={{ minWidth: 'auto', padding: '4px 8px' }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>

                          {/* Autocomplete Input */}
                          <ProductAutocomplete
                            id={`lines.${index}.name`}
                            label="Food Item Name"
                            labelBg={tokens.colorNeutralBackground3}
                            required
                            filterModule="fastfood"
                            value={watch(`lines.${index}.name`) || ''}
                            onChange={(val) => setValue(`lines.${index}.name`, val, { shouldValidate: true })}
                            placeholder="Search or type food (e.g. Pizza, Burger, Sandwich)..."
                            error={errors.lines?.[index]?.name?.message}
                          />

                          {/* Qty and Notes cleanly aligned in 2 columns */}
                          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px' }}>
                            <CustomInput
                              id={`qty-${index}`}
                              type="number"
                              min={1}
                              label="Quantity"
                              labelBg={tokens.colorNeutralBackground3}
                              required
                              {...register(`lines.${index}.quantity` as const, { valueAsNumber: true })}
                              error={errors.lines?.[index]?.quantity?.message}
                            />
                            <CustomInput
                              id={`notes-${index}`}
                              label="Chef Prep Note"
                              labelBg={tokens.colorNeutralBackground3}
                              placeholder="e.g. Extra spicy, no onion, extra cheese"
                              {...register(`lines.${index}.notes` as const)}
                              error={errors.lines?.[index]?.notes?.message}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Add Another Item Button */}
                    <Button
                      appearance="secondary"
                      type="button"
                      icon={<Add20Regular />}
                      onClick={() => append({ id: `item_${Date.now()}`, name: '', quantity: 1, notes: '' })}
                      style={{
                        borderStyle: 'dashed',
                        borderColor: tokens.colorNeutralStroke1,
                        fontWeight: 700,
                        justifyContent: 'center',
                        borderRadius: '10px',
                        padding: '10px',
                      }}
                    >
                      Add Another Food Item
                    </Button>
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
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Print16Regular />}
                      title="Print KOT Ticket (Kitchen Thermal Printer)"
                      onClick={() => {
                        void printKitchenKot(
                          {
                            id: ticket.orderId || ticket.id,
                            module: 'fastfood',
                            lines: (ticket.order?.lines || []).map((l: any) => ({
                              productId: l.id || '',
                              name: l.name,
                              unitPrice: 0,
                              quantity: l.quantity || 1,
                              notes: l.notes,
                              variantLabel: l.variantLabel,
                            })),
                            discountPercent: 0,
                            stage: 'kot',
                            createdAt: ticket.createdAt,
                            updatedAt: ticket.createdAt,
                            orderType: (ticket.orderType || 'dine-in') as any,
                          },
                          {
                            tableOrToken: ticket.orderType?.toUpperCase(),
                            cashierName: 'Kitchen KDS',
                          },
                        );
                      }}
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
