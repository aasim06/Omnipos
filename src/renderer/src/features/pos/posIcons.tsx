import { BowlSalad24Regular, Box20Regular, DrinkBeer24Regular, DrinkCoffee24Regular, DrinkToGo24Regular, Fire20Regular, Food24Regular, FoodApple24Regular, FoodCake24Regular, FoodCarrot24Regular, FoodChickenLeg24Regular, FoodEgg24Regular, FoodFish24Regular, FoodGrains24Regular, FoodPizza24Regular, LeafOne20Regular, PaintBrush20Regular, Star20Regular, Tag20Regular } from '@fluentui/react-icons';

/* ─── Icon Resolver ────────────────────────────────────────────────── */
export function ProductIcon({ name, category, size = 24, color }: { name: string; category?: string; size?: number; color?: string }) {
  const n = (name + ' ' + (category ?? '')).toLowerCase();
  const style = { width: size, height: size, color: color || 'currentColor', flexShrink: 0 };

  if (n.includes('chicken') || n.includes('wing') || n.includes('leg')) return <FoodChickenLeg24Regular style={style} />;
  if (n.includes('pizza')) return <FoodPizza24Regular style={style} />;
  if (n.includes('fish') || n.includes('tuna') || n.includes('salmon')) return <FoodFish24Regular style={style} />;
  if (n.includes('cake') || n.includes('sweet') || n.includes('dessert') || n.includes('mithai')) return <FoodCake24Regular style={style} />;
  if (n.includes('apple') || n.includes('fruit')) return <FoodApple24Regular style={style} />;
  if (n.includes('rice') || n.includes('biryani') || n.includes('grain') || n.includes('wheat')) return <FoodGrains24Regular style={style} />;
  if (n.includes('egg') || n.includes('omelette')) return <FoodEgg24Regular style={style} />;
  if (n.includes('salad') || n.includes('greens') || n.includes('vegan') || n.includes('veg')) return <BowlSalad24Regular style={style} />;
  if (n.includes('carrot') || n.includes('vegetable') || n.includes('sabzi')) return <FoodCarrot24Regular style={style} />;
  if (n.includes('coffee') || n.includes('chai') || n.includes('tea') || n.includes('espresso')) return <DrinkCoffee24Regular style={style} />;
  if (n.includes('juice') || n.includes('shake') || n.includes('smoothie') || n.includes('cola') || n.includes('pepsi') || n.includes('drink')) return <DrinkToGo24Regular style={style} />;
  if (n.includes('beer') || n.includes('fizz') || n.includes('soda')) return <DrinkBeer24Regular style={style} />;
  if (n.includes('bread') || n.includes('roti') || n.includes('naan') || n.includes('toast')) return <FoodGrains24Regular style={style} />;
  if (n.includes('soup') || n.includes('curry') || n.includes('stew') || n.includes('bowl')) return <BowlSalad24Regular style={style} />;
  return <Food24Regular style={style} />;
}

export function CategoryIcon({ cat, size = 16 }: { cat: string; size?: number }) {
  const c = cat.toLowerCase();
  const s = { width: size, height: size };
  if (c.includes('paint') || c.includes('primer') || c.includes('wall') || c.includes('color')) return <PaintBrush20Regular style={s} />;
  if (c.includes('sanitary') || c.includes('tap') || c.includes('tooti') || c.includes('mixer')) return <DrinkToGo24Regular style={{ width: size, height: size }} />;
  if (c.includes('hardware') || c.includes('iron') || c.includes('kill') || c.includes('nail') || c.includes('bolt')) return <Box20Regular style={s} />;
  if (c.includes('cosmetic') || c.includes('skin') || c.includes('cream') || c.includes('beauty')) return <Star20Regular style={s} />;
  if (c.includes('garment') || c.includes('cloth') || c.includes('shirt') || c.includes('men')) return <Tag20Regular style={s} />;
  if (c.includes('shoe') || c.includes('footwear')) return <Box20Regular style={s} />;
  if (c.includes('toy') || c.includes('kid')) return <Star20Regular style={s} />;
  if (c.includes('general')) return <Box20Regular style={s} />;
  if (c.includes('vegan') || c.includes('vegetarian')) return <LeafOne20Regular style={s} />;
  if (c.includes('street') || c.includes('snack') || c.includes('fast')) return <Fire20Regular style={s} />;
  if (c.includes('dessert') || c.includes('cake') || c.includes('sweet')) return <Star20Regular style={s} />;
  if (c.includes('drink') || c.includes('beverage')) return <DrinkToGo24Regular style={{ width: size, height: size }} />;
  return <Food24Regular style={{ width: size, height: size }} />;
}

export function formatSizeBadge(label: string): string {
  const l = label.trim().toLowerCase();
  if (l === 'small' || l === 's' || l === 'size s') return 'S';
  if (l === 'medium' || l === 'm' || l === 'size m') return 'M';
  if (l === 'large' || l === 'l' || l === 'size l') return 'L';
  if (l === 'extra large' || l === 'x-large' || l === 'xl' || l === 'size xl') return 'XL';
  // Shoe sizes e.g. "40", "41", "42", "43", "44", "Size 42"
  const shoeMatch = l.match(/\b(3[89]|4[0-6])\b/);
  if (shoeMatch) return shoeMatch[1];
  // Cosmetic shades e.g. "#01 Red" -> "#01", "#08 Nude" -> "#08"
  const shadeMatch = l.match(/(#\d+)/);
  if (shadeMatch) return shadeMatch[1];
  if (l.includes('can') || l.includes('tin')) return 'Can';
  if (l.includes('500') || l.includes('half')) return '500ml';
  if (l.includes('1.5') || l.includes('jumbo')) return '1.5L';
  if (l.includes('1.0') || l === '1 liter' || l === '1l' || l.includes('1 liter')) return '1.0L';
  if (l.includes('small (500ml)') || l.includes('small bottle')) return 'Small';
  if (l.includes('large (1.5l)') || l.includes('large bottle')) return 'Large';
  if (l.includes('balti') || l.includes('drum')) return 'Balti';
  if (l.includes('gallon') || l.includes('gal')) return 'Gallon';
  if (l.includes('quarter') || l.includes('qtr')) return 'Quarter';
  if (l.includes('0.5 kg') || l.includes('500g') || l.includes('aadha')) return '0.5 KG';
  if (l.includes('1.0 kg') || l.includes('1kg') || l.includes('ek kilo')) return '1 KG';
  if (l.includes('5.0 kg') || l.includes('5kg')) return '5 KG';
  if (l.includes('125ml')) return '125ml';
  if (l.includes('250ml')) return '250ml';
  if (l.includes('400ml')) return '400ml';
  if (l.includes('100g')) return '100g';
  if (l.includes('200g')) return '200g';
  return label.length > 6 ? label.slice(0, 5) : label;
}
