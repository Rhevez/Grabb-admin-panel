# Backend Handoff: Module 9 - Analytics & Dashboard Overview + Catalog Pruning

## 1. Catalog Pruning (Master Mapping & Inventory)
Per requirements, the following admin catalog sections have been removed from the frontend:
- **Catalog / Master Mapping** (`/catalog/master-mapping`)
- **Catalog / Inventory** (`/catalog/inventory`)

### Backend Cleanup Actions Required:
1. **Routes**:
   - Deprecate or remove `master-skus/` and `inventory/monitor/` endpoints in `admin-service/admin_api/urls.py`.
2. **Views & Models**:
   - Clean up or mark as legacy `MasterSKU` and `ShopInventoryMonitor` views in `admin-service/admin_api/views.py` if they are not used by the merchant app.

---

## 2. Analytics & Dashboard Overview API Specification

### Endpoint: `GET /api/admin/analytics/dashboard-summary/`
- **Authentication**: Bearer JWT (`Authorization: Bearer <token>`)
- **Response Format**: `application/json`

### JSON Structure:
```json
{
  "total_sales": 348500.00,
  "total_orders": 1284,
  "total_customers": 892,
  "total_products": 240,
  "sales_growth": "+14.2%",
  "orders_growth": "+8.7%",
  "customers_growth": "+19.4%",
  "products_growth": "+5.1%",
  "sales_by_category": [
    { "category": "Dairy & Breakfast", "total_sales": 115200.00, "order_count": 412 },
    { "category": "Fresh Produce", "total_sales": 89400.00, "order_count": 340 },
    { "category": "Beverages & Drinks", "total_sales": 64300.00, "order_count": 255 },
    { "category": "Snacks & Munchies", "total_sales": 51200.00, "order_count": 182 },
    { "category": "Personal Care", "total_sales": 28400.00, "order_count": 95 }
  ],
  "orders_by_status": [
    { "status": "DELIVERED", "count": 1042, "value": 285400.00 },
    { "status": "PENDING", "count": 86, "value": 24100.00 },
    { "status": "CANCELLED", "count": 64, "value": 18900.00 },
    { "status": "OUT_FOR_DELIVERY", "count": 52, "value": 14200.00 },
    { "status": "ACCEPTED", "count": 40, "value": 5900.00 }
  ],
  "delivery_performance": [
    { "zone": "Central Koramangala", "avg_time_mins": 18, "on_time_rate": 97.4 },
    { "zone": "Indiranagar Hub", "avg_time_mins": 22, "on_time_rate": 94.8 },
    { "zone": "HSR Layout Sector 1-4", "avg_time_mins": 19, "on_time_rate": 96.1 },
    { "zone": "Whitefield ITPL", "avg_time_mins": 27, "on_time_rate": 89.2 },
    { "zone": "Jayanagar 4th Block", "avg_time_mins": 16, "on_time_rate": 98.6 }
  ],
  "customer_segments": [
    { "segment": "VIP High Value (> ₹5,000/mo)", "count": 148, "revenue_share": 44.5 },
    { "segment": "Weekly Regulars (2-4 orders)", "count": 382, "revenue_share": 38.2 },
    { "segment": "Occasional Shoppers", "count": 244, "revenue_share": 12.1 },
    { "segment": "New Signups (< 14 days)", "count": 118, "revenue_share": 5.2 }
  ],
  "top_selling_products": [
    { "name": "Amul Taaza Homogenised Toned Milk 1L", "units_sold": 1420, "revenue": 102240.00 },
    { "name": "Tata Salt Vacuum Evaporated 1kg", "units_sold": 980, "revenue": 27440.00 },
    { "name": "Aashirvaad Shudh Chakki Atta 5kg", "units_sold": 640, "revenue": 179200.00 },
    { "name": "Coca-Cola Zero Sugar Can 300ml", "units_sold": 590, "revenue": 23600.00 },
    { "name": "Fortune Sunlite Refined Sunflower Oil 1L", "units_sold": 510, "revenue": 68850.00 }
  ]
}
```

---

## 3. Frontend Fallback Implementation
- The frontend gracefully renders default aggregate numbers and simulated live series if the backend analytics service is offline or starting up.
- All monetary metrics are strictly formatted in Indian Rupees (`₹`).
- Zero raw emojis are used; all badges and tabs utilize modern SVG icons.
- CSV export is supported dynamically across all 5 analytics tabs (`sales`, `orders`, `delivery`, `customers`, `products`).
