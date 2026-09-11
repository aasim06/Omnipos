export interface UnitOption {
  value: string;
  label: string;
}

export const MASTER_UNIT_OPTIONS: UnitOption[] = [
  { value: 'PCS', label: 'Piece (PCS)' },
  { value: 'SET', label: 'Set (SET)' },
  { value: 'PAIR', label: 'Pair (PAIR)' },
  { value: 'FEET', label: 'Feet (ft)' },
  { value: 'LENGTH', label: 'Pipe Length (10ft / 13ft Length)' },
  { value: 'RFT', label: 'Running Feet (RFT)' },
  { value: 'METER', label: 'Meter (m)' },
  { value: 'INCH', label: 'Inch (in)' },
  { value: 'ROLL', label: 'Roll (Teflon / Tape / Pipe / Wire)' },
  { value: 'TUBE', label: 'Tube (Cream / Ointment / Sealant)' },
  { value: 'PACK', label: 'Pack' },
  { value: 'BOX', label: 'Box' },
  { value: 'CARTON', label: 'Carton / Peti (CTN)' },
  { value: 'DOZEN', label: 'Dozen (Darjan)' },
  { value: 'COIL', label: 'Coil / Bundle' },
  { value: 'SHEET', label: 'Sheet' },
  { value: 'BAG', label: 'Bag / Bori' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'Gram', label: 'Gram (g)' },
  { value: 'Liter', label: 'Liter (L)' },
  { value: 'ML', label: 'Milliliter (ml)' },
  { value: 'POUND', label: 'Pound / Lbs (Cakes)' },
  { value: 'GALLON', label: 'Gallon' },
  { value: 'QUARTER', label: 'Quarter (1L)' },
  { value: 'BALTI', label: 'Bucket / Balti (16L)' },
  { value: 'SUIT', label: 'Suit (SUIT)' },
  { value: 'GAZ', label: 'Gaz / Yard' },
  { value: 'THAN', label: 'Than / Fabric Bolt (Cloth)' },
  { value: 'DABBA', label: 'Box / Pack (Dabba)' },
  { value: 'TRAY', label: 'Tray (Eggs / Sweets)' },
  { value: 'STRIP', label: 'Strip (Tablets)' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CAPSULE', label: 'Capsule' },
  { value: 'SYRUP', label: 'Syrup Bottle' },
  { value: 'BOTTLE', label: 'Bottle' },
  { value: 'JAR', label: 'Jar (Honey / Jam / Cream)' },
  { value: 'TIN', label: 'Tin / Can' },
  { value: 'CAN', label: 'Can (Beverage / Food)' },
  { value: 'SACHET', label: 'Sachet / Pouch' },
  { value: 'VIAL', label: 'Vial (Injection)' },
  { value: 'AMPOULE', label: 'Ampoule' },
  { value: 'KIT', label: 'Kit / Combo' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'PORTION', label: 'Portion' },
  { value: 'PLATE', label: 'Plate' },
  { value: 'SERVING', label: 'Serving' },
  { value: 'DEAL', label: 'Deal / Combo' },
  { value: 'CUP', label: 'Cup' },
  { value: 'GLASS', label: 'Glass' },
];

export const UNIT_OPTIONS = MASTER_UNIT_OPTIONS;

/**
 * Returns user-friendly label for a given unit value (e.g. 'KG' -> 'Kilogram (KG)')
 */
export function getUnitLabel(unitValue?: string): string {
  if (!unitValue) return 'PCS';
  const found = MASTER_UNIT_OPTIONS.find(
    (opt) => opt.value.toUpperCase() === unitValue.toUpperCase(),
  );
  return found ? found.label : unitValue;
}

/**
 * Filter unit options to match category suggested units
 */
export function getSuggestedUnitOptions(suggestedUnits?: string[]): UnitOption[] {
  if (!suggestedUnits || suggestedUnits.length === 0) {
    return MASTER_UNIT_OPTIONS;
  }
  const matched = suggestedUnits
    .map((su) =>
      MASTER_UNIT_OPTIONS.find((opt) => opt.value.toUpperCase() === su.toUpperCase()) || {
        value: su,
        label: su,
      },
    )
    .filter(Boolean);

  return matched.length > 0 ? matched : MASTER_UNIT_OPTIONS;
}
