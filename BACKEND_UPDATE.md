### 1. High-Level Architecture

*   **Ingestion Pipeline (Background Tasks + Gemini):** Reads PDFs, extracts rules using Gemini (via google-genai library), and identifies if the current "Global Schema" lacks a necessary field (e.g., "Truck Mileage").
*   **Dynamic Data Store (PostgreSQL):** Uses a hybrid model—Relational for fixed entities (Lenders, Users) and JSONB for dynamic Loan Application data.
*   **Parameter Registry:** A meta-table that defines what fields currently exist in the system (used to generate the Frontend Form dynamically).
*   **Matching Engine:** A Python service that pulls the dynamic data and evaluates it against the stored rules.

---

### 2. Database Schema (PostgreSQL)

To support your idea of "collecting parameters," you need a **Meta-Schema** pattern.

#### A. Core Tables
```sql
-- 1. Lenders
CREATE TABLE lenders (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    description TEXT
);

-- 2. Parameter Registry (The "Global Schema")
-- This tells the Frontend what inputs to show on the form.
CREATE TABLE parameter_definitions (
    id UUID PRIMARY KEY,
    key_name VARCHAR(50) UNIQUE, -- e.g., "annual_revenue", "truck_engine_hours"
    display_label VARCHAR(100),  -- e.g., "Annual Revenue"
    data_type VARCHAR(20),       -- "number", "boolean", "select", "string"
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 3. Loan Applications
CREATE TABLE loan_applications (
    id UUID PRIMARY KEY,
    applicant_name VARCHAR(255),
    -- THIS IS KEY: Store the form data as a JSONB blob based on current parameters
    -- Example: {"fico": 700, "annual_revenue": 500000, "truck_age": 5}
    form_data JSONB NOT NULL, 
    created_at TIMESTAMP
);
```

#### B. Policy & Rules Tables
Instead of hardcoding columns for rules, we store them as structured logic (Normalizing the Policy).

```sql
-- 4. Policies (A lender can have multiple programs/tiers)
CREATE TABLE policies (
    id UUID PRIMARY KEY,
    lender_id UUID REFERENCES lenders(id),
    name VARCHAR(100), -- e.g., "Tier A - Preferred"
    min_fit_score INT DEFAULT 0
);

-- 5. Rules (The conditions extracted from PDF)
CREATE TABLE policy_rules (
    id UUID PRIMARY KEY,
    policy_id UUID REFERENCES policies(id),
    
    -- Links to the Parameter Registry
    parameter_key VARCHAR(50) REFERENCES parameter_definitions(key_name), 
    
    operator VARCHAR(20), -- "gt", "lt", "eq", "in", "contains"
    value_comparison JSONB, -- The value to check against (e.g., 650, "CA", 50000)
    
    rule_type VARCHAR(20), -- "eligibility" (knockout) or "scoring" (adds points)
    weight INT DEFAULT 0, -- For scoring logic
    failure_reason TEXT   -- "Credit score too low"
);
```

---

### 3. API Specification (FastAPI)

Here is how the endpoints support your workflow.

#### Group 1: Lender & Ingestion (The "User's Idea" Flow)

**POST** `/lenders/{lender_id}/ingest-guidelines`
*   **Input:** PDF File.
*   **Action:**
    1.  Uploads file to S3/Disk.
    2.  **Triggers Background Task:** `process_lender_pdf` (using FastAPI BackgroundTasks or Celery).
    3.  Returns: `task_id` (Async processing).

**GET** `/parameters`
*   **Action:** Returns list of all `parameter_definitions`.
*   **Frontend Use:** Dynamically renders the Loan Application input form.

**POST** `/parameters`
*   **Action:** specific endpoint to manually register a new parameter if needed.

#### Group 2: The Logic Editing UI

**GET** `/lenders/{lender_id}/policies`
*   **Action:** Returns policies and their associated rules (joined with parameter definitions).

**PUT** `/policies/{policy_id}/rules`
*   **Action:** Allows the user to manually edit the rules the LLM extracted (Human-in-the-loop).

#### Group 3: Loan Processing

**POST** `/applications`
*   **Input:** `{ "applicant_name": "...", "data": { ...dynamic key-values... } }`
*   **Action:** Validates `data` against current `parameter_definitions` and saves to `loan_applications`. Triggers background task `match_application`.

---

### 4. The Background Processing Logic (Async Tasks + Gemini)

This is the most critical part of your specific request. We use **Gemini** via the **google-genai** library for all LLM operations.

#### Workflow 1: `process_lender_pdf`
This runs when a PDF is uploaded.

1.  **Extract Text:** Use Gemini's native PDF support (via google-genai library) to directly process PDF files without separate text extraction.
2.  **Fetch Context:** Get the current list of existing parameters from `parameter_definitions`.
3.  **Gemini Prompt:**
    > "Here is a list of data fields we currently collect: `[fico, revenue, years_in_business]`.
    > Here is a lender's PDF. 
    > 1. Extract all underwriting rules.
    > 2. Map rules to existing fields where possible.
    > 3. If the PDF requires a field we don't have (e.g., 'Bankruptcy within 7 years'), define a **NEW** parameter for it.
    > Return JSON."
4.  **Process Output:**
    *   **If New Params:** Insert into `parameter_definitions` (e.g., key: `has_bankruptcy`, type: `boolean`).
    *   **Insert Rules:** Insert into `policy_rules` mapped to the specific parameters.

#### Workflow 2: `match_application`
This runs when a loan application is submitted.

1.  **Fan-out:** Retrieve all active Lenders/Policies.
2.  **Parallel Execution:** For each policy:
    *   Load `form_data` (JSONB) from the application.
    *   Iterate through `policy_rules`.
    *   **Evaluation:**
        *   *Example:* If rule is `fico_score >= 650`: Check `application.form_data['fico_score'] >= 650`.
    *   **Result:** Return `Matched` (True/False), `Reasoning`, and `FitScore`.
3.  **Persist:** Save results to a `matches` table.

---

### 5. Why this fits the assignment perfectly

1.  **Extensibility (Core Requirement):** By using a `parameter_definitions` table and JSONB for data, you can add "Truck Tire Size" as a requirement tomorrow without migrating the database schema.
2.  **Normalized Schema:** The `policy_rules` table is normalized. You aren't storing rules as random strings; you are storing them as `parameter` + `operator` + `value`.
3.  **Gemini Integration:** Using google-genai library with native PDF support for document processing and rule extraction, eliminating the need for separate OCR.
4.  **UI Feedback:** The API returns "Reasoning" derived from the `failure_reason` column in the `policy_rules` table.

### 6. Example Gemini Prompt for Ingestion

To make this work, your prompt engineering is key.

```python
SYSTEM_PROMPT = """
You are a credit underwriter assistant. 
Your goal is to convert a PDF policy document into a structured JSON format.

Current Schema: {current_schema_list}

Task:
1. Identify every eligibility rule in the text (e.g. "Must have 650+ FICO").
2. If the rule fits a key in Current Schema, use that key.
3. If the rule requires data not in Current Schema, create a new key (snake_case) and define its type.
4. Output a list of rules using this format:
   {
     "rules": [
       {
         "parameter": "fico_score",
         "operator": "gte",
         "value": 650,
         "type": "eligibility",
         "reason": "FICO score must be at least 650"
       },
       {
         "parameter": "truck_age_years",
         "new_parameter_def": {"label": "Age of Truck", "type": "number"}, 
         "operator": "lte",
         "value": 10,
         "type": "eligibility",
         "reason": "Equipment cannot be older than 10 years"
       }
     ]
   }
"""
```