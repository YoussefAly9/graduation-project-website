import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5173";
const VIEWPORT = { width: 1366, height: 768 };
const OUTPUT_DIR = path.join("screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

const pagesToCapture = [
  { route: "/", name: "home" },
  { route: "/shop", name: "shop" },
  { route: "/cart", name: "cart" },
  { route: "/orders", name: "orders" },
  { route: "/about", name: "about" },
];

async function addItemsToCart(page) {
  // Add a couple of items from the home page to make the cart view meaningful
  const addButtons = await page.$$("text=Add to cart");
  if (addButtons.length > 0) {
    await addButtons[0].click();
    if (addButtons.length > 1) {
      await addButtons[1].click();
    }
  }
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  for (const entry of pagesToCapture) {
    const url = `${BASE_URL}${entry.route}`;
    await page.goto(url, { waitUntil: "networkidle" });

    // Give React time to render and for fallback data to load
    await page.waitForTimeout(1500);

    if (entry.name === "cart") {
      // Ensure cart has data by adding items just before visiting cart
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await addItemsToCart(page);
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
    }

    const filePath = path.join(OUTPUT_DIR, `${entry.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`Saved ${filePath}`);
  }

  await browser.close();
}

captureScreenshots().catch((error) => {
  console.error("Failed to capture screenshots", error);
  process.exit(1);
});

