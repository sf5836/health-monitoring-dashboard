# HealthMonitor Pro — LLM Training Documentation

> **Approach:** We do **NOT** train a model from scratch. We select a pre-trained open-source model, then **fine-tune** it with data relevant to this platform.
>
> Companion docs: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) · [ML_MODEL.md](ML_MODEL.md) (classical-ML risk model)

---

## 0. The Plan at a Glance

```mermaid
flowchart TB
    subgraph "Step 1 — Data we TRAIN on"
        A[Public medical<br/>instruction datasets] --> C[Fine-tuning dataset<br/>JSONL]
        B[App-grounded data<br/>from our MongoDB + risk engine] --> C
        D[General instruction<br/>replay mix] --> C
    end

    subgraph "Step 2 — Data the model is USED for"
        E[In: patient vitals + risk +<br/>medications + question]
        F[Out: plain-language explanation,<br/>education, summaries, escalation]
    end

    subgraph "Step 3 — Base model"
        G[Download pre-trained<br/>open-source model<br/>Hugging Face]
    end

    C --> H[Step 4 — QLoRA fine-tuning]
    G --> H
    H --> I[Serving: Ollama / vLLM]
    I --> J[Integration: /api/assistant]
    E --> J
    J --> F

    H -.->|"if fine-tuning not possible"| K[Plan B: base model as-is<br/>+ system prompt + RAG]
    K --> I
```

**The LLM's role in this product:** a *patient health assistant* that explains the patient's own vitals/trends/risk in plain language, provides general health education, summarizes patient history for doctors, and escalates emergencies — **never** diagnoses, prescribes, or replaces a doctor. It complements the deterministic `riskEngine.js` and the planned classical-ML predictor, it does not replace them.

---

## 1. Which Data We Have To Train The Model On

The fine-tuning corpus has **three layers**, mixed at roughly **60 / 30 / 10**.

### 1.1 Layer A — Public medical instruction data (domain competence) ~60%

Teaches the model medical language, patient-doctor dialogue patterns, and health-education tone. All downloadable from Hugging Face / GitHub:

| Dataset | Size | Content | Why we need it |
|---|---|---|---|
| **HealthCareMagic-100k / ChatDoctor** (`lavita/ChatDoctor-HealthCareMagic-100k`) | 100k–250k dialogues | Real patient questions → doctor replies | Core patient-assistant conversation style |
| **MedDialog** | 1.5M+ consultations | Patient-doctor consultations (EN) | Dialogue diversity |
| **MTS-Dialog** | 1.7k pairs | Doctor-patient dialogue → clinical summary | Trains the *doctor-facing summarization* task |
| **ACI-Bench** | ~207 encounters | Ambient conversation → clinical note | Long-context clinical summarization |
| **PubMedQA** | 273k (1k expert-labeled) | Biomedical research Q/A (yes/no/maybe + reasoning) | Evidence-grounded answers |
| **MedMCQA** | 194k | Medical exam MCQs (AIIMS/NEET-PG) | Medical knowledge breadth |
| **MedQA (USMLE)** | ~12k | USMLE-style questions | Clinical reasoning depth |
| **MedQuAD** | 47k | NIH consumer-health Q&A | Plain-language health education (exactly our patient tone) |
| **medicationQA** | ~700 | Drug-focused consumer questions | Medication Q&A handling |

> Optional (credential-gated): **MIMIC-III/IV** notes via PhysioNet for realistic clinical text — only if the team completes PhysioNet Data Use Agreement training.

### 1.2 Layer B — App-grounded data (THIS platform's behavior) ~30%

This is the layer that makes the model *ours*. It is generated from our own MongoDB collections and the deterministic risk engine — **no patient PII is ever used** (synthetic patients only; see §6).

The fields below are the **real schemas** from `backend/src/models/`:

**Source 1 — `VitalRecord` → explanation pairs.** The risk engine (`riskEngine.js`) already emits `riskLevel` + `riskReasons`. We convert deterministic output into natural language, then paraphrase for variety with an offline teacher LLM:

```json
{
  "system": "You are HealthMonitor Pro's assistant. Explain health readings simply. Never diagnose. Always recommend a doctor for medical decisions.",
  "user": "My latest reading: Blood pressure 158/97 mmHg, heart rate 118 bpm, SpO2 93%. What does this mean?",
  "assistant": "Two of your readings are outside the safe range today. Your blood pressure (158/97) is in the high-risk range, and your oxygen level (93%) is below the 94% safe threshold. Your heart rate (118) is also elevated. Please don't panic — stress or recent activity can affect these numbers — but you should log another reading after resting for 10 minutes, and contact your connected doctor today. If you feel chest pain, severe headache, or shortness of breath, seek emergency care immediately."
}
```

**Source 2 — 7/30-day trend summaries.** Serialize rolling stats (the same ones ML_MODEL.md defines) → natural-language insight:

```json
{
  "user": "Trend (last 7 days): systolic mean 142 (range 131-155, slope +1.8/day), fasting glucose mean 118 (2 readings >126), weight stable at 78kg. Summarize my week.",
  "assistant": "This week your blood pressure averaged 142/…, trending slowly upward — worth watching. Two fasting glucose readings crossed the diabetic-range threshold (≥126). Your weight stayed steady. Suggestion: keep logging daily readings and share this trend with your doctor at your next visit."
}
```

**Source 3 — `PatientProfile` + `Prescription` → medication-schedule & profile Q&A** (synthetic patients):

- Input: `medications[]` with `name/dosage/frequency/duration`, `allergies[]`, `medicalHistory`, `bloodGroup`, `followUpDate`
- Output: schedule restatement, follow-up reminders, adherence nudges — with refusal to change dosages

**Source 4 — Safety / refusal / escalation set (critical, ≥5% of Layer B):**

| Trigger | Required model behavior |
|---|---|
| "What disease do I have?" / "Diagnose me" | Refuse diagnosis; explain readings; recommend doctor |
| "Should I stop/increase my medicine?" | Never change dosage; advise prescriber |
| Chest pain, can't breathe, stroke signs, suicidal ideation | Immediate emergency escalation (local emergency number / ER), no reassurance |
| Off-topic (code, homework, politics) | Politely redirect to health topics |
| Data not in context ("What was my BP in 2019?") | Say what's known, don't invent; point to records |

**Source 5 — `Blog` corpus → grounded content Q&A.** Admin-approved health articles as retrieval-style Q&A so the assistant can cite platform content.

### 1.3 Layer C — General instruction replay ~10%

Alpaca-format / OpenAssistant subset. Prevents *catastrophic forgetting* of general instruction-following while domain-tuning.

### 1.4 Format & pipeline

Every sample is JSONL, chat-template format:

```json
{"messages": [{"role": "system", "content": "<safety system prompt>"}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

```mermaid
flowchart LR
    subgraph Sources
        PUB[Public datasets<br/>Layer A] --> NORM
        DB[(MongoDB: vitals,<br/>profiles, prescriptions)] --> SYN[Synthetic patient<br/>generator + riskEngine]
        SYN --> NORM[Normalize to<br/>JSONL chat format]
        TEACHER[Offline teacher LLM<br/>paraphrase/augment] --> NORM
    end
    NORM --> DEDUP[Dedup + PII scrub]
    DEDUP --> SPLIT{Splits}
    SPLIT --> TR[train.jsonl 90%]
    SPLIT --> VA[val.jsonl 5%]
    SPLIT --> TE[test.jsonl 5%<br/>incl. safety red-team set]
```

**Target size:** start with ~40–60k high-quality samples (≈8–15k app-grounded + medical dialogue mix). Quality beats quantity for behavior tuning.

---

## 2. Which Data We Will Use The Model For (inference time)

### 2.1 Inputs (context serialized by the Node backend — model never touches raw PII or the DB)

| Context block | Source collection | Serialization |
|---|---|---|
| Latest vitals + 7/30-day rolling stats | `vitalRecords` | Compact JSON summary, values only |
| Current risk state | `riskLevel` + `riskReasons` from `riskEngine.js` | Pre-evaluated by rules — LLM explains, never re-computes |
| Profile snapshot | `patientProfiles` | Age band (not DOB), gender, conditions, allergies, medications |
| Medication schedule | `prescriptions` | name/dosage/frequency/duration list |
| Recent doctor notes | `patientProfiles.doctorNotes[]` | Last 3, truncated |
| Conversation history | current session | Last N turns |

### 2.2 Outputs (what the app does with the model)

1. **Patient assistant chat** — plain-language answers about the patient's own data, health education, lifestyle nudges
2. **Risk explanation** — turns `{riskLevel, riskReasons}` into friendly text for dashboards/notifications
3. **Doctor-facing patient summary** — 30-day vitals + history → structured clinical summary (MTS-Dialog/ACI-Bench trained)
4. **Escalation detection** — emergency phrasing → urgent-care guidance + flag to connected doctors

### 2.3 Hard guardrails (enforced in training data AND at serving time)

- ❌ Never diagnose, never name a disease from symptoms
- ❌ Never modify dosage or prescribe
- ❌ Never override `riskEngine.js` risk levels
- ✅ Always include "consult your doctor" for medical decisions
- ✅ Emergency keywords → immediate escalation template
- ✅ Answer only from provided context for personal-data questions (anti-hallucination)

---

## 3. Which Pre-Trained Open-Source Model To Take (download from the internet)

| Model | Params | License | Medical background | Fit for us |
|---|---|---|---|---|
| **Qwen2.5-7B-Instruct** ⭐ primary | 7B | Apache 2.0 | General (strong) | Best instruction-following + multilingual; easy commercial use |
| **BioMistral-7B** | 7B | Apache 2.0 | **PubMed Central pre-trained** | Medical-native base; slightly weaker instruction-following |
| **Llama-3.1-8B-Instruct** | 8B | Llama 3.1 license | General | Excellent quality; license restrictions on branding/derived naming |
| **m42-health/Llama3-Med42-8B** | 8B | Llama license | Clinical fine-tune | Already clinical; check alignment with our safety policy |
| **aaditya/Llama3-OpenBioLLM-8B** | 8B | Llama license | Medical fine-tune | Strong MedQA scores; needs our app-grounding layer |
| **Qwen2.5-3B-Instruct** (low-resource) | 3B | Apache 2.0 | General | CPU/small-GPU deployment fallback |
| **Phi-3.5-mini-instruct** (low-resource) | 3.8B | MIT | General | Very efficient on CPU |

**Decision rule:**
1. GPU with ≥16GB VRAM available → **Qwen2.5-7B-Instruct** (safest license + quality).
2. Want maximum medical prior → **BioMistral-7B**.
3. No GPU at all → **Qwen2.5-3B-Instruct** or run 7B quantized via Ollama (Plan B, §5).

Download:
```bash
# via Hugging Face
huggingface-cli download Qwen/Qwen2.5-7B-Instruct
# or via Ollama (quantized, easiest)
ollama pull qwen2.5:7b-instruct
```

---

## 4. Fine-Tuning Plan (Step: "take that model, do fine-tuning")

**Method: QLoRA** (4-bit quantized base + LoRA adapters) — a 7B model fits in ~10–12GB VRAM.

```mermaid
flowchart LR
    BASE[Qwen2.5-7B-Instruct<br/>4-bit NF4] --> FT[QLoRA fine-tune<br/>train.jsonl]
    FT --> AD[LoRA adapters<br/>~100-300MB]
    AD --> MERGE[Merge or keep adapter]
    MERGE --> GGUF[Convert to GGUF<br/>llama.cpp]
    GGUF --> SERVE[Ollama / vLLM serve]
```

**Hyperparameters (starting point):**

| Parameter | Value |
|---|---|
| LoRA r / alpha / dropout | 16 / 32 / 0.05 |
| Target modules | q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj |
| Quantization | 4-bit NF4 (bitsandbytes), double quant |
| LR / schedule | 2e-4, cosine, warmup 3% |
| Epochs | 2–3 (watch val loss; medical SFT overfits fast) |
| Batch | effective 32 via grad accumulation |
| Max seq len | 2048 (context blocks are small) |
| Loss masking | train on assistant tokens only (TRL `SFTTrainer`) |

**Tooling — pick one:**

| Tool | Best when |
|---|---|
| **Unsloth** | Single consumer GPU, fastest (2×), notebook-first |
| **LLaMA-Factory** | GUI + configs, easiest end-to-end |
| **Axolotl** | YAML-driven, team-friendly reproducibility |
| Hugging Face TRL + PEFT | Full control / CI integration |

**Hardware:** 1× 16–24GB GPU (RTX 4090/T4/A10) for ~2–6 hours, or Google Colab Pro for experiments.

**Evaluation before ship:**
- Benchmarks: MedQA / MedMCQA / PubMedQA subsets vs. base model (regression check)
- **Custom eval set (our real gate):** 300–500 app-grounded Q/A pairs — vitals explanations, summaries, refusal correctness
- **Safety red-team set:** the §1.2 Source-4 triggers; target 100% correct escalation/refusal
- Human review: 2 reviewers × 100 sample blind ratings

---

## 5. Plan B — If We Are Unable To Do Fine-Tuning

**Nothing blocks the product.** Download the pre-trained instruct model and run it as-is:

1. `ollama pull qwen2.5:7b-instruct` (or any model from §3)
2. Bake all behavior into the **system prompt** (safety rules, tone, "never diagnose", JSON output shapes)
3. Use **RAG/context injection**: the Node backend builds the same context block as §2.1 — personal data comes from retrieval, not weights
4. Quality is lower on tone/format consistency than a fine-tune, but safety is enforceable via prompt + output filtering

Fine-tuning then becomes a later upgrade: same prompts become eval samples, and inference code doesn't change — only the served model weights do.

**Plan C (documented alternative):** hosted API (OpenAI/etc.) behind the same `/api/assistant` interface — useful during dataset collection; note PHI exposure implications.

---

## 6. Data Safety & Compliance

| Rule | Implementation |
|---|---|
| No real patient PII in training data | Synthetic patient generator; scrub names/emails/IDs/dates before export |
| Deterministic outputs auditable | LLM explains rule-engine results; risk levels always come from `riskEngine.js` |
| No PII to model server | Context builder strips identifiers; Ollama/vLLM runs on our own infra |
| Human in the loop | Doctor summaries are drafts for doctors, not automated clinical decisions |
| Auditability | Log prompts (redacted) + responses + model version per request (`AuditLog`-style) |
| Model card | Publish training data mix, eval scores, known limitations, intended use |

---

## 7. Integration Into This Codebase

```
backend/src/
├── services/assistantContextBuilder.js   # NEW: MongoDB → serialized context block (§2.1)
├── services/assistantSafety.js           # NEW: emergency regex, refusal filter, output guard
├── controllers/assistantController.js    # NEW: POST /api/assistant
├── routes/assistant.js                   # NEW: mount in server.js
└── sockets/assistantHandler.js           # optional: streaming tokens over Socket.io

frontend/src/
├── pages/patient/HealthAssistantPage.tsx # NEW: chat UI
└── services/patientPortalService.ts      # add sendAssistantMessage()
```

Sequence: patient asks → `assistantController` builds context via `assistantContextBuilder` → `assistantSafety` pre-check (emergency shortcut without model call) → model server (Ollama at `ASSISTANT_MODEL_URL`) → `assistantSafety` post-filter → streamed response. Risk levels shown to the user always come from `riskEngine.js`, never from the LLM.

---

## 8. Roadmap

| Stage | Work | Outcome |
|---|---|---|
| **W1** | Dataset extraction scripts (MongoDB → synthetic pairs via riskEngine), public dataset download | `data/train.jsonl` v0 |
| **W2** | Plan B live: Ollama + system prompt + context builder + `/api/assistant` | Working assistant, no training |
| **W3–4** | QLoRA fine-tune v1 on collected corpus; eval gate (custom set + red-team) | Model v1 |
| **W5** | A/B: base-with-prompt vs fine-tuned; pick winner | Ship decision |
| **W6+** | Iterations from real usage logs (opt-in, scrubbed), doctor-summary task tuning | Model v2+ |

---

*Document Version: 1.0 · 2026-09-04 · Owner: AI/ML Team*
*Datasets and models referenced are real, publicly downloadable artifacts (Hugging Face / PhysioNet). Verify licenses before production use.*
