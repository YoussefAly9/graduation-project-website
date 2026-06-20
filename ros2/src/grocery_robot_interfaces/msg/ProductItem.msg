# A single product the robot must pick, with its storage location.
string product_id      # MongoDB product _id (preferred) or empty
string sku             # Product SKU (fallback identifier)
string title           # Human-readable name (for logs/UI)
int32 quantity         # How many units to pick
# Storage location (warehouse coordinates / shelf addressing)
string zone
string aisle
string shelf
string bin
