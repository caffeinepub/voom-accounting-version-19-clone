# Voom Accounting

## Current State
ExpenseView has categories: Salary, CNG Gas, Petrol, Diesel, Commission to Vendor, Toll Charges, Parking Charges. No pagination on entry lists.

## Requested Changes (Diff)

### Add
- ExpenseCategory enum values: fraud, maintenanceAndRepair, otherExpenses, purchase
- Pagination (25 per page, newest first) to IncomeView and ExpenseView entry lists
- Page navigation controls at bottom of each entry list

### Modify
- ExpenseView: Add new categories to dropdown in form and filter, sort newest first
- IncomeView: Sort entries newest first

### Remove
- Nothing

## Implementation Plan
1. Regenerate Motoko backend to include new ExpenseCategory values
2. Update ExpenseView with new categories and pagination
3. Update IncomeView with pagination
