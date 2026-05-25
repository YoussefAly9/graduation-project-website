import Product from '../models/Product.js';
import RobotController from '../models/RobotController.js';
import { seedProducts } from '../data/products.js';
import { defaultControllers } from '../data/controllers.js';

const initializeData = async () => {
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany(seedProducts);
    // eslint-disable-next-line no-console
    console.log(`Seeded ${seedProducts.length} products.`);
  }

  const controllerCount = await RobotController.countDocuments();
  if (controllerCount === 0) {
    await RobotController.insertMany(defaultControllers);
    // eslint-disable-next-line no-console
    console.log(`Registered ${defaultControllers.length} robot controllers.`);
  }

  await Promise.all([Product.syncIndexes(), RobotController.syncIndexes()]);
};

export default initializeData;


