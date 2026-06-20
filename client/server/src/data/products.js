const PRODUCT_IMAGE_FILES = {
  'oil-bottle': 'oil-bottle.jpg',
  ketchup: 'ketchup.jpg',
  'jam-jar': 'jam-jar.jpg',
  chocolate: 'chocolate.jpg',
  sandwich: 'turkey-sandwich.jpg',
  chips: 'excellence-tiger.jpg',
  'water-bottle': 'water-bottle.jpg',
  'juice-box': 'juice-box.jpg',
  'redbull-can': 'redbull-can.jpg',
  milk: 'milk.jpg'
};

const productImage = (slug) => {
  const file = PRODUCT_IMAGE_FILES[slug];
  if (file) {
    return `/images/products/${file}`;
  }
  return '/images/products/placeholder.svg';
};

export const seedProducts = [
  {
    id: 'oil-bottle',
    title: 'Oil Bottle',
    price: 90,
    unit: 'bottle',
    sku: 'PAN-OIL-001',
    stock: 80,
    storageLocation: { zone: 'F', aisle: 'F1', shelf: 'S1', bin: 'BIN-F1-01' },
    weightKg: 1,
    image: productImage('oil-bottle'),
    category: 'snacks',
    isFeatured: true
  },
  {
    id: 'ketchup',
    title: 'Ketchup',
    price: 35,
    unit: 'bottle',
    sku: 'PAN-KET-002',
    stock: 95,
    storageLocation: { zone: 'F', aisle: 'F2', shelf: 'S2', bin: 'BIN-F2-03' },
    weightKg: 0.7,
    image: productImage('ketchup'),
    category: 'snacks',
    isFeatured: true
  },
  {
    id: 'jam-jar',
    title: 'Jam Jar',
    price: 50,
    unit: 'jar',
    sku: 'PAN-JAM-003',
    stock: 70,
    storageLocation: { zone: 'F', aisle: 'F3', shelf: 'S1', bin: 'BIN-F3-05' },
    weightKg: 0.5,
    image: productImage('jam-jar'),
    category: 'snacks',
    isFeatured: true
  },
  {
    id: 'chocolate',
    title: 'Chocolate',
    price: 35,
    unit: 'bar',
    sku: 'SNK-CHO-004',
    stock: 120,
    storageLocation: { zone: 'G', aisle: 'G1', shelf: 'S1', bin: 'BIN-G1-02' },
    weightKg: 0.1,
    image: productImage('chocolate'),
    category: 'snacks',
    isFeatured: true
  },
  {
    id: 'sandwich',
    title: 'Turkey Sandwich',
    price: 90,
    unit: 'each',
    sku: 'BAK-SND-005',
    stock: 45,
    storageLocation: { zone: 'D', aisle: 'D1', shelf: 'S2', bin: 'BIN-D1-04' },
    weightKg: 0.3,
    image: productImage('sandwich'),
    category: 'bakery',
    isPopular: true
  },
  {
    id: 'chips',
    title: 'Excellence Tiger',
    price: 10,
    unit: 'bag',
    sku: 'SNK-CHP-007',
    stock: 150,
    storageLocation: { zone: 'G', aisle: 'G2', shelf: 'S2', bin: 'BIN-G2-06' },
    weightKg: 0.2,
    image: productImage('chips'),
    category: 'snacks',
    isPopular: true
  },
  {
    id: 'water-bottle',
    title: 'Water Bottle',
    price: 15,
    unit: 'bottle',
    sku: 'BEV-WTR-008',
    stock: 200,
    storageLocation: { zone: 'B', aisle: 'B1', shelf: 'S1', bin: 'BIN-B1-02' },
    weightKg: 0.5,
    image: productImage('water-bottle'),
    category: 'beverages',
    isPopular: true
  },
  {
    id: 'juice-box',
    title: 'Apple Juice',
    price: 15,
    unit: 'box',
    sku: 'BEV-JUC-009',
    stock: 110,
    storageLocation: { zone: 'B', aisle: 'B2', shelf: 'S3', bin: 'BIN-B2-08' },
    weightKg: 0.25,
    image: productImage('juice-box'),
    category: 'beverages',
    isPopular: true
  },
  {
    id: 'person',
    title: 'Person',
    price: 0,
    unit: 'each',
    sku: 'GEN-PRS-010',
    stock: 999,
    storageLocation: { zone: 'A', aisle: 'A1', shelf: 'S1', bin: 'BIN-A1-00' },
    weightKg: 0,
    image: productImage('person'),
    category: 'household'
  },
  {
    id: 'redbull-can',
    title: 'Red Bull Can',
    price: 60,
    unit: 'can',
    sku: 'BEV-RDB-011',
    stock: 90,
    storageLocation: { zone: 'F', aisle: 'F4', shelf: 'S2', bin: 'BIN-F4-07' },
    weightKg: 0.4,
    image: productImage('redbull-can'),
    category: 'beverages',
    isPopular: true
  },
  {
    id: 'milk',
    title: 'Milk',
    price: 55,
    unit: 'carton',
    sku: 'DAI-MLK-012',
    stock: 85,
    storageLocation: { zone: 'C', aisle: 'C2', shelf: 'S1', bin: 'BIN-C2-04' },
    weightKg: 1,
    image: productImage('milk'),
    category: 'dairy-eggs',
    isPopular: true
  },
  {
    id: 'basket',
    title: 'Basket',
    price: 55,
    unit: 'each',
    sku: 'HSE-BSK-013',
    stock: 40,
    storageLocation: { zone: 'H', aisle: 'H3', shelf: 'S1', bin: 'BIN-H3-02' },
    weightKg: 0.8,
    image: productImage('basket'),
    category: 'household'
  },
  {
    id: 'box',
    title: 'Box',
    price: 15,
    unit: 'each',
    sku: 'HSE-BOX-014',
    stock: 120,
    storageLocation: { zone: 'H', aisle: 'H4', shelf: 'S2', bin: 'BIN-H4-09' },
    weightKg: 0.5,
    image: productImage('box'),
    category: 'household'
  }
];
