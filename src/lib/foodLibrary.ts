// Stock whole foods offered in the Fuel search, so the basics work instantly and offline.
// Values are typical per-serving figures. Packaged products come from Open Food Facts instead.
export type LibraryFood = {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const FOOD_LIBRARY: LibraryFood[] = [
  // Protein
  { name: "Chicken Breast, cooked", serving: "100 g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Chicken Thigh, cooked", serving: "100 g", calories: 209, protein: 26, carbs: 0, fat: 10.9 },
  { name: "Ground Beef, 85% lean, cooked", serving: "100 g", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: "Ground Turkey, cooked", serving: "100 g", calories: 203, protein: 27, carbs: 0, fat: 10 },
  { name: "Sirloin Steak, cooked", serving: "100 g", calories: 212, protein: 29, carbs: 0, fat: 10 },
  { name: "Pork Chop, cooked", serving: "100 g", calories: 231, protein: 26, carbs: 0, fat: 13 },
  { name: "Bacon, cooked", serving: "2 slices", calories: 87, protein: 6, carbs: 0.3, fat: 6.7 },
  { name: "Salmon, cooked", serving: "100 g", calories: 206, protein: 22, carbs: 0, fat: 12 },
  { name: "Tuna, canned in water", serving: "1 can (120 g)", calories: 130, protein: 28, carbs: 0, fat: 1 },
  { name: "Shrimp, cooked", serving: "100 g", calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  { name: "Egg, whole", serving: "1 large", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: "Egg Whites", serving: "1/2 cup", calories: 63, protein: 13, carbs: 1, fat: 0.2 },
  { name: "Tofu, firm", serving: "100 g", calories: 144, protein: 17, carbs: 3, fat: 9 },
  { name: "Whey Protein Powder", serving: "1 scoop (30 g)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },

  // Dairy
  { name: "Milk, 2%", serving: "1 cup", calories: 122, protein: 8, carbs: 12, fat: 4.8 },
  { name: "Milk, skim", serving: "1 cup", calories: 83, protein: 8, carbs: 12, fat: 0.2 },
  { name: "Greek Yogurt, plain nonfat", serving: "3/4 cup", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { name: "Cottage Cheese, 2%", serving: "1/2 cup", calories: 92, protein: 12, carbs: 5, fat: 2.6 },
  { name: "Cheddar Cheese", serving: "30 g", calories: 120, protein: 7, carbs: 0.4, fat: 10 },
  { name: "Butter", serving: "1 tbsp", calories: 102, protein: 0.1, carbs: 0, fat: 11.5 },

  // Grains and starches
  { name: "White Rice, cooked", serving: "1 cup", calories: 205, protein: 4.3, carbs: 45, fat: 0.4 },
  { name: "Brown Rice, cooked", serving: "1 cup", calories: 218, protein: 4.5, carbs: 46, fat: 1.6 },
  { name: "Quinoa, cooked", serving: "1 cup", calories: 222, protein: 8, carbs: 39, fat: 3.6 },
  { name: "Pasta, cooked", serving: "1 cup", calories: 220, protein: 8, carbs: 43, fat: 1.3 },
  { name: "Oatmeal, cooked with water", serving: "1 cup", calories: 158, protein: 6, carbs: 27, fat: 3.2 },
  { name: "Rolled Oats, dry", serving: "1/2 cup", calories: 150, protein: 5, carbs: 27, fat: 3 },
  { name: "Whole Wheat Bread", serving: "1 slice", calories: 81, protein: 4, carbs: 14, fat: 1.1 },
  { name: "White Bread", serving: "1 slice", calories: 75, protein: 2.6, carbs: 14, fat: 1 },
  { name: "Bagel, plain", serving: "1 medium", calories: 277, protein: 11, carbs: 55, fat: 1.4 },
  { name: "Flour Tortilla", serving: "1 medium", calories: 144, protein: 3.8, carbs: 24, fat: 3.5 },
  { name: "Potato, baked", serving: "1 medium", calories: 161, protein: 4.3, carbs: 37, fat: 0.2 },
  { name: "Sweet Potato, baked", serving: "1 medium", calories: 103, protein: 2.3, carbs: 24, fat: 0.2 },

  // Fruit
  { name: "Banana", serving: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: "Apple", serving: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: "Orange", serving: "1 medium", calories: 62, protein: 1.2, carbs: 15, fat: 0.2 },
  { name: "Blueberries", serving: "1 cup", calories: 84, protein: 1.1, carbs: 21, fat: 0.5 },
  { name: "Strawberries", serving: "1 cup", calories: 49, protein: 1, carbs: 12, fat: 0.5 },
  { name: "Grapes", serving: "1 cup", calories: 104, protein: 1.1, carbs: 27, fat: 0.2 },
  { name: "Avocado", serving: "1/2 fruit", calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },

  // Vegetables and legumes
  { name: "Broccoli, cooked", serving: "1 cup", calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
  { name: "Spinach, raw", serving: "2 cups", calories: 14, protein: 1.7, carbs: 2.2, fat: 0.2 },
  { name: "Carrots, raw", serving: "1 cup", calories: 52, protein: 1.2, carbs: 12, fat: 0.3 },
  { name: "Green Beans, cooked", serving: "1 cup", calories: 44, protein: 2.4, carbs: 10, fat: 0.4 },
  { name: "Mixed Salad Greens", serving: "2 cups", calories: 18, protein: 1.5, carbs: 3.5, fat: 0.2 },
  { name: "Black Beans, cooked", serving: "1 cup", calories: 227, protein: 15, carbs: 41, fat: 0.9 },
  { name: "Chickpeas, cooked", serving: "1 cup", calories: 269, protein: 15, carbs: 45, fat: 4.2 },
  { name: "Lentils, cooked", serving: "1 cup", calories: 230, protein: 18, carbs: 40, fat: 0.8 },

  // Nuts and fats
  { name: "Peanut Butter", serving: "2 tbsp", calories: 190, protein: 7, carbs: 7, fat: 16 },
  { name: "Almonds", serving: "30 g", calories: 174, protein: 6.4, carbs: 6.5, fat: 15 },
  { name: "Walnuts", serving: "30 g", calories: 196, protein: 4.6, carbs: 4.1, fat: 19.6 },
  { name: "Olive Oil", serving: "1 tbsp", calories: 119, protein: 0, carbs: 0, fat: 13.5 },
];
