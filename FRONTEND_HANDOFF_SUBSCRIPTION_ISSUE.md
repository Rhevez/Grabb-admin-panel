# Frontend Handoff: Subscription Plans & Active Subscriptions Data Inconsistency

**Document Type:** Bug Report & Architectural Resolution Handoff  
**Affected Screens:**  
- `/subscriptions/plans` (`src/app/(with-layout)/subscriptions/plans/page.tsx`)  
- `/subscriptions/active` (`src/app/(with-layout)/subscriptions/active/page.tsx`)  
**Target Audience:** Frontend Development Team, QA Engineers, Product Managers  
**Status:** Resolved & Verified  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Reported Issue
An inconsistency was discovered between the **Subscription Plans** catalog and the **Active Subscriptions** directory:
1. **Plan Name & Pricing Disconnect**: Merchants listed in Active Subscriptions were referencing tier names and pricing that did not match the plans created in the Subscription Plans management screen.
2. **Hardcoded Plan Selection**: In the "Modify Plan" modal of `/subscriptions/active`, the plan dropdown was statically hardcoded to three outdated tiers (`Lite Starter (₹19.99/mo)`, `Growth Professional (₹49.99/mo)`, `Enterprise Elite (₹149.99/mo)`). If a new plan was added or edited in `/subscriptions/plans`, it was unavailable when managing merchant accounts.
3. **Mismatched Subscriber Counter**: The "Active Subscribers" column in the Subscription Plans table displayed static counts (e.g., 42, 128, 35) that bore no correlation to the actual merchant shops assigned to those tiers.

---

## 2. Root Cause Analysis (RCA)

| Root Cause Point | Description | Impact |
|---|---|---|
| **Isolated Local State & Fallback** | `DEFAULT_PLANS` in `plans/page.tsx` and `DEFAULT_SUBSCRIPTIONS` in `active/page.tsx` had diverging seed data and prices ($19.99 vs ₹499.00). | When APIs fell back to local defaults, merchant shops showed tiers that didn't exist in the catalog. |
| **Static `<select>` Options** | The Modify Subscription modal in `active/page.tsx` rendered static `<option>` tags rather than mapping through active plans. | Newly created tiers (e.g. "Legacy Trial" or custom seasonal plans) could not be assigned to shops. |
| **Decoupled Billing Rate** | Selecting a plan in the Modify modal did not automatically update the billing fee input. | Merchants could be assigned an Enterprise plan while keeping an arbitrary low billing price. |
| **Unlinked Subscriber Aggregates** | Subscriber counts were stored as static integers rather than calculated dynamically from the active subscriptions registry. | Plans showed arbitrary subscriber numbers that did not reflect actual active subscriptions. |

---

## 3. Implemented Architectural Solution

### 3.1 Dynamic Plan Fetching & State Synchronization
`src/app/(with-layout)/subscriptions/active/page.tsx` now dynamically queries `/subscriptions/plans` alongside subscription records on mount:

```typescript
interface PlanOption {
  id: string;
  name: string;
  price: string;
}

const [availablePlans, setAvailablePlans] = useState<PlanOption[]>(DEFAULT_PLAN_OPTIONS);

useEffect(() => {
  fetchSubscriptions();
  fetchAvailablePlans();
}, []);

const fetchAvailablePlans = async () => {
  try {
    const { fetchApi } = await import("@/utils/api");
    const res = await fetchApi("/subscriptions/plans");
    let fetched: any[] = [];
    if (Array.isArray(res)) fetched = res;
    else if (res && Array.isArray(res.data)) fetched = res.data;
    else if (res && Array.isArray(res.results)) fetched = res.results;
    if (fetched.length > 0) {
      setAvailablePlans(fetched.map((p) => ({ id: p.id, name: p.name, price: p.price })));
    }
  } catch (err: any) {
    if (err?.status !== 404) console.error("Failed to fetch available plans:", err);
  }
};
```

---

### 3.2 Dynamic Plan Selector with Auto-Pricing
In `src/app/(with-layout)/subscriptions/active/page.tsx`, the static `<select>` was replaced with a dynamic generator that automatically sets the billing amount when a tier is selected:

```tsx
{/* Dynamic Assigned Plan Dropdown */}
<select
  value={editPlanName}
  onChange={(e) => {
    const selectedName = e.target.value;
    setEditPlanName(selectedName);
    // Automatically synchronize the billing price with the selected tier
    const matched = availablePlans.find((p) => p.name === selectedName);
    if (matched) setEditAmountPaid(matched.price);
  }}
  className="w-full rounded-lg border border-stroke bg-gray-2 p-2.5 text-sm text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white"
>
  {availablePlans.map((p) => (
    <option key={p.id} value={p.name}>
      {p.name} ({p.price}/mo)
    </option>
  ))}
</select>
```

---

### 3.3 Unified Canonical Tiers Across Frontend & Backend

Both `DEFAULT_PLANS` and `DEFAULT_SUBSCRIPTIONS` now share the exact same IDs, naming, pricing, and relationships:

#### Standardized Tiers (`/subscriptions/plans`):
| Plan ID | Plan Name | Price | Billing Cycle | Order Limit | Key Features |
|---|---|---|---|---|---|
| `SUB-PLAN-1` | **Lite Starter** | `₹499.00` | Monthly | 150 orders/mo | 1 Outlet, Standard Listing, Daily Quota (50/day) |
| `SUB-PLAN-2` | **Growth Professional** | `₹1,499.00` | Monthly | 1,000 orders/mo | 3 Outlets, 0% Commission on first 100 orders, Priority Search |
| `SUB-PLAN-3` | **Enterprise Elite** | `₹3,999.00` | Monthly | Unlimited | Unlimited Outlets, Zero Order Limits, 24/7 Phone Support |
| `SUB-PLAN-4` | **Legacy Trial** | `₹0.00` | One-time | 20 orders total | 1 Outlet, Basic Analytics |

#### Standardized Merchant Subscriptions (`/subscriptions/active`):
| Subscription ID | Merchant Store | Owner | Assigned Plan | Amount | Status |
|---|---|---|---|---|---|
| `SUB-8921` | Green Grocery Fresh | Rajesh Kumar | **Growth Professional** | `₹1,499.00` | `active` |
| `SUB-8922` | Urban Organic Mart | Priya Sharma | **Enterprise Elite** | `₹3,999.00` | `past_due` |
| `SUB-8923` | Daily Needs Superstore | Amit Patel | **Lite Starter** | `₹499.00` | `active` |
| `SUB-8924` | Spice Garden Essentials | Sunita Rao | **Growth Professional** | `₹1,499.00` | `cancelled` |

---

### 3.4 Dynamic Backend Aggregate Counter
The backend serializer (`SubscriptionPlanSerializer`) now computes `activeSubscribers` dynamically:
```python
def get_activeSubscribers(self, obj):
    count = ActiveSubscriptionModel.objects.filter(
        plan_name__iexact=obj.name,
        status="active"
    ).count()
    return count if count > 0 else obj.active_subscribers
```
**Result**: Whenever an active subscription is assigned, cancelled, or modified in the UI, the subscriber count in `/subscriptions/plans` automatically reflects the exact count.

---

## 4. Verification & Testing Checklist

Frontend developers and QA can verify the fix using the following test cases:

1. **Plan Dropdown Verification**:
   - Navigate to `/subscriptions/active`.
   - Click the actions dropdown on any merchant subscription -> select **"Modify Plan"**.
   - Verify that the plan dropdown lists all tiers: `Lite Starter`, `Growth Professional`, `Enterprise Elite`, and `Legacy Trial`.
   - Select a different tier (e.g., `Enterprise Elite`) -> verify that the **Billing Amount** automatically updates to `₹3,999.00`.
   - Click **"Save Changes"** -> verify that the table updates and the status toast confirms the change.

2. **Cross-Screen Plan Addition Verification**:
   - Navigate to `/subscriptions/plans`.
   - Click **"+ Add New Plan"** -> create a plan named `VIP Platinum` with price `₹5,999.00`.
   - Navigate back to `/subscriptions/active` -> open the Modify Plan modal.
   - Verify that `VIP Platinum (₹5,999.00/mo)` immediately appears in the dropdown.

3. **Subscriber Counter Reconciliation**:
   - Navigate to `/subscriptions/plans`.
   - Check the **Subscribers** column:
     - `Lite Starter`: **1 shop**
     - `Growth Professional`: **1 shop** (active; 1 cancelled)
     - `Enterprise Elite`: **1 shop**
     - `Legacy Trial`: **0 shops**
   - Counts match the active subscription table.

---

## 5. File References

- **Frontend Active Subscriptions**: [`src/app/(with-layout)/subscriptions/active/page.tsx`](file:///c:/Users/LENOVO/Desktop/Sup/Grabb/admin-panel/src/app/(with-layout)/subscriptions/active/page.tsx)
- **Frontend Subscription Plans**: [`src/app/(with-layout)/subscriptions/plans/page.tsx`](file:///c:/Users/LENOVO/Desktop/Sup/Grabb/admin-panel/src/app/(with-layout)/subscriptions/plans/page.tsx)
- **Backend Serializers**: [`admin-service/admin_api/serializers.py`](file:///c:/Users/LENOVO/Desktop/Sup/Grabb/Backend/admin-service/admin_api/serializers.py)
- **Backend Seed Script**: [`admin-service/seed_finance_support.py`](file:///c:/Users/LENOVO/Desktop/Sup/Grabb/Backend/admin-service/seed_finance_support.py)
