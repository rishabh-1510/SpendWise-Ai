# Tests

## Running Tests

```bash
cd spendwise-ai
npm test
# or
npm run test:run   # Vitest one-shot (no watch)
```

Tests use **Vitest** + **@testing-library/react**. The audit engine tests are pure unit tests with no DOM dependency.

---

## Audit Engine Tests

**File:** `src/utils/auditEngine.test.ts`

### Test 1 — Enterprise plan with small team triggers high-priority recommendation

```
auditEngine › ruleEnterpriseTooSmall › flags enterprise plan under 20 seats
```
Input: Claude Enterprise, 5 seats
Expected: recommendations contains one `priority: "high"` item for Claude mentioning enterprise overhead, `savingsMonthly > 0`

### Test 2 — Team plan for 1 user triggers recommendation

```
auditEngine › ruleTeamPlanUnderused › flags team plan for ≤2 users
```
Input: ChatGPT Business, 1 seat
Expected: recommendations contains one `priority: "high"` item suggesting individual plans, score reduced

### Test 3 — `perSeat` flag respected in spend calculation

```
auditEngine › calculateMonthlyCost › flat plan not multiplied by seats
```
Input: ChatGPT Plus (perSeat: false, price: $20), seats: 10
Expected: `calculateMonthlyCost(plan, 10) === 20` (not 200)

Input: Claude Team Standard (perSeat: true, price: $25), seats: 10
Expected: `calculateMonthlyCost(plan, 10) === 250`

### Test 4 — Tool overlap detection across rows

```
auditEngine › ruleToolOverlap › flags two tools in same category
```
Input: rows = [{ tool: "Cursor", plan: "Pro" }, { tool: "Windsurf", plan: "Pro" }] (both `coding-ide`)
Expected: recommendations contains one item with `priority: "high"` mentioning overlap, `tool` field contains both tool names

### Test 5 — No recommendations for optimal stack

```
auditEngine › runAudit › returns zero recommendations for well-optimised stack
```
Input: rows = [{ tool: "Claude", plan: "Pro", seats: 1, spend: 20 }], teamSize: 1, useCase: "writing"
Expected: `recommendations.length === 0`, `score === 100`, `savingsAnnual === 0`

### Test 6 — Seat count exceeding team size triggers recommendation

```
auditEngine › ruleSeatCountExceedsTeam › flags excess seats vs team size
```
Input: GitHub Copilot Business, 10 seats, teamSize: 6
Expected: recommendations contains item mentioning 4 unused seats, `savingsMonthly === 4 * 19 === 76`

### Test 7 — Score floor enforced

```
auditEngine › runAudit › score never goes below 20
```
Input: 5 rows all triggering high-penalty rules simultaneously
Expected: `result.score >= 20`

---

## Component Tests

**File:** `src/components/report/ReportContent.test.tsx`

### Test 8 — Empty state renders when localStorage is empty

```
ReportContent › renders empty state when no audit-results in localStorage
```
Mocks `localStorage.getItem` to return null, renders `<ReportContent />`, asserts "No audit data found" heading is visible.

### Test 9 — Shared view decodes from URL param

```
ReportContent › shared=true reads from ?data= param not localStorage
```
Encodes a mock `StoredResult` into a `?data=` param, renders `<ReportContent shared={true} />` with that URL, asserts the savings figure from the encoded data appears in the document.

---

## CI

Tests run automatically on every push to `main` via `.github/workflows/ci.yml`:

```yaml
- name: Run tests
  run: npm run test:run
```

Green check on latest commit confirms all 9 tests pass.