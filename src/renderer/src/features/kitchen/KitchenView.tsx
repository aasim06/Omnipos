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
  mergeClasses,
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
  Timer16Regular,
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
import { playKitchenBell } from '@/lib/soundFx';

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

import { useKitchenStyles, useStyles } from './kitchen.styles';

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
  const styles = useKitchenStyles();
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

  // Sound Chime when new orders arrive in the kitchen queue
  const prevTicketCountRef = React.useRef(tickets.length);
  React.useEffect(() => {
    if (tickets.length > prevTicketCountRef.current && prevTicketCountRef.current > 0) {
      playKitchenBell();
    }
    prevTicketCountRef.current = tickets.length;
  }, [tickets.length]);

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
      await queryClient.refetchQueries({ queryKey: ['kitchen-tickets'] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
      await queryClient.refetchQueries({ queryKey: ['kitchen-tickets'] });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
      await queryClient.refetchQueries({ queryKey: ['kitchen-tickets'] });
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
            className={styles.pageTitle}
          >
            Kitchen Display System (KDS)
          </Subtitle1>
          <Text
            as="p"
            size={200}
            className={styles.pageSubtitle}
          >
            Chef order queue — auto-synced live with POS counter &amp; online orders
          </Text>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.activeOrdersChip}>
            <span className={tickets.length > 0 ? styles.chipDotActive : styles.chipDotClear} />
            <Timer24Regular
              className={tickets.length > 0 ? styles.timerIconActive : styles.timerIconClear}
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
            <DialogSurface className={styles.dialogSurface}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogBody>
                  <DialogTitle className={styles.dialogTitle}>
                    Add Manual Rush Order Ticket
                  </DialogTitle>
                  <DialogContent className={styles.dialogContent}>
                    
                    {/* Top Row: Customer Name & Order Type */}
                    <div className={styles.formRow}>
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
                    <div className={styles.foodSectionHeader}>
                      <span className={styles.foodSectionTitle}>
                        Food Items ({fields.length})
                      </span>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Add20Regular />}
                        type="button"
                        onClick={() => append({ id: `item_${Date.now()}`, name: '', quantity: 1, notes: '' })}
                        className={styles.addItemBtn}
                      >
                        Add Item
                      </Button>
                    </div>

                    {/* Multi-Item Fields List with Scroll */}
                    <div className={styles.foodListScroll}>
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className={styles.foodItemCard}
                        >
                          {/* Item Header Pill & Delete */}
                          <div className={styles.foodItemHeader}>
                            <span className={styles.itemBadge}>
                              Item #{index + 1}
                            </span>
                            {fields.length > 1 && (
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Delete16Regular className={styles.deleteIcon} />}
                                type="button"
                                onClick={() => remove(index)}
                                title="Remove this item"
                                aria-label="Remove item"
                                className={styles.removeItemBtn}
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
                          <div className={styles.foodItemRowInputs}>
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
                      className={styles.addAnotherBtn}
                    >
                      Add Another Food Item
                    </Button>
                  </DialogContent>

                  <DialogActions className={styles.dialogActions}>
                    <Button
                      appearance="subtle"
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      className={styles.cancelBtn}
                    >
                      Cancel
                    </Button>
                    <Button
                      appearance="primary"
                      type="submit"
                      disabled={createTicketMutation.isPending}
                      className={styles.sendTicketBtn}
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
          <BowlSalad24Regular className={styles.emptyIcon} />
          <Body1 className={styles.emptyTitle}>
            Kitchen Queue is Clear
          </Body1>
          <Caption1 className={styles.emptySubtext}>
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
                  className={mergeClasses(
                    styles.ticketHeader,
                    isReady ? styles.ticketHeaderReady : isCooking ? styles.ticketHeaderCooking : styles.ticketHeaderDefault
                  )}
                >
                  <div className={styles.ticketMetaCol}>
                    <div className={styles.ticketTitleRow}>
                      <Body1 className={styles.ticketTitle}>
                        Ticket #{String(idx + 1).padStart(3, '0')}
                      </Body1>
                      <span
                        className={mergeClasses(
                          elapsedMins > 15 ? styles.timeUrgent : elapsedMins > 8 ? styles.timeWarning : styles.timeGood,
                          styles.timeChip
                        )}
                      >
                        <Timer16Regular className={styles.timerSmallIcon} />
                        <span>{elapsedMins}m ago</span>
                      </span>
                    </div>
                    <Caption1 className={styles.ticketTimeSub}>
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
                        <Body2 className={styles.itemName}>
                          {line.name}
                        </Body2>
                        {line.variantLabel && (
                          <Caption1 className={styles.itemVariant}>
                            {line.variantLabel}
                          </Caption1>
                        )}
                        {line.notes && (
                          <Caption1 className={styles.itemNotes}>
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
                  <div className={styles.footerActionsLeft}>
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
                    <Caption1 className={styles.refText}>
                      Ref: #{ticket.orderId?.slice(-6) || '—'}
                    </Caption1>
                  </div>

                  <div className={styles.footerActionsRight}>
                    {ticket.status === 'pending' && (
                      <Button
                        appearance="primary"
                        size="small"
                        icon={<Clock24Regular />}
                        className={styles.btnStartCooking}
                        onClick={() => updateStatusMutation.mutate({ id: ticket.id, status: 'cooking' })}
                      >
                        Start Cooking
                      </Button>
                    )}

                    {ticket.status === 'cooking' && (
                      <Button
                        appearance="primary"
                        size="small"
                        className={styles.btnMarkReady}
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
                        className={styles.btnMarkServed}
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
