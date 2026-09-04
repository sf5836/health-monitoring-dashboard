#!/usr/bin/env python3
"""
Download and filter public medical datasets for Layer A.
Run: python download_public_data.py
"""
from datasets import load_dataset
from tqdm import tqdm
import json

OUTPUT_FILE = "layer_a_medical.jsonl"
TARGET_SAMPLES = 25000

def process_healthcare_magic():
    """ChatDoctor/HealthCareMagic-100k - patient Q -> doctor A"""
    print("Loading HealthCareMagic-100k...")
    ds = load_dataset("lavita/ChatDoctor-HealthCareMagic-100k", split="train")
    samples = []
    for row in tqdm(ds.select(range(min(15000, len(ds))))):
        user = row.get("input", "").strip()
        asst = row.get("output", "").strip()
        if user and asst and len(user) > 10 and len(asst) > 20:
            samples.append({
                "messages": [
                    {"role": "system", "content": "You are HealthMonitor Pro's assistant. Explain health topics simply. Never diagnose. Always recommend consulting a doctor for medical decisions."},
                    {"role": "user", "content": user},
                    {"role": "assistant", "content": asst}
                ]
            })
    return samples

def process_medquad():
    """MedQuAD - NIH consumer health Q&A (plain language, perfect for patients)"""
    print("Loading MedQuAD...")
    ds = load_dataset("lavita/MedQuAD", split="train")
    samples = []
    for row in tqdm(ds.select(range(min(5000, len(ds))))):
        q = row.get("question", "").strip()
        a = row.get("answer", "").strip()
        if q and a and len(q) > 10 and len(a) > 30:
            samples.append({
                "messages": [
                    {"role": "system", "content": "You are HealthMonitor Pro's assistant. Explain health topics simply. Never diagnose. Always recommend consulting a doctor for medical decisions."},
                    {"role": "user", "content": q},
                    {"role": "assistant", "content": a}
                ]
            })
    return samples

def process_pubmedqa():
    """PubMedQA - biomedical QA with reasoning"""
    print("Loading PubMedQA...")
    # Correct HF dataset ID: qiaojin/PubMedQA
    ds = load_dataset("qiaojin/PubMedQA", "pqa_labeled", split="train")
    samples = []
    for row in tqdm(ds.select(range(min(3000, len(ds))))):
        q = row.get("question", "").strip()
        ctx = " ".join(row.get("context", {}).get("contexts", []))
        ans = row.get("long_answer", "").strip()
        if q and ans:
            user = f"Question: {q}\nContext: {ctx[:1000]}"
            samples.append({
                "messages": [
                    {"role": "system", "content": "You are HealthMonitor Pro's assistant. Provide evidence-based health explanations. Never diagnose. Always recommend consulting a doctor for medical decisions."},
                    {"role": "user", "content": user},
                    {"role": "assistant", "content": ans}
                ]
            })
    return samples

def process_medmcqa():
    """MedMCQA - medical exam MCQs"""
    print("Loading MedMCQA...")
    # Correct HF dataset ID: openlifescienceai/medmcqa
    ds = load_dataset("openlifescienceai/medmcqa", split="train")
    samples = []
    for row in tqdm(ds.select(range(min(3000, len(ds))))):
        q = row.get("question", "").strip()
        opts = [row.get(f"opa",""), row.get("opb",""), row.get("opc",""), row.get("opd","")]
        cop = row.get("cop", 0)
        exp = row.get("exp") or ""  # Handle None
        exp = exp.strip()
        if q and exp:
            user = f"{q}\nOptions: A) {opts[0]} B) {opts[1]} C) {opts[2]} D) {opts[3]}"
            asst = f"The correct answer is {chr(65+cop)}: {opts[cop]}. {exp}"
            samples.append({
                "messages": [
                    {"role": "system", "content": "You are HealthMonitor Pro's assistant. Answer medical knowledge questions accurately. Never diagnose. Always recommend consulting a doctor for medical decisions."},
                    {"role": "user", "content": user},
                    {"role": "assistant", "content": asst}
                ]
            })
    return samples

def main():
    all_samples = []
    all_samples.extend(process_healthcare_magic())
    all_samples.extend(process_medquad())
    all_samples.extend(process_pubmedqa())
    all_samples.extend(process_medmcqa())
    
    print(f"Total Layer A samples: {len(all_samples)}")
    
    import random
    random.shuffle(all_samples)
    all_samples = all_samples[:TARGET_SAMPLES]
    
    with open(OUTPUT_FILE, "w") as f:
        for s in all_samples:
            f.write(json.dumps(s) + "\n")
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()