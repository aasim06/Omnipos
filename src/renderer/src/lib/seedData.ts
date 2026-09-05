import { Product, Category } from "./types";

export const INITIAL_CATEGORIES: Category[] = [
  // Fast Food Categories
  { id: "cat_ff_burger", module: "fastfood", name: "Burger", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_pizza", module: "fastfood", name: "Pizza", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_broast", module: "fastfood", name: "Broast & Wings", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_wraps", module: "fastfood", name: "Wraps & Shawarma", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_fries", module: "fastfood", name: "Fries & Sides", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_drinks", module: "fastfood", name: "Cold Drinks", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_water", module: "fastfood", name: "Mineral Water", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_desserts", module: "fastfood", name: "Desserts & Shakes", createdAt: "2026-09-01T00:00:00.000Z" },

  // Minimart Categories (Authentic Pakistani Retail Store)
  { id: "cat_mm_cosmetics", module: "minimart", name: "Cosmetics & Skincare", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_garments", module: "minimart", name: "Men's Garments", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_shoes", module: "minimart", name: "Footwear & Shoes", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_toys", module: "minimart", name: "Toys & Kids", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_paints", module: "minimart", name: "Paints & Wall Primer", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_sanitary", module: "minimart", name: "Sanitary & Taps", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_hardware", module: "minimart", name: "Hardware & Iron", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_general", module: "minimart", name: "General Store", createdAt: "2026-09-01T00:00:00.000Z" },
];

export const INITIAL_PRODUCTS: Product[] = [
  // ── BURGERS (8 items) ──
  {
    id: "prod_ff_zinger",
    module: "fastfood",
    name: "Crispy Zinger Burger",
    description: "Crispy chicken fillet with Mayo & fresh Lettuce in toasted sesame bun",
    costPrice: 320,
    price: 550,
    category: "Burger",
    skuCode: "SKU-BUR-01",
    rackLocation: "Kitchen A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 65,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_smash_beef",
    module: "fastfood",
    name: "Double Smash Beef Burger",
    description: "Two prime smashed beef patties, melted cheddar, caramelized onions & smash sauce",
    costPrice: 520,
    price: 850,
    category: "Burger",
    skuCode: "SKU-BUR-02",
    rackLocation: "Kitchen A-02",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 45,
    imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_tower_burger",
    module: "fastfood",
    name: "Mighty Zinger Tower Burger",
    description: "Double crispy zinger fillets, hash brown, double cheese slice & spicy fire sauce",
    costPrice: 540,
    price: 890,
    category: "Burger",
    skuCode: "SKU-BUR-03",
    rackLocation: "Kitchen A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 40,
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_bbq_burger",
    module: "fastfood",
    name: "Smoky BBQ Beef Burger",
    description: "Chargrilled juicy beef patty with hickory smoked BBQ glaze & melted cheddar",
    costPrice: 480,
    price: 780,
    category: "Burger",
    skuCode: "SKU-BUR-04",
    rackLocation: "Kitchen A-02",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 35,
    imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_grilled_chicken",
    module: "fastfood",
    name: "Flame Grilled Chicken Burger",
    description: "Herb-marinated chicken breast fillet, garlic aioli & fresh crisp iceberg lettuce",
    costPrice: 350,
    price: 590,
    category: "Burger",
    skuCode: "SKU-BUR-05",
    rackLocation: "Kitchen A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 50,
    imageUrl: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_jalapeno_crunch",
    module: "fastfood",
    name: "Jalapeño Spicy Crunch Burger",
    description: "Crunchy fried chicken thigh coated in spicy seasoning with pickled jalapeño relish",
    costPrice: 370,
    price: 620,
    category: "Burger",
    skuCode: "SKU-BUR-06",
    rackLocation: "Kitchen A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 42,
    imageUrl: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_chapli_burger",
    module: "fastfood",
    name: "Peshawari Chapli Burger",
    description: "Traditional spicy minced chicken chapli kebab patty with mint mayo & fresh onion rings",
    costPrice: 240,
    price: 420,
    category: "Burger",
    skuCode: "SKU-BUR-07",
    rackLocation: "Kitchen A-03",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 60,
    imageUrl: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_fish_burger",
    module: "fastfood",
    name: "Crispy Fish Fillet Burger",
    description: "Golden crumbed fish fillet topped with tangy tartar sauce & sliced melted cheese",
    costPrice: 410,
    price: 680,
    category: "Burger",
    skuCode: "SKU-BUR-08",
    rackLocation: "Kitchen A-03",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 30,
    imageUrl: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── PIZZAS (6 items with S/M/L/XL sizes) ──
  {
    id: "prod_ff_piz_fajita",
    module: "fastfood",
    name: "Chicken Fajita Pizza",
    description: "Fajita spiced chicken chunks, bell peppers, onions, mushrooms & melted mozzarella",
    costPrice: 420,
    price: 650,
    category: "Pizza",
    skuCode: "SKU-PIZ-FAJ",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 50,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "smlxl",
    variants: [
      { id: "var_faj_s", label: "S", price: 650, priceDelta: 0, costDelta: 0, stock: 50, skuCode: "SKU-FAJ-S" },
      { id: "var_faj_m", label: "M", price: 1050, priceDelta: 400, costDelta: 150, stock: 50, skuCode: "SKU-FAJ-M" },
      { id: "var_faj_l", label: "L", price: 1450, priceDelta: 800, costDelta: 300, stock: 50, skuCode: "SKU-FAJ-L" },
      { id: "var_faj_xl", label: "XL", price: 1850, priceDelta: 1200, costDelta: 450, stock: 50, skuCode: "SKU-FAJ-XL" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_piz_tikka",
    module: "fastfood",
    name: "Chicken Tikka Supreme Pizza",
    description: "Smoked chicken tikka boti, red onions, diced tomatoes, green chilies & creamy sauce",
    costPrice: 420,
    price: 650,
    category: "Pizza",
    skuCode: "SKU-PIZ-TIK",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 48,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "smlxl",
    variants: [
      { id: "var_tik_s", label: "S", price: 650, priceDelta: 0, costDelta: 0, stock: 48, skuCode: "SKU-TIK-S" },
      { id: "var_tik_m", label: "M", price: 1050, priceDelta: 400, costDelta: 150, stock: 48, skuCode: "SKU-TIK-M" },
      { id: "var_tik_l", label: "L", price: 1450, priceDelta: 800, costDelta: 300, stock: 48, skuCode: "SKU-TIK-L" },
      { id: "var_tik_xl", label: "XL", price: 1850, priceDelta: 1200, costDelta: 450, stock: 48, skuCode: "SKU-TIK-XL" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_piz_crown",
    module: "fastfood",
    name: "Crown Crust Royal Pizza",
    description: "Royal stuffed kebab crust, smoked barbecue chicken, black olives, jalapenos & mozzarella",
    costPrice: 500,
    price: 750,
    category: "Pizza",
    skuCode: "SKU-PIZ-CRW",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 40,
    imageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "smlxl",
    variants: [
      { id: "var_crw_s", label: "S", price: 750, priceDelta: 0, costDelta: 0, stock: 40, skuCode: "SKU-CRW-S" },
      { id: "var_crw_m", label: "M", price: 1200, priceDelta: 450, costDelta: 180, stock: 40, skuCode: "SKU-CRW-M" },
      { id: "var_crw_l", label: "L", price: 1650, priceDelta: 900, costDelta: 360, stock: 40, skuCode: "SKU-CRW-L" },
      { id: "var_crw_xl", label: "XL", price: 2100, priceDelta: 1350, costDelta: 540, stock: 40, skuCode: "SKU-CRW-XL" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_piz_pepperoni",
    module: "fastfood",
    name: "Classic Pepperoni Pizza",
    description: "Layers of savory beef pepperoni over rich marinara sauce and golden bubbling mozzarella",
    costPrice: 480,
    price: 720,
    category: "Pizza",
    skuCode: "SKU-PIZ-PEP",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 38,
    imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "smlxl",
    variants: [
      { id: "var_pep_s", label: "S", price: 720, priceDelta: 0, costDelta: 0, stock: 38, skuCode: "SKU-PEP-S" },
      { id: "var_pep_m", label: "M", price: 1150, priceDelta: 430, costDelta: 170, stock: 38, skuCode: "SKU-PEP-M" },
      { id: "var_pep_l", label: "L", price: 1580, priceDelta: 860, costDelta: 340, stock: 38, skuCode: "SKU-PEP-L" },
      { id: "var_pep_xl", label: "XL", price: 1990, priceDelta: 1270, costDelta: 500, stock: 38, skuCode: "SKU-PEP-XL" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_piz_alfredo",
    module: "fastfood",
    name: "White Alfredo Cream Pizza",
    description: "Velvety white garlic Alfredo sauce, grilled chicken cubes, mushrooms & parmesan herb crust",
    costPrice: 460,
    price: 700,
    category: "Pizza",
    skuCode: "SKU-PIZ-ALF",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 35,
    imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "smlxl",
    variants: [
      { id: "var_alf_s", label: "S", price: 700, priceDelta: 0, costDelta: 0, stock: 35, skuCode: "SKU-ALF-S" },
      { id: "var_alf_m", label: "M", price: 1120, priceDelta: 420, costDelta: 160, stock: 35, skuCode: "SKU-ALF-M" },
      { id: "var_alf_l", label: "L", price: 1550, priceDelta: 850, costDelta: 330, stock: 35, skuCode: "SKU-ALF-L" },
      { id: "var_alf_xl", label: "XL", price: 1950, priceDelta: 1250, costDelta: 490, stock: 35, skuCode: "SKU-ALF-XL" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_piz_malai",
    module: "fastfood",
    name: "Peri Peri Malai Boti Pizza",
    description: "Creamy marinated malai boti pieces tossed in spicy peri peri sauce with fresh mozzarella",
    costPrice: 440,
    price: 680,
    category: "Pizza",
    skuCode: "SKU-PIZ-MAL",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 45,
    imageUrl: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "smlxl",
    variants: [
      { id: "var_mal_s", label: "S", price: 680, priceDelta: 0, costDelta: 0, stock: 45, skuCode: "SKU-MAL-S" },
      { id: "var_mal_m", label: "M", price: 1090, priceDelta: 410, costDelta: 160, stock: 45, skuCode: "SKU-MAL-M" },
      { id: "var_mal_l", label: "L", price: 1490, priceDelta: 810, costDelta: 320, stock: 45, skuCode: "SKU-MAL-L" },
      { id: "var_mal_xl", label: "XL", price: 1890, priceDelta: 1210, costDelta: 480, stock: 45, skuCode: "SKU-MAL-XL" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── BROAST & WINGS (4 items) ──
  {
    id: "prod_ff_broast_quarter",
    module: "fastfood",
    name: "Golden Crispy Chicken Broast",
    description: "Quarter chicken deep fried in seasoned crisp batter, served with garlic dip & dinner roll",
    costPrice: 290,
    price: 490,
    category: "Broast & Wings",
    skuCode: "SKU-BRO-01",
    rackLocation: "Fryer 1",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 50,
    imageUrl: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_wings_spicy",
    module: "fastfood",
    name: "Hot Buffalo Wings (8 Pcs)",
    description: "Crispy fried wings drenched in tangy hot buffalo sauce served with cool ranch dressing",
    costPrice: 260,
    price: 450,
    category: "Broast & Wings",
    skuCode: "SKU-BRO-02",
    rackLocation: "Fryer 2",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 45,
    imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_tenders",
    module: "fastfood",
    name: "Crispy Chicken Tenders (5 Pcs)",
    description: "100% boneless breast chicken strips double dipped for extreme crunch with honey mustard",
    costPrice: 240,
    price: 420,
    category: "Broast & Wings",
    skuCode: "SKU-BRO-03",
    rackLocation: "Fryer 1",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 55,
    imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_popcorn",
    module: "fastfood",
    name: "Crunchy Popcorn Chicken Bucket",
    description: "Tender bite-sized pieces of crispy seasoned chicken served in a shareable bucket",
    costPrice: 210,
    price: 380,
    category: "Broast & Wings",
    skuCode: "SKU-BRO-04",
    rackLocation: "Fryer 2",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 40,
    imageUrl: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── WRAPS & SHAWARMA (4 items) ──
  {
    id: "prod_ff_twister_wrap",
    module: "fastfood",
    name: "Crispy Chicken Twister Wrap",
    description: "Crispy chicken strips wrapped in a warm flour tortilla with pepper mayo & crisp lettuce",
    costPrice: 260,
    price: 440,
    category: "Wraps & Shawarma",
    skuCode: "SKU-WRP-01",
    rackLocation: "Kitchen Wrap Station",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 40,
    imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_lebanese_shawarma",
    module: "fastfood",
    name: "Authentic Lebanese Shawarma",
    description: "Sliced marinated rotisserie chicken in fresh pita with toum garlic sauce and pickles",
    costPrice: 190,
    price: 350,
    category: "Wraps & Shawarma",
    skuCode: "SKU-WRP-02",
    rackLocation: "Shawarma Machine",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 70,
    imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_beef_shawarma",
    module: "fastfood",
    name: "Spicy Beef Shawarma Roll",
    description: "Prime spiced beef shavings wrapped with pickled turnips, fresh parsley & sesame tahini",
    costPrice: 310,
    price: 520,
    category: "Wraps & Shawarma",
    skuCode: "SKU-WRP-03",
    rackLocation: "Shawarma Machine",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 35,
    imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_quesadilla",
    module: "fastfood",
    name: "Chicken Cheese Quesadilla",
    description: "Pan toasted tortilla stuffed with spiced fajita chicken, melted cheese & house salsa",
    costPrice: 280,
    price: 490,
    category: "Wraps & Shawarma",
    skuCode: "SKU-WRP-04",
    rackLocation: "Griddle",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 30,
    imageUrl: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── FRIES & SIDES (3 items) ──
  {
    id: "prod_ff_loaded_fries",
    module: "fastfood",
    name: "Loaded Cheesy Pizza Fries",
    description: "Crispy golden french fries loaded with cheddar cheese sauce, chicken chunks & jalapeños",
    costPrice: 270,
    price: 480,
    category: "Fries & Sides",
    skuCode: "SKU-FRIES-LOAD",
    rackLocation: "Fryer 2",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 60,
    imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_curly_fries",
    module: "fastfood",
    name: "Crispy Peri Peri Curly Fries",
    description: "Spiral seasoned potato fries tossed in tangy peri-peri chaat seasoning",
    costPrice: 140,
    price: 290,
    category: "Fries & Sides",
    skuCode: "SKU-FRIES-CURL",
    rackLocation: "Fryer 2",
    unit: "PCS",
    minThreshold: 20,
    openingStock: 75,
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_onion_rings",
    module: "fastfood",
    name: "Crispy Battered Onion Rings (8 Pcs)",
    description: "Thick sliced sweet onions in crunchy seasoned batter served with spicy BBQ mayo dip",
    costPrice: 120,
    price: 260,
    category: "Fries & Sides",
    skuCode: "SKU-SIDE-RING",
    rackLocation: "Fryer 2",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 50,
    imageUrl: "https://images.unsplash.com/photo-1619860860774-1e2e17343432?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── COLD DRINKS (3 items with Can, 500ml, 1.0L, 1.5L) ──
  {
    id: "prod_ff_pepsi_family",
    module: "fastfood",
    name: "Pepsi Cola Chilled",
    description: "Classic ice-cold fizzy soda available in all sizes from 250ml Can to 1.5 Liter bottle",
    costPrice: 85,
    price: 120,
    category: "Cold Drinks",
    skuCode: "SKU-DRK-PEPSI",
    rackLocation: "Beverage Chiller",
    unit: "PCS",
    minThreshold: 20,
    openingStock: 120,
    imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "drinks",
    variants: [
      { id: "var_pep_can", label: "Can (250ml)", price: 120, priceDelta: 0, costDelta: 0, stock: 40, skuCode: "SKU-PEP-CAN" },
      { id: "var_pep_500", label: "500ml", price: 160, priceDelta: 40, costDelta: 20, stock: 40, skuCode: "SKU-PEP-500" },
      { id: "var_pep_1l", label: "1.0 Liter", price: 220, priceDelta: 100, costDelta: 45, stock: 20, skuCode: "SKU-PEP-1L" },
      { id: "var_pep_15l", label: "1.5 Liter", price: 280, priceDelta: 160, costDelta: 70, stock: 20, skuCode: "SKU-PEP-15L" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: false,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_7up_family",
    module: "fastfood",
    name: "7Up Lemon Lime Chilled",
    description: "Refreshing sparkling lemon-lime clear soda served ice cold",
    costPrice: 85,
    price: 120,
    category: "Cold Drinks",
    skuCode: "SKU-DRK-7UP",
    rackLocation: "Beverage Chiller",
    unit: "PCS",
    minThreshold: 20,
    openingStock: 100,
    imageUrl: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "drinks",
    variants: [
      { id: "var_7up_can", label: "Can (250ml)", price: 120, priceDelta: 0, costDelta: 0, stock: 35, skuCode: "SKU-7UP-CAN" },
      { id: "var_7up_500", label: "500ml", price: 160, priceDelta: 40, costDelta: 20, stock: 35, skuCode: "SKU-7UP-500" },
      { id: "var_7up_1l", label: "1.0 Liter", price: 220, priceDelta: 100, costDelta: 45, stock: 15, skuCode: "SKU-7UP-1L" },
      { id: "var_7up_15l", label: "1.5 Liter", price: 280, priceDelta: 160, costDelta: 70, stock: 15, skuCode: "SKU-7UP-15L" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: false,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_mint_margarita",
    module: "fastfood",
    name: "Fresh Mint Margarita Mocktail",
    description: "Freshly crushed garden mint leaves, ice cubes, black salt, lemon juice & soda fizz",
    costPrice: 90,
    price: 260,
    category: "Cold Drinks",
    skuCode: "SKU-DRK-MINT",
    rackLocation: "Bar Counter",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 60,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── MINERAL WATER (2 items with Small 500ml, Large 1.5L) ──
  {
    id: "prod_ff_nestle_water",
    module: "fastfood",
    name: "Nestlé Pure Life Mineral Water",
    description: "Pure safe drinking mineral water enriched with natural essential minerals",
    costPrice: 38,
    price: 60,
    category: "Mineral Water",
    skuCode: "SKU-WAT-NESTLE",
    rackLocation: "Beverage Chiller",
    unit: "PCS",
    minThreshold: 25,
    openingStock: 150,
    imageUrl: "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "water",
    variants: [
      { id: "var_nes_sm", label: "Small (500ml)", price: 60, priceDelta: 0, costDelta: 0, stock: 100, skuCode: "SKU-NES-500" },
      { id: "var_nes_lg", label: "Large (1.5L)", price: 110, priceDelta: 50, costDelta: 25, stock: 50, skuCode: "SKU-NES-15L" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: false,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_aquafina_water",
    module: "fastfood",
    name: "Aquafina Premium Mineral Water",
    description: "Crystal pure chilled bottled drinking water",
    costPrice: 38,
    price: 60,
    category: "Mineral Water",
    skuCode: "SKU-WAT-AQUA",
    rackLocation: "Beverage Chiller",
    unit: "PCS",
    minThreshold: 25,
    openingStock: 120,
    imageUrl: "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    hasVariants: true,
    pricingType: "water",
    variants: [
      { id: "var_aqua_sm", label: "Small (500ml)", price: 60, priceDelta: 0, costDelta: 0, stock: 80, skuCode: "SKU-AQUA-500" },
      { id: "var_aqua_lg", label: "Large (1.5L)", price: 110, priceDelta: 50, costDelta: 25, stock: 40, skuCode: "SKU-AQUA-15L" }
    ],
    itemRole: "food_menu",
    isKitchenRouted: false,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── DESSERTS & SHAKES (3 items) ──
  {
    id: "prod_ff_choc_shake",
    module: "fastfood",
    name: "Belgian Chocolate Thick Shake",
    description: "Rich blended Belgian dark chocolate gelato, whole milk & whipped cream topping",
    costPrice: 180,
    price: 380,
    category: "Desserts & Shakes",
    skuCode: "SKU-SHK-CHOC",
    rackLocation: "Dessert Station",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 45,
    imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_lotus_shake",
    module: "fastfood",
    name: "Lotus Biscoff Cream Shake",
    description: "Original caramelized Biscoff spread blended with vanilla ice cream and crunchy biscuit bits",
    costPrice: 220,
    price: 460,
    category: "Desserts & Shakes",
    skuCode: "SKU-SHK-LOTUS",
    rackLocation: "Dessert Station",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 40,
    imageUrl: "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_ff_molten_cake",
    module: "fastfood",
    name: "Warm Molten Lava Chocolate Cake",
    description: "Freshly baked individual chocolate sponge cake with flowing warm chocolate center",
    costPrice: 190,
    price: 420,
    category: "Desserts & Shakes",
    skuCode: "SKU-DES-LAVA",
    rackLocation: "Baking Oven",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 35,
    imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "food_menu",
    isKitchenRouted: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ════════════════════════════════════════════════════════════════
  // ── MINIMART / RETAIL PRODUCTS (Cosmetics, Garments, Shoes, Toys, General) ──
  // ════════════════════════════════════════════════════════════════

  // ── 1. COSMETICS & SKINCARE (6 Items) ──
  {
    id: "prod_mm_cream_gp",
    module: "minimart",
    name: "Golden Pearl Beauty Cream",
    description: "Original Pakistani herbal whitening cream for clear glowing skin",
    costPrice: 290,
    price: 380,
    category: "Cosmetics & Skincare",
    skuCode: "8964001284912",
    rackLocation: "Cosmetics Shelf A1",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 60,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_gp_std", label: "30g Jar", price: 380, priceDelta: 0, skuCode: "8964001284912" },
      { id: "v_gp_serum", label: "Serum Pack", price: 520, priceDelta: 140, skuCode: "8964001284929" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_cream_gl",
    module: "minimart",
    name: "Glow & Lovely Multivitamin Cream",
    description: "HD glow & radiant daily face fairness moisturizer (50g)",
    costPrice: 260,
    price: 320,
    category: "Cosmetics & Skincare",
    skuCode: "8961002345671",
    rackLocation: "Cosmetics Shelf A2",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 75,
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_lotion_nivea",
    module: "minimart",
    name: "Nivea Nourishing Body Lotion",
    description: "48h intensive deep moisture body lotion with almond oil",
    costPrice: 680,
    price: 850,
    category: "Cosmetics & Skincare",
    skuCode: "4005808249821",
    rackLocation: "Skincare Shelf B1",
    unit: "PCS",
    minThreshold: 8,
    openingStock: 45,
    imageUrl: "https://images.unsplash.com/photo-1608248597359-322d863f6838?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_nv_125", label: "125ml", price: 550, priceDelta: -300, skuCode: "4005808249814" },
      { id: "v_nv_250", label: "250ml", price: 850, priceDelta: 0, skuCode: "4005808249821" },
      { id: "v_nv_400", label: "400ml", price: 1250, priceDelta: 400, skuCode: "4005808249838" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_powder_ponds",
    module: "minimart",
    name: "Pond's Dreamflower Talcum Powder",
    description: "Pink lily fresh fragrance soft soothing talc for smooth skin",
    costPrice: 210,
    price: 280,
    category: "Cosmetics & Skincare",
    skuCode: "8901030382910",
    rackLocation: "Cosmetics Shelf A3",
    unit: "PCS",
    minThreshold: 12,
    openingStock: 50,
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_pnd_100", label: "100g", price: 280, priceDelta: 0, skuCode: "8901030382910" },
      { id: "v_pnd_200", label: "200g", price: 480, priceDelta: 200, skuCode: "8901030382927" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_nail_rivaj",
    module: "minimart",
    name: "Rivaj UK Long-Lasting Nail Polish",
    description: "Quick-dry salon shine glossy vibrant nail enamel",
    costPrice: 140,
    price: 220,
    category: "Cosmetics & Skincare",
    skuCode: "8964009812344",
    rackLocation: "Cosmetics Display Stand",
    unit: "PCS",
    minThreshold: 20,
    openingStock: 80,
    imageUrl: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_rv_01", label: "#01 Red", price: 220, priceDelta: 0, skuCode: "8964009812344" },
      { id: "v_rv_08", label: "#08 Nude", price: 220, priceDelta: 0, skuCode: "8964009812351" },
      { id: "v_rv_14", label: "#14 Maroon", price: 220, priceDelta: 0, skuCode: "8964009812368" },
      { id: "v_rv_22", label: "#22 Gold", price: 250, priceDelta: 30, skuCode: "8964009812375" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_lip_medora",
    module: "minimart",
    name: "Medora Velvet Matte Lipstick",
    description: "Famous Medora Karachi classic smooth velvet lipstick",
    costPrice: 120,
    price: 180,
    category: "Cosmetics & Skincare",
    skuCode: "8963004123558",
    rackLocation: "Cosmetics Display Stand",
    unit: "PCS",
    minThreshold: 25,
    openingStock: 90,
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_md_201", label: "#201 Red", price: 180, priceDelta: 0, skuCode: "8963004123558" },
      { id: "v_md_205", label: "#205 Pink", price: 180, priceDelta: 0, skuCode: "8963004123565" },
      { id: "v_md_212", label: "#212 Mocha", price: 180, priceDelta: 0, skuCode: "8963004123572" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── 2. MEN'S STITCHED GARMENTS (4 Items) ──
  {
    id: "prod_mm_garment_kurta",
    module: "minimart",
    name: "Men's Stitched Cotton Kurta",
    description: "Premium 100% fine cotton stitched festive & Friday white kurta",
    costPrice: 1600,
    price: 2450,
    category: "Men's Garments",
    skuCode: "8965001122334",
    rackLocation: "Garments Rack G1",
    unit: "PCS",
    minThreshold: 6,
    openingStock: 30,
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_krt_s", label: "S", price: 2450, priceDelta: 0, skuCode: "8965001122334" },
      { id: "v_krt_m", label: "M", price: 2450, priceDelta: 0, skuCode: "8965001122335" },
      { id: "v_krt_l", label: "L", price: 2450, priceDelta: 0, skuCode: "8965001122336" },
      { id: "v_krt_xl", label: "XL", price: 2550, priceDelta: 100, skuCode: "8965001122337" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_garment_suit",
    module: "minimart",
    name: "Men's Stitched Shalwar Kameez",
    description: "Wash-and-wear formal stitched gents suit with ban collar embroidery",
    costPrice: 2600,
    price: 3850,
    category: "Men's Garments",
    skuCode: "8965002233445",
    rackLocation: "Garments Rack G2",
    unit: "PCS",
    minThreshold: 5,
    openingStock: 25,
    imageUrl: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_suit_s", label: "S", price: 3850, priceDelta: 0, skuCode: "8965002233445" },
      { id: "v_suit_m", label: "M", price: 3850, priceDelta: 0, skuCode: "8965002233446" },
      { id: "v_suit_l", label: "L", price: 3850, priceDelta: 0, skuCode: "8965002233447" },
      { id: "v_suit_xl", label: "XL", price: 3950, priceDelta: 100, skuCode: "8965002233448" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_garment_denim",
    module: "minimart",
    name: "Men's Denim Casual Button Shirt",
    description: "Slim fit indigo washed long-sleeve western denim shirt",
    costPrice: 1400,
    price: 2150,
    category: "Men's Garments",
    skuCode: "8965003344556",
    rackLocation: "Garments Rack G3",
    unit: "PCS",
    minThreshold: 8,
    openingStock: 35,
    imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_dnm_s", label: "S", price: 2150, priceDelta: 0, skuCode: "8965003344556" },
      { id: "v_dnm_m", label: "M", price: 2150, priceDelta: 0, skuCode: "8965003344557" },
      { id: "v_dnm_l", label: "L", price: 2150, priceDelta: 0, skuCode: "8965003344558" },
      { id: "v_dnm_xl", label: "XL", price: 2250, priceDelta: 100, skuCode: "8965003344559" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_garment_chino",
    module: "minimart",
    name: "Men's Cotton Stretch Chino Pants",
    description: "Comfort regular fit flat-front casual smart trousers",
    costPrice: 1450,
    price: 2250,
    category: "Men's Garments",
    skuCode: "8965004455667",
    rackLocation: "Garments Rack G4",
    unit: "PCS",
    minThreshold: 8,
    openingStock: 40,
    imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_chn_s", label: "S", price: 2250, priceDelta: 0, skuCode: "8965004455667" },
      { id: "v_chn_m", label: "M", price: 2250, priceDelta: 0, skuCode: "8965004455668" },
      { id: "v_chn_l", label: "L", price: 2250, priceDelta: 0, skuCode: "8965004455669" },
      { id: "v_chn_xl", label: "XL", price: 2350, priceDelta: 100, skuCode: "8965004455670" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── 3. FOOTWEAR & SHOES (4 Items) ──
  {
    id: "prod_mm_shoe_oxford",
    module: "minimart",
    name: "Men's Formal Leather Oxford Shoes",
    description: "Handcrafted pure polished leather lace-up business shoes",
    costPrice: 3200,
    price: 4800,
    category: "Footwear & Shoes",
    skuCode: "8966001122119",
    rackLocation: "Footwear Aisle F1",
    unit: "PCS",
    minThreshold: 5,
    openingStock: 25,
    imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_oxf_40", label: "40", price: 4800, priceDelta: 0, skuCode: "8966001122119" },
      { id: "v_oxf_41", label: "41", price: 4800, priceDelta: 0, skuCode: "8966001122120" },
      { id: "v_oxf_42", label: "42", price: 4800, priceDelta: 0, skuCode: "8966001122121" },
      { id: "v_oxf_43", label: "43", price: 4800, priceDelta: 0, skuCode: "8966001122122" },
      { id: "v_oxf_44", label: "44", price: 4950, priceDelta: 150, skuCode: "8966001122123" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_shoe_jogger",
    module: "minimart",
    name: "Men's Breathable Sports Joggers",
    description: "Lightweight cushioned gym & jogging sneakers with air-sole comfort",
    costPrice: 2200,
    price: 3450,
    category: "Footwear & Shoes",
    skuCode: "8966002233220",
    rackLocation: "Footwear Aisle F2",
    unit: "PCS",
    minThreshold: 6,
    openingStock: 30,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_jog_40", label: "40", price: 3450, priceDelta: 0, skuCode: "8966002233220" },
      { id: "v_jog_41", label: "41", price: 3450, priceDelta: 0, skuCode: "8966002233221" },
      { id: "v_jog_42", label: "42", price: 3450, priceDelta: 0, skuCode: "8966002233222" },
      { id: "v_jog_43", label: "43", price: 3450, priceDelta: 0, skuCode: "8966002233223" },
      { id: "v_jog_44", label: "44", price: 3550, priceDelta: 100, skuCode: "8966002233224" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_shoe_peshawari",
    module: "minimart",
    name: "Traditional Handstitched Peshawari Chappal",
    description: "Authentic double-sole leather tyre tread traditional sandals (Charsadda style)",
    costPrice: 2100,
    price: 3200,
    category: "Footwear & Shoes",
    skuCode: "8966003344331",
    rackLocation: "Footwear Aisle F3",
    unit: "PCS",
    minThreshold: 6,
    openingStock: 28,
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_psh_40", label: "40", price: 3200, priceDelta: 0, skuCode: "8966003344331" },
      { id: "v_psh_41", label: "41", price: 3200, priceDelta: 0, skuCode: "8966003344332" },
      { id: "v_psh_42", label: "42", price: 3200, priceDelta: 0, skuCode: "8966003344333" },
      { id: "v_psh_43", label: "43", price: 3200, priceDelta: 0, skuCode: "8966003344334" },
      { id: "v_psh_44", label: "44", price: 3300, priceDelta: 100, skuCode: "8966003344335" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_shoe_loafer",
    module: "minimart",
    name: "Men's Casual Suede Loafers",
    description: "Soft Italian-cut moccasin driving slip-on shoes for daily comfort",
    costPrice: 2400,
    price: 3650,
    category: "Footwear & Shoes",
    skuCode: "8966004455442",
    rackLocation: "Footwear Aisle F4",
    unit: "PCS",
    minThreshold: 5,
    openingStock: 24,
    imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_lfr_40", label: "40", price: 3650, priceDelta: 0, skuCode: "8966004455442" },
      { id: "v_lfr_41", label: "41", price: 3650, priceDelta: 0, skuCode: "8966004455443" },
      { id: "v_lfr_42", label: "42", price: 3650, priceDelta: 0, skuCode: "8966004455444" },
      { id: "v_lfr_43", label: "43", price: 3650, priceDelta: 0, skuCode: "8966004455445" },
      { id: "v_lfr_44", label: "44", price: 3750, priceDelta: 100, skuCode: "8966004455446" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── 4. TOYS & KIDS (4 Items) ──
  {
    id: "prod_mm_toy_rc_car",
    module: "minimart",
    name: "High-Speed 4WD RC Stunt Car",
    description: "2.4GHz rechargeable all-terrain electric off-road RC car",
    costPrice: 1800,
    price: 2750,
    category: "Toys & Kids",
    skuCode: "8967001122880",
    rackLocation: "Kids Toy Shelf T1",
    unit: "PCS",
    minThreshold: 5,
    openingStock: 22,
    imageUrl: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_toy_doll",
    module: "minimart",
    name: "Deluxe Fashion Doll Dream Set",
    description: "Articulated fashion princess doll with wardrobe gowns and accessories",
    costPrice: 950,
    price: 1450,
    category: "Toys & Kids",
    skuCode: "8967002233991",
    rackLocation: "Kids Toy Shelf T2",
    unit: "PCS",
    minThreshold: 6,
    openingStock: 30,
    imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_toy_blocks",
    module: "minimart",
    name: "120-Piece Creative City Building Blocks",
    description: "Colorful non-toxic interlocking educational building bricks bucket",
    costPrice: 1100,
    price: 1650,
    category: "Toys & Kids",
    skuCode: "8967003344112",
    rackLocation: "Kids Toy Shelf T3",
    unit: "PACK",
    minThreshold: 5,
    openingStock: 25,
    imageUrl: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_toy_cars",
    module: "minimart",
    name: "Die-Cast Metal Sports Car Pack (5-in-1)",
    description: "Scale model high-speed alloy pull-back miniature vehicles set",
    costPrice: 620,
    price: 980,
    category: "Toys & Kids",
    skuCode: "8967004455223",
    rackLocation: "Kids Toy Shelf T4",
    unit: "PACK",
    minThreshold: 8,
    openingStock: 35,
    imageUrl: "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── 5. GENERAL STORE (2 Items) ──
  {
    id: "prod_mm_gen_bags",
    module: "minimart",
    name: "Heavy-Duty Reusable Shopping Bag",
    description: "Eco-friendly branded retail carry shopping bag",
    costPrice: 40,
    price: 80,
    category: "General Store",
    skuCode: "8968001122001",
    rackLocation: "Checkout Counter",
    unit: "PCS",
    minThreshold: 50,
    openingStock: 300,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    variants: [
      { id: "v_bag_med", label: "Medium", price: 50, priceDelta: -30, skuCode: "8968001122001" },
      { id: "v_bag_lrg", label: "Large", price: 80, priceDelta: 0, skuCode: "8968001122002" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_gen_sanitizer",
    module: "minimart",
    name: "Instant Hand Sanitizer Gel (250ml)",
    description: "75% ethyl alcohol anti-bacterial germ protection pump bottle",
    costPrice: 210,
    price: 320,
    category: "General Store",
    skuCode: "8968002233112",
    rackLocation: "Checkout Counter",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 50,
    imageUrl: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── 6. PAINTS & WALL PRIMER (2 Items) ──
  {
    id: "prod_mm_paint_super_emulsion",
    module: "minimart",
    name: "Brighto Super Emulsion (Code: 4550)",
    description: "Interior smooth velvet matt finish luxury wall emulsion. High spreading rate & rich coverage.",
    costPrice: 2800,
    price: 3300,
    category: "Paints & Wall Primer",
    skuCode: "4550-BRT-EMUL",
    rackLocation: "Paint Rack A-01",
    unit: "GALLON",
    minThreshold: 8,
    openingStock: 45,
    imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    pricingType: "paint_packs",
    variants: [
      { id: "v_paint_4550_qtr", label: "Quarter (1L) - Shade 4550", price: 950, priceDelta: -2350, costDelta: 800, skuCode: "4550-QTR" },
      { id: "v_paint_4550_gal", label: "Gallon (4L) - Shade 4550", price: 3300, priceDelta: 0, costDelta: 2800, skuCode: "4550-GAL" },
      { id: "v_paint_4550_bal", label: "Balti (16L) - Shade 4550", price: 11200, priceDelta: 7900, costDelta: 9500, skuCode: "4550-BAL" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_paint_weather_sheet",
    module: "minimart",
    name: "Brighto Weather Sheet (Code: 3025)",
    description: "Heavy-duty exterior wall protector with 100% pure acrylic & anti-fungal silicon protection.",
    costPrice: 3400,
    price: 4100,
    category: "Paints & Wall Primer",
    skuCode: "3025-BRT-WTHR",
    rackLocation: "Paint Rack A-02",
    unit: "GALLON",
    minThreshold: 6,
    openingStock: 38,
    imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    pricingType: "paint_packs",
    variants: [
      { id: "v_paint_3025_qtr", label: "Quarter (1L) - Shade 3025", price: 1150, priceDelta: -2950, costDelta: 950, skuCode: "3025-QTR" },
      { id: "v_paint_3025_gal", label: "Gallon (4L) - Shade 3025", price: 4100, priceDelta: 0, costDelta: 3400, skuCode: "3025-GAL" },
      { id: "v_paint_3025_bal", label: "Balti (16L) - Shade 3025", price: 14200, priceDelta: 10100, costDelta: 12000, skuCode: "3025-BAL" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── 7. SANITARY & TAPS (2 Items) ──
  {
    id: "prod_mm_san_bibcock",
    module: "minimart",
    name: "Master Brass Bib Cock Tap (Tooti)",
    description: "Heavy chrome-plated solid brass quarter-turn lever bathroom & washroom tap.",
    costPrice: 1100,
    price: 1450,
    category: "Sanitary & Taps",
    skuCode: "MSTR-BC-101",
    rackLocation: "Sanitary Counter S-01",
    unit: "PCS",
    minThreshold: 12,
    openingStock: 50,
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_san_mixer",
    module: "minimart",
    name: "Sonex Deluxe Basin Mixer Tap",
    description: "Hot & cold dual-control luxury chrome washbasin mixer tap with long durability.",
    costPrice: 3600,
    price: 4850,
    category: "Sanitary & Taps",
    skuCode: "SNX-MX-202",
    rackLocation: "Sanitary Shelf S-02",
    unit: "PCS",
    minThreshold: 5,
    openingStock: 20,
    imageUrl: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },

  // ── 8. HARDWARE & IRON (2 Items) ──
  {
    id: "prod_mm_hw_steel_nails",
    module: "minimart",
    name: "Hardened Steel Construction Nails (Kill)",
    description: "Heavy masonry wire steel nails for wood, concrete framing, and construction.",
    costPrice: 260,
    price: 350,
    category: "Hardware & Iron",
    skuCode: "HW-KILL-25",
    rackLocation: "Hardware Bin H-01",
    unit: "KG",
    minThreshold: 10,
    openingStock: 80,
    imageUrl: "https://images.unsplash.com/photo-1586864387789-628af9feed72?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    hasVariants: true,
    pricingType: "hardware_fasteners",
    variants: [
      { id: "v_hw_kill_500g", label: "0.5 KG", price: 180, priceDelta: -170, costDelta: 130, skuCode: "KILL-500G" },
      { id: "v_hw_kill_1kg", label: "1.0 KG", price: 350, priceDelta: 0, costDelta: 260, skuCode: "KILL-1KG" },
      { id: "v_hw_kill_5kg", label: "5.0 KG Box", price: 1650, priceDelta: 1300, costDelta: 1250, skuCode: "KILL-5KG" },
    ],
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
  {
    id: "prod_mm_hw_nut_bolts",
    module: "minimart",
    name: "Heavy Nut-Bolts & Kable Set (Assorted)",
    description: "High-tensile zinc plated hexagonal bolts with matching washers and lock nuts.",
    costPrice: 750,
    price: 1100,
    category: "Hardware & Iron",
    skuCode: "HW-BLT-BOX",
    rackLocation: "Hardware Bin H-02",
    unit: "BOX",
    minThreshold: 6,
    openingStock: 35,
    imageUrl: "https://images.unsplash.com/photo-1508873696983-2df57036476b?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    itemRole: "retail_product",
    isKitchenRouted: false,
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-05T00:00:00.000Z",
  },
];

export function isDemoLicense(): boolean {
  if (typeof window === "undefined") return false;
  const activeKey = (
    localStorage.getItem("omnipos_active_key") ||
    localStorage.getItem("omnipos_license_key") ||
    ""
  ).toUpperCase().trim();
  if (!activeKey) return true;
  return activeKey.includes("DEMO") || activeKey === "OMNI-DEMO-2026-LIVE";
}

export async function ensureInitialData(forceDemo: boolean = false): Promise<void> {
  if (typeof window === "undefined") return;

  let activeKey = (
    localStorage.getItem("omnipos_active_key") ||
    localStorage.getItem("omnipos_license_key") ||
    ""
  ).toUpperCase().trim();

  if (!activeKey && (window as any).posApi?.getLicenseMeta) {
    try {
      const meta = await (window as any).posApi.getLicenseMeta();
      if (meta?.key) {
        activeKey = String(meta.key).toUpperCase().trim();
        localStorage.setItem("omnipos_active_key", meta.key);
      }
    } catch {
      /* ignore */
    }
  }

  // Real client license: starts with OMNI- and does not contain DEMO
  const isRealClient =
    Boolean(activeKey) &&
    activeKey.startsWith("OMNI-") &&
    !activeKey.includes("DEMO") &&
    activeKey !== "OMNI-DEMO-2026-LIVE";

  if (isRealClient && !forceDemo) {
    // For real production clients: NEVER seed mock dummy products!
    return;
  }

  // For DEMO mode: ensure full rich sample catalog exists in Dexie & LocalStorage
  try {
    // 0. Remove obsolete old minimart grocery dummy products/categories if present
    const obsoleteCatIds = ["cat_mm_grocery", "cat_mm_dairy", "cat_mm_veg", "cat_mm_snacks", "cat_mm_gen"];
    const obsoleteProdIds = ["prod_1788365698088", "prod_1788365698094", "prod_mm_milk", "prod_1788365660478", "prod_mm_chips", "prod_mm_bags", "prod_mm_toy"];
    try {
      await offlineDb.categories.bulkDelete(obsoleteCatIds);
      await offlineDb.products.bulkDelete(obsoleteProdIds);
    } catch {
      /* ignore */
    }

    // 1. Bulk put all initial products into Dexie
    await offlineDb.products.bulkPut(INITIAL_PRODUCTS);

    // 2. Dual-cache in localStorage without losing existing custom products
    let currentStored = storage.getList<Product>(KEYS.products);
    currentStored = currentStored.filter((p) => !obsoleteProdIds.includes(p.id));
    const prodMap = new Map(currentStored.map((p) => [p.id, p]));
    INITIAL_PRODUCTS.forEach((p) => {
      prodMap.set(p.id, p);
    });
    storage.setList(KEYS.products, Array.from(prodMap.values()));

    // 3. Ensure all categories are in Dexie and LocalStorage
    await offlineDb.categories.bulkPut(INITIAL_CATEGORIES);
    let currentCats = storage.getList<Category>(KEYS.categories);
    currentCats = currentCats.filter((c) => !obsoleteCatIds.includes(c.id));
    const catMap = new Map(currentCats.map((c) => [c.id, c]));
    INITIAL_CATEGORIES.forEach((c) => {
      catMap.set(c.id, c);
    });
    storage.setList(KEYS.categories, Array.from(catMap.values()));

    // 4. Ensure realistic sample orders exist for Dashboard Graphs (if fewer than 10 orders exist)
    await ensureDashboardSeedOrders();
  } catch (err) {
    console.warn("[OfflineDB] Dexie seed check error:", err);
  }
}

export async function ensureDashboardSeedOrders(force = false): Promise<void> {
  try {
    const demoCleared = typeof window !== 'undefined' && localStorage.getItem('omnipos_demo_orders_cleared') === 'true';
    if (demoCleared && !force) return;

    const existingOrdersCount = await offlineDb.orders.count();
    if (existingOrdersCount >= 15 && !force) return;

    const now = new Date();
    const sampleOrders: any[] = [];

    // Helper to generate a date offset in hours/days
    const makeDate = (daysAgo: number, hour: number, minute: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, minute, Math.floor(Math.random() * 50));
      return d.toISOString();
    };

    const fastFoodMenu = [
      { id: 'prod_ff_zinger', name: 'Crispy Zinger Burger', price: 550 },
      { id: 'prod_ff_piz_crown', name: 'Crown Crust Royal Pizza', price: 1200, variantLabel: 'M' },
      { id: 'prod_ff_loaded_fries', name: 'Loaded Cheesy Pizza Fries', price: 480 },
      { id: 'prod_ff_pepsi_family', name: 'Pepsi Cola Chilled', price: 160, variantLabel: '500ml' },
      { id: 'prod_ff_broast_quarter', name: 'Golden Crispy Chicken Broast', price: 490 },
      { id: 'prod_ff_smash_beef', name: 'Double Smash Beef Burger', price: 850 },
      { id: 'prod_ff_piz_fajita', name: 'Chicken Fajita Pizza', price: 1050, variantLabel: 'M' },
      { id: 'prod_ff_wings_spicy', name: 'Hot Buffalo Wings (8 Pcs)', price: 450 },
      { id: 'prod_ff_mint_margarita', name: 'Fresh Mint Margarita Mocktail', price: 260 },
      { id: 'prod_ff_molten_cake', name: 'Warm Molten Lava Chocolate Cake', price: 420 },
    ];

    const orderTypes = ['dine-in', 'takeaway', 'delivery'] as const;

    // ── Generate Today's Orders with realistic Lunch (1-3 PM) & Dinner (8-11 PM) Rush ──
    const hourlyDistribution = [
      { hour: 11, count: 2 },
      { hour: 12, count: 4 },
      { hour: 13, count: 7 }, // Lunch Peak
      { hour: 14, count: 8 }, // Lunch Peak
      { hour: 15, count: 4 },
      { hour: 16, count: 2 },
      { hour: 17, count: 3 },
      { hour: 18, count: 5 },
      { hour: 19, count: 6 },
      { hour: 20, count: 9 }, // Dinner Peak
      { hour: 21, count: 11 }, // Dinner Peak
      { hour: 22, count: 8 }, // Dinner Peak
      { hour: 23, count: 3 },
    ];

    let orderIndex = 101;

    for (const slot of hourlyDistribution) {
      for (let i = 0; i < slot.count; i++) {
        const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
        const itemsCount = 1 + Math.floor(Math.random() * 3);
        const lines: any[] = [];
        let subtotal = 0;

        for (let j = 0; j < itemsCount; j++) {
          const item = fastFoodMenu[Math.floor(Math.random() * fastFoodMenu.length)];
          const qty = 1 + Math.floor(Math.random() * 2);
          subtotal += item.price * qty;
          lines.push({
            productId: item.id,
            name: item.name,
            unitPrice: item.price,
            quantity: qty,
            variantLabel: item.variantLabel,
          });
        }

        // Recent orders may still be in cooking or ready
        let stage: 'paid' | 'kot' | 'billed' = 'paid';
        if (slot.hour >= now.getHours() - 1 && i === slot.count - 1) {
          stage = Math.random() > 0.5 ? 'kot' : 'billed';
        }

        const orderDate = makeDate(0, slot.hour, Math.floor(Math.random() * 55));
        sampleOrders.push({
          id: `ord_ff_demo_${orderIndex++}`,
          module: 'fastfood',
          stage,
          orderType,
          tableNo: orderType === 'dine-in' ? `T-${1 + (orderIndex % 12)}` : undefined,
          tokenNo: orderIndex,
          customerName: orderType === 'delivery' ? `Customer #${orderIndex}` : undefined,
          deliveryAddress: orderType === 'delivery' ? 'Sector F-7/2, Islamabad' : undefined,
          lines,
          discountPercent: 0,
          paymentMethod: Math.random() > 0.3 ? 'cash' : 'card',
          synced: 1,
          createdAt: orderDate,
        });
      }
    }

    // ── Generate Past 6 Days Orders for Weekly Comparison ──
    for (let day = 1; day <= 6; day++) {
      const dailyCount = 18 + Math.floor(Math.random() * 15);
      for (let k = 0; k < dailyCount; k++) {
        const hour = 12 + Math.floor(Math.random() * 11);
        const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
        const item = fastFoodMenu[Math.floor(Math.random() * fastFoodMenu.length)];
        const lines = [
          {
            productId: item.id,
            name: item.name,
            unitPrice: item.price,
            quantity: 1 + Math.floor(Math.random() * 2),
            variantLabel: item.variantLabel,
          },
        ];

        sampleOrders.push({
          id: `ord_ff_hist_${day}_${k}`,
          module: 'fastfood',
          stage: 'paid',
          orderType,
          tokenNo: 100 + k,
          lines,
          discountPercent: 0,
          paymentMethod: 'cash',
          synced: 1,
          createdAt: makeDate(day, hour, Math.floor(Math.random() * 55)),
        });
      }
    }

    // ── Generate Mini Mart Sample Orders ──
    const miniMartItems = [
      { id: 'prod_mm_toy', name: 'Barbie Doll Toy', price: 550 },
      { id: 'prod_1788365698088', name: 'Cooking Oil Refill', price: 480 },
      { id: 'prod_mm_milk', name: 'Fresh Milk (1 Liter)', price: 270 },
      { id: 'prod_mm_chips', name: 'Potato Chips (Family Pack)', price: 150 },
    ];

    for (let m = 0; m < 25; m++) {
      const item = miniMartItems[Math.floor(Math.random() * miniMartItems.length)];
      sampleOrders.push({
        id: `ord_mm_demo_${m}`,
        module: 'minimart',
        stage: 'paid',
        orderType: 'takeaway',
        lines: [{ productId: item.id, name: item.name, unitPrice: item.price, quantity: 1 + (m % 3) }],
        discountPercent: 0,
        paymentMethod: 'cash',
        synced: 1,
        createdAt: makeDate(m % 3, 11 + (m % 10), Math.floor(Math.random() * 55)),
      });
    }

    await offlineDb.orders.bulkPut(sampleOrders);
  } catch (e) {
    console.warn('[SeedData] ensureDashboardSeedOrders error:', e);
  }
}

export async function clearDashboardSeedOrders(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('omnipos_demo_orders_cleared', 'true');
    }
    const all = await offlineDb.orders.toArray();
    const demoIds = all
      .filter((o) => o.id.startsWith('ord_ff_demo_') || o.id.startsWith('ord_ff_hist_') || o.id.startsWith('ord_mm_demo_'))
      .map((o) => o.id);
    if (demoIds.length > 0) {
      await offlineDb.orders.bulkDelete(demoIds);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_orders_updated'));
    }
  } catch (err) {
    console.warn('[SeedData] clearDashboardSeedOrders error:', err);
  }
}

export async function createLiveTestOrder(module: 'fastfood' | 'minimart' = 'fastfood'): Promise<void> {
  const now = new Date();
  const token = Math.floor(10 + Math.random() * 89);
  const testOrder: any = {
    id: `ord_live_${Date.now()}`,
    module,
    stage: 'paid',
    orderType: 'takeaway',
    tokenNo: token,
    customerName: `Live Test Customer #${token}`,
    lines: [
      {
        productId: 'prod_ff_zinger',
        name: 'Crispy Zinger Burger',
        unitPrice: 550,
        quantity: 1,
      },
      {
        productId: 'prod_ff_pepsi_family',
        name: 'Pepsi Cola Chilled',
        unitPrice: 160,
        quantity: 1,
        variantLabel: '500ml',
      },
    ],
    discountPercent: 0,
    totalAmount: 710,
    paymentMethod: 'cash',
    synced: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await offlineDb.orders.put(testOrder);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pos_orders_updated', { detail: testOrder }));
  }
}

