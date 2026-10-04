# Backend Handoff: Finance, Subscriptions, Reviews & Support APIs

This document outlines the complete architectural specifications, database schema models, serializers, endpoints, and event integration hooks implemented for the **Grabb Administration Microservice (`admin-service`)**. 

Backend developers can use this guide to maintain, expand, or integrate these endpoints with external payment gateways (e.g., Razorpay, Stripe, Cashfree), background workers (Celery/Redis), and notification microservices.

---

## 1. Database Schema & Models (`admin_api/models.py`)

The following models are registered in Django ORM with UUID primary keys and IST-compatible timestamps:

### 1.1 Finance & Accounting Models
- **`PayoutModel` (`admin_payouts`)**:
  - `id`: `CharField(max_length=64, primary_key=True)` (e.g., `po1`, `po_...`)
  - `recipient_name`: `CharField(max_length=255)`
  - `recipient_type`: `CharField(choices=[('vendor', 'Vendor Shop'), ('driver', 'Delivery Partner')])`
  - `period`: `CharField(max_length=128)` (e.g. `"Aug 01 - Aug 07, 2026"`)
  - `orders_count`: `IntegerField(default=0)`
  - `amount_due`: `DecimalField(max_digits=12, decimal_places=2)`
  - `status`: `CharField(choices=[('pending', 'Pending'), ('paid', 'Paid')], default='pending')`
  - `settled_at`: `DateTimeField(null=True, blank=True)`

- **`CommissionRuleModel` (`admin_commission_rules`)**:
  - `global_commission_pct`: `DecimalField(default=15.00)`
  - `base_delivery_fee`: `DecimalField(default=2.50)`
  - `per_km_rate`: `DecimalField(default=0.80)`
  - `free_threshold`: `DecimalField(default=30.00)`

- **`ShopCommissionOverrideModel` (`admin_shop_commission_overrides`)**:
  - `shop_id`: `CharField(max_length=64)`
  - `shop_name`: `CharField(max_length=255)`
  - `commission_pct`: `DecimalField(max_digits=5, decimal_places=2)`

- **`FinancialReportModel` (`admin_financial_reports`)**:
  - `name`: `CharField(max_length=255)`
  - `period_date`: `CharField(max_length=128)`
  - `total_revenue`: `DecimalField(max_digits=12, decimal_places=2)`
  - `net_payout`: `DecimalField(max_digits=12, decimal_places=2)`
  - `report_format`: `CharField(default='CSV & PDF')`

---

### 1.2 Subscription Plans & Merchant Accounts
- **`SubscriptionPlanModel` (`admin_subscription_plans`)**:
  - `id`: `CharField(max_length=64, primary_key=True)` (e.g., `SUB-PLAN-1`)
  - `name`: `CharField(max_length=128)`
  - `price`: `DecimalField(max_digits=10, decimal_places=2)`
  - `billing_period`: `CharField(default='Monthly')`
  - `order_limit`: `CharField(max_length=128)`
  - `active_subscribers`: `IntegerField(default=0)`
  - `status`: `CharField(choices=[('active', 'Active'), ('inactive', 'Inactive')], default='active')`
  - `features`: `JSONField(default=list)`

- **`ActiveSubscriptionModel` (`admin_active_subscriptions`)**:
  - `id`: `CharField(max_length=64, primary_key=True)` (e.g., `SUB-8921`)
  - `shop_id`: `CharField(max_length=64)`
  - `shop_name`: `CharField(max_length=255)`
  - `owner_name`: `CharField(max_length=255)`
  - `plan_id`: `CharField(max_length=64)`
  - `plan_name`: `CharField(max_length=128)`
  - `start_date`: `DateField()`
  - `expiry_date`: `DateField()`
  - `amount_paid`: `DecimalField(max_digits=10, decimal_places=2)`
  - `auto_renew`: `BooleanField(default=True)`
  - `status`: `CharField(choices=[('active', 'Active'), ('past_due', 'Past Due'), ('cancelled', 'Cancelled')], default='active')`
  - `payment_status`: `CharField(choices=[('paid', 'Paid'), ('pending', 'Pending'), ('failed', 'Failed')], default='paid')`

---

### 1.3 Reviews & Moderation Feed
- **`ReviewFeedbackModel` (`admin_review_feedback`)**:
  - `id`: `CharField(max_length=64, primary_key=True)`
  - `target_type`: `CharField(choices=[('item', 'Item'), ('driver', 'Driver'), ('shop', 'Shop')])`
  - `target_id`: `CharField(max_length=64)`
  - `target_name`: `CharField(max_length=255)`
  - `rating`: `IntegerField()` (1 to 5)
  - `comment`: `TextField()`
  - `author_name`: `CharField(max_length=255)`
  - `author_id`: `CharField(max_length=64, null=True, blank=True)`
  - `order_id`: `CharField(max_length=64)`
  - `is_flagged`: `BooleanField(default=False)`
  - `is_deleted`: `BooleanField(default=False)`

---

### 1.4 Support Tickets & Disputes
- **`SupportTicketModel` (`admin_support_tickets`)**:
  - `id`: `CharField(max_length=64, primary_key=True)` (e.g., `TCK-1042`)
  - `customer_name`: `CharField(max_length=255)`
  - `customer_phone`: `CharField(max_length=32, blank=True)`
  - `subject`: `CharField(max_length=255)`
  - `priority`: `CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium')`
  - `assigned_agent`: `CharField(max_length=128, default='Unassigned')`
  - `status`: `CharField(choices=[('open', 'Open'), ('in-progress', 'In Progress'), ('resolved', 'Resolved')], default='open')`

- **`DisputeModel` (`admin_disputes`)**:
  - `id`: `CharField(max_length=64, primary_key=True)` (e.g., `DSP-501`)
  - `order_id`: `CharField(max_length=64)`
  - `customer_name`: `CharField(max_length=255)`
  - `shop_name`: `CharField(max_length=255)`
  - `driver_name`: `CharField(max_length=255)`
  - `issue`: `TextField()`
  - `refund_requested`: `DecimalField(max_digits=10, decimal_places=2)`
  - `status`: `CharField(choices=[('open', 'Open'), ('resolved', 'Resolved')], default='open')`
  - `liability_split`: `CharField(max_length=64, null=True, blank=True)` (e.g. `'shop'`, `'driver'`, `'platform'`)

---

## 2. API Endpoints Catalog (`admin-service:8004`)

| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/finance/payouts` | List all pending & settled payouts |
| `POST` | `/api/admin/finance/payouts/<pk>/settle` | Mark a payout cycle as settled/paid |
| `GET` / `PATCH` | `/api/admin/finance/commission-rules` | Read or update platform global commission and distance delivery rates |
| `GET` / `POST` | `/api/admin/finance/commission-rules/shops` | List or create custom shop commission overrides |
| `PATCH` / `DELETE` | `/api/admin/finance/commission-rules/shops/<pk>` | Update or remove custom shop override |
| `GET` | `/api/admin/finance/reports` | List generated financial and settlement reports |
| `GET` / `POST` | `/api/admin/subscriptions/plans` | List or create subscription packages |
| `PATCH` / `DELETE` | `/api/admin/subscriptions/plans/<pk>` | Update or delete subscription tier |
| `GET` | `/api/admin/subscriptions/active` | List active shop subscriptions |
| `GET` / `PATCH` / `DELETE` | `/api/admin/subscriptions/active/<pk>` | Read, update, or cancel shop subscription |
| `GET` | `/api/admin/feedback/reviews` | List customer feedback and ratings |
| `PATCH` | `/api/admin/feedback/reviews/<pk>/flag` | Toggle flag for abusive content moderation |
| `PATCH` | `/api/admin/feedback/reviews/<pk>/hide` | Soft-delete / hide review from public listings |
| `GET` / `POST` | `/api/admin/support/tickets` | List or file customer support tickets |
| `GET` / `PATCH` | `/api/admin/support/tickets/<pk>` | Read or update ticket status / assigned agent |
| `GET` / `POST` | `/api/admin/support/tickets/<pk>/messages` | Message thread comments on ticket |
| `GET` / `POST` | `/api/admin/support/tickets/<pk>/notes` | Internal staff notes on ticket |
| `GET` | `/api/admin/support/disputes` | List customer order disputes and damage claims |
| `POST` | `/api/admin/support/disputes/<pk>/refund` | Resolve dispute and bill liability (`shop`, `driver`, `platform`) |

---

## 3. Recommended Production Integrations for Backend Developers

1. **Automated Weekly Payout Batch (Celery Beat)**:
   - Configure a recurring task to calculate net earnings for all shops and riders over the previous Monday-Sunday cycle:
     $$\text{Net Payout} = \text{Gross Orders} - (\text{Gross Orders} \times \text{Commission Rate}) - \text{Refund Deductions}$$
   - Automatically ingest into `PayoutModel` with `status="pending"`.

2. **Automated Refund Ledger Deductions**:
   - When `/api/admin/support/disputes/<pk>/refund` is triggered:
     - If `liability == 'shop'`: deduct refund amount from the shop's upcoming settlement ledger in `vendor-service`.
     - If `liability == 'driver'`: deduct refund amount from the driver's delivery fee wallet in `delivery-service`.
     - If `liability == 'platform'`: log under platform marketing/retention expense account.

3. **Merchant Subscription Auto-Billing Webhook**:
   - Connect `ActiveSubscriptionModel.auto_renew` to Stripe Subscriptions / Razorpay Autopay webhooks.
   - On payment failure, transition `status` to `past_due` and notify merchant via push notification.
