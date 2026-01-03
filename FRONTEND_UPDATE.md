### 1. TypeScript Data Models
These interfaces bridge your dynamic backend with the UI.

#### A. The Dynamic Schema (Parameter Registry)
This dictates what the form looks like and what fields exist in the system.
```typescript
type DataType = 'string' | 'number' | 'boolean' | 'select' | 'currency';

interface ParameterDefinition {
  id: string;
  key_name: string;      // e.g., "annual_revenue"
  display_label: string; // e.g., "Annual Revenue"
  data_type: DataType;
  options?: string[];    // For 'select' types (e.g., ["Construction", "Trucking"])
  description?: string;
  is_active: boolean;
}
```

#### B. The Lender & Policy Models
Used for the Admin/Ingestion Dashboard.
```typescript
interface PolicyRule {
  id: string;
  parameter_key: string; // Maps to ParameterDefinition
  operator: 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte' | 'in';
  value_comparison: any; // The threshold value (e.g., 650)
  rule_type: 'eligibility' | 'scoring'; 
  failure_reason: string; // e.g. "Credit score below minimum 650"
}

interface LenderPolicy {
  id: string;
  name: string;         // e.g., "Core Equipment Program"
  rules: PolicyRule[];
  last_updated: string;
}

interface Lender {
  id: string;
  name: string;
  description: string;
  policies: LenderPolicy[];
}
```

#### C. Loan Application & Matching Results
Used for the Applicant view and Results page.
```typescript
interface LoanApplication {
  id: string;
  applicant_name: string;
  created_at: string;
  status: 'processing' | 'completed' | 'failed';
  // The dynamic data blob
  form_data: Record<string, string | number | boolean>; 
}

interface RuleEvaluationResult {
  rule_id: string;
  passed: boolean;
  parameter_label: string; // "FICO Score"
  actual_value: any;       // 600
  threshold_value: any;    // 700
  failure_reason?: string; // "Score 600 is less than required 700"
}

interface MatchResult {
  lender_name: string;
  program_name: string;
  eligible: boolean;
  fit_score: number;       // 0-100
  evaluations: RuleEvaluationResult[]; // Detailed breakdown
}
```

---

### 2. Frontend View Requirements

#### View 1: The Dynamic Loan Application
**Goal:** A form that adapts to the schema. If the LLM added "Truck Mileage" yesterday, the form asks for it today.

*   **Logic:**
    1.  Call `GET /parameters`.
    2.  Map over the array:
        *   If `type === 'number'`, render `<input type="number" />`.
        *   If `type === 'boolean'`, render a Toggle/Checkbox.
        *   If `type === 'select'`, render a Dropdown.
    3.  Group fields logically (e.g., "Business Info", "Guarantor Info") based on prefixes or metadata if time permits, otherwise a flat list is acceptable for the MVP.
*   **Validation:** Basic required field checks.
*   **Submission:** POST payload as a JSON object to `/applications`.

#### View 2: Application Dashboard (List View)
**Goal:** View status of submitted loans.

*   **Components:**
    *   Data Table showing: Applicant Name, Amount Requested, Date, and **Processing Status**.
    *   Status Badge: `Processing` (Yellow, spinning), `Ready` (Green), `Error` (Red).
*   **Real-time aspect:** Poll the status every 2 seconds if the status is `processing` (waiting for Hatchet).

#### View 3: Matching Results (Detail View)
**Goal:** The core deliverables—showing *why* a lender matched or failed.

*   **Header:** Applicant Name & Summary stats (FICO, Revenue, etc.).
*   **Left Column (Matches):**
    *   List of Lenders sorted by `fit_score` (Descending).
    *   Visual: Green Card for "Eligible", Red Card for "Ineligible".
    *   **Fit Score Indicator:** A circular progress bar or percentage badge (e.g., "95% Match").
*   **Right Column/Modal (The Reasoning):**
    *   When a Lender card is clicked, show the `evaluations` array.
    *   **Success Section:** "Criteria Met: Years in Business (5 > 2), Revenue ($1M > $150k)".
    *   **Failure Section:** Highlight in Red. "Rejection Reason: Bankruptcy found in last 7 years."

#### View 4: Lender Policy Manager (The "LLM Interaction" UI)
**Goal:** Upload PDFs and verify the LLM's work.

*   **Upload Area:** Drag & drop PDF area.
*   **Ingestion State:** Show a loading state while Hatchet/LLM processes the PDF (this might take 10-30 seconds).
*   **The "Rule Review" Interface:**
    *   After ingestion, display the extracted rules.
    *   **Dynamic Rule Editor:**
        *   Dropdown to change the `parameter` (e.g., change "credit_score" to "fico_v2").
        *   Dropdown for `operator` (>, <, =).
        *   Input for `value`.
    *   **New Parameter Alert:** If the LLM created a *new* parameter (e.g., `max_truck_mileage`), highlight it so the admin knows the Global Schema has expanded.

### 3. Component Architecture (React)

To keep the code clean (Evaluation Criteria: Code Quality), structure your components like this:

1.  **`DynamicFieldRenderer`**: A generic component that takes a `ParameterDefinition` and returns the correct Tailwind input component.
2.  **`PolicyRuleBuilder`**: A row component containing 3 inputs (Parameter, Operator, Value) used in the Admin view to edit extracted rules.
3.  **`MatchCard`**: Displays the high-level lender result.
4.  **`ReasoningList`**: Iterates through the rule evaluation results and renders them as simple bullet points (Green Checkmarks vs Red X's).

### 4. MVP "Simplifications" (for DECISIONS.md)
Since you only have 48 hours:
1.  **Styling:** Use a pre-built Tailwind component library (like `shadcn/ui` or `DaisyUI`) to avoid writing custom CSS.
2.  **Auth:** Skip authentication. Hardcode a "Demo User" or just leave endpoints open.
3.  **Real-time:** Instead of WebSockets, just use `useQuery` with `refetchInterval` to poll for results.