import { PosCounterState } from '@/features/pos/usePosCounter';
import { Checkmark20Filled, ChevronDown20Regular, ChevronUp20Regular, Dismiss16Regular, PeopleCommunity20Regular, Person20Regular, ShoppingBag24Regular, VehicleTruckProfile20Regular } from '@fluentui/react-icons';
import { playBeep } from '@/lib/soundFx';

export function OrderDetails({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    paymentMode,
    setPaymentMode,
    setSelectedKhataId,
    orderType,
    setOrderType,
    tableNo,
    setTableNo,
    tokenNo,
    setTokenNo,
    deliveryDetails,
    setDeliveryDetails,
    isTopSectionCollapsed,
    setIsTopSectionCollapsed,
    selectedCustomer,
    customerSearchQuery,
    setCustomerSearchQuery,
    isCustomerDropdownOpen,
    setIsCustomerDropdownOpen,
    customerDropdownRef,
    customerInputRef,
    formatCustomerBalance,
    handleSelectCustomer,
    handleClearCustomer,
    filteredCustomerOptions,
  } = pos;

  return (
    <>
      {isTopSectionCollapsed ? (
        /* Collapsed Compact 1-line Summary Bar (~32px) */
        <div
          onClick={() => setIsTopSectionCollapsed(false)}
          style={{
            padding: '6px 14px',
            borderBottom: `1px solid ${F.borderSubtle}`,
            backgroundColor: F.bgSubtle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background-color 0.12s ease',
          }}
          title="Click to expand order details and customer selector"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = F.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = F.bgSubtle)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
            {module === 'fastfood' && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  backgroundColor: F.accentRed,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {orderType === 'dine-in'
                  ? `Dine-In (${tableNo || 'T-1'})`
                  : orderType === 'takeaway'
                  ? `Takeaway #${String(tokenNo).padStart(2, '0')}`
                  : 'Delivery'}
              </span>
            )}
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: F.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Person20Regular style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>{selectedCustomer.name} | {formatCustomerBalance(selectedCustomer)}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: F.accentRed, fontSize: '11px', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>
            <span>Expand</span>
            <ChevronDown20Regular style={{ width: 14, height: 14 }} />
          </div>
        </div>
      ) : (
        /* Expanded Order Details & Customer Section */
        <div
          style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${F.borderSubtle}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: F.bgSubtle,
          }}
        >
          {/* Header: Label and Collapse Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: F.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Order Info & Customer
            </span>
            <button
              type="button"
              onClick={() => setIsTopSectionCollapsed(true)}
              title="Collapse to make more room for order items"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: F.textMuted,
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = F.accentRed)}
              onMouseLeave={(e) => (e.currentTarget.style.color = F.textMuted)}
            >
              <span>Collapse</span>
              <ChevronUp20Regular style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Customer Autocomplete (MUI Floating Label Notch Style matching reference image) */}
          <div style={{ position: 'relative', width: '100%' }} ref={customerDropdownRef}>
            <div
              onClick={() => {
                setIsCustomerDropdownOpen(true);
                setTimeout(() => customerInputRef.current?.focus(), 50);
              }}
              style={{
                position: 'relative',
                border: `1px solid ${isCustomerDropdownOpen ? F.accentRed : isDark ? '#4A4A4A' : '#767676'}`,
                borderRadius: '4px',
                backgroundColor: F.bgCard,
                minHeight: '38px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'text',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
            >
              {/* Floating notch label */}
              <span
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '10px',
                  backgroundColor: F.bgSubtle,
                  padding: '0 4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isCustomerDropdownOpen ? F.accentRed : isDark ? '#B0B0B0' : '#5F6368',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                Customer
              </span>

              {/* Text or Search Input */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                {isCustomerDropdownOpen ? (
                  <input
                    ref={customerInputRef}
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    placeholder={`${selectedCustomer.name} | ${formatCustomerBalance(selectedCustomer)}`}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      width: '100%',
                      fontSize: '13.5px',
                      fontFamily: F.font,
                      color: F.textPrimary,
                      padding: 0,
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setIsCustomerDropdownOpen(false);
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredCustomerOptions.length > 0) {
                          handleSelectCustomer(filteredCustomerOptions[0]);
                        } else if (customerSearchQuery.trim()) {
                          handleSelectCustomer({ name: customerSearchQuery.trim(), currentDebt: 0 });
                        }
                      }
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: '13.5px',
                      color: F.textPrimary,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {`${selectedCustomer.name} | ${formatCustomerBalance(selectedCustomer)}`}
                  </span>
                )}
              </div>

              {/* Right Action Icons: Clear (X) and Dropdown Arrow (v) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                {(selectedCustomer.name !== 'Guest' || customerSearchQuery) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCustomer();
                    }}
                    title="Clear customer selection"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      color: F.textMuted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Dismiss16Regular style={{ width: 14, height: 14 }} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCustomerDropdownOpen((prev) => !prev);
                    if (!isCustomerDropdownOpen) {
                      setTimeout(() => customerInputRef.current?.focus(), 50);
                    }
                  }}
                  title="Toggle customer list"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '3px',
                    color: F.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isCustomerDropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <ChevronDown20Regular style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            {/* Dropdown Options Popover */}
            {isCustomerDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  backgroundColor: F.bgCard,
                  border: `1px solid ${F.border}`,
                  borderRadius: F.radiusSm,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 200,
                  padding: '4px',
                }}
              >
                {filteredCustomerOptions.map((cust, idx) => {
                  const isCur = (cust.id && cust.id === selectedCustomer.id) || (!cust.id && !selectedCustomer.id && cust.name === selectedCustomer.name);
                  return (
                    <div
                      key={cust.id || `guest-${idx}`}
                      onClick={() => handleSelectCustomer(cust)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: F.radiusSm,
                        backgroundColor: isCur ? (isDark ? 'rgba(229, 25, 55, 0.15)' : '#FEF2F2') : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCur) e.currentTarget.style.backgroundColor = F.bgHover;
                      }}
                      onMouseLeave={(e) => {
                        if (!isCur) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: isCur ? 700 : 600, color: isCur ? F.accentRed : F.textPrimary }}>
                          {cust.name}
                        </div>
                        {cust.phone && (
                          <div style={{ fontSize: '11px', color: F.textMuted }}>
                            {cust.phone}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: (cust.currentDebt || 0) > 0 ? F.accentRed : '#10B981',
                          fontFamily: 'monospace',
                          flexShrink: 0,
                        }}
                      >
                        {formatCustomerBalance(cust)}
                      </div>
                    </div>
                  );
                })}

                {filteredCustomerOptions.length === 0 && customerSearchQuery.trim() && (
                  <div
                    onClick={() => handleSelectCustomer({ name: customerSearchQuery.trim(), currentDebt: 0 })}
                    style={{
                      padding: '8px 10px',
                      borderRadius: F.radiusSm,
                      cursor: 'pointer',
                      color: F.accentRed,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = F.bgHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    + Use "{customerSearchQuery.trim()}" as Walk-In Customer
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fast Food Mode: Order Type Tabs & Contextual Sub-bar */}
          {module === 'fastfood' && (
            <>
              {/* 3-option Segmented Pill Switcher */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '4px',
                  backgroundColor: F.bgCard,
                  padding: '3px',
                  borderRadius: F.radiusMd,
                  border: `1px solid ${F.border}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('dine-in');
                    playBeep();
                  }}
                  style={{
                    padding: '6px 0',
                    borderRadius: F.radiusSm,
                    border: 'none',
                    backgroundColor: orderType === 'dine-in' ? F.accentRed : 'transparent',
                    color: orderType === 'dine-in' ? '#FFFFFF' : F.textSecondary,
                    fontWeight: orderType === 'dine-in' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <PeopleCommunity20Regular style={{ width: 14, height: 14 }} />
                  <span>Dine-In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderType('takeaway');
                    playBeep();
                  }}
                  style={{
                    padding: '6px 0',
                    borderRadius: F.radiusSm,
                    border: 'none',
                    backgroundColor: orderType === 'takeaway' ? F.accentRed : 'transparent',
                    color: orderType === 'takeaway' ? '#FFFFFF' : F.textSecondary,
                    fontWeight: orderType === 'takeaway' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <ShoppingBag24Regular style={{ width: 14, height: 14 }} />
                  <span>Takeaway</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderType('delivery');
                    playBeep();
                  }}
                  style={{
                    padding: '6px 0',
                    borderRadius: F.radiusSm,
                    border: 'none',
                    backgroundColor: orderType === 'delivery' ? F.accentRed : 'transparent',
                    color: orderType === 'delivery' ? '#FFFFFF' : F.textSecondary,
                    fontWeight: orderType === 'delivery' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <VehicleTruckProfile20Regular style={{ width: 14, height: 14 }} />
                  <span>Delivery</span>
                </button>
              </div>

              {/* Contextual Sub-bar */}
              {orderType === 'dine-in' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: F.textMuted, whiteSpace: 'nowrap' }}>
                    TABLE:
                  </span>
                  {['T-1', 'T-2', 'T-3', 'T-4', 'T-5'].map((t) => {
                    const fullT = `Table ${t.replace('T-', '')}`;
                    const isCur = tableNo === fullT || tableNo === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTableNo(fullT);
                          playBeep();
                        }}
                        style={{
                          padding: '3px 7px',
                          borderRadius: '4px',
                          border: `1px solid ${isCur ? F.accentRed : F.border}`,
                          backgroundColor: isCur ? F.accentRedSubtle : F.bgCard,
                          color: isCur ? F.accentRed : F.textSecondary,
                          fontSize: '11px',
                          fontWeight: isCur ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                  <input
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    placeholder="Custom..."
                    style={{
                      width: '65px',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgCard,
                      color: F.textPrimary,
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {orderType === 'takeaway' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: F.bgCard,
                    padding: '5px 10px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.borderSubtle}`,
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary }}>
                    ASSIGNED TOKEN NUMBER
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: F.accentRed, fontFamily: 'monospace' }}>
                      #{String(tokenNo).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTokenNo((t) => Math.max(1, t - 1))}
                      style={{ padding: '1px 7px', fontSize: '11px', border: `1px solid ${F.border}`, borderRadius: '3px', background: F.bgSubtle, cursor: 'pointer', color: F.textPrimary }}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => setTokenNo((t) => t + 1)}
                      style={{ padding: '1px 7px', fontSize: '11px', border: `1px solid ${F.border}`, borderRadius: '3px', background: F.bgSubtle, cursor: 'pointer', color: F.textPrimary }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {orderType === 'delivery' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <input
                    value={deliveryDetails.customerName}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, customerName: e.target.value })}
                    placeholder="Customer Name..."
                    style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '11.5px', outline: 'none' }}
                  />
                  <input
                    value={deliveryDetails.phone}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                    placeholder="Phone Number..."
                    style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '11.5px', outline: 'none' }}
                  />
                  <input
                    value={deliveryDetails.address}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                    placeholder="Delivery Address..."
                    style={{ gridColumn: 'span 2', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '11.5px', outline: 'none' }}
                  />
                </div>
              )}
            </>
          )}

          {/* Mini Mart Mode: Customer Khata Balance Card if customer has credit account */}
          {module === 'minimart' && selectedCustomer.id && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: F.radiusSm,
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: F.textPrimary }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: '11px', color: F.textSecondary, marginTop: '2px' }}>
                  Khata Balance: <b style={{ color: (selectedCustomer.currentDebt || 0) > 0 ? F.accentRed : '#10B981' }}>PKR {(selectedCustomer.currentDebt || 0).toLocaleString()}</b>
                </div>
              </div>
              {paymentMode !== 'khata' ? (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('khata');
                    setSelectedKhataId(selectedCustomer.id!);
                    playBeep();
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Use Khata
                </button>
              ) : (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Checkmark20Filled style={{ width: 14, height: 14 }} />
                  <span>Khata Active</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
