#!/usr/bin/env python3
"""Merge all layers → train.jsonl + val.jsonl with Qwen chat template applied"""
import json
import random
from datasets import Dataset
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2.5-7B-Instruct", trust_remote_code=True)

def apply_template(sample):
    text = tokenizer.apply_chat_template(
        sample["messages"], tokenize=False, add_generation_prompt=False
    )
    return {"text": text}

all_samples = []
for fname in ["layer_a_medical.jsonl", "layer_b_app_grounded.jsonl", "layer_c_general.jsonl"]:
    with open(fname) as f:
        for line in f:
            all_samples.append(json.loads(line))

print(f"Total merged: {len(all_samples)}")

random.shuffle(all_samples)

n = len(all_samples)
train_n = int(n * 0.9)
val_n = int(n * 0.05)

train = all_samples[:train_n]
val = all_samples[train_n:train_n+val_n]
test = all_samples[train_n+val_n:]

train_ds = Dataset.from_list(train).map(apply_template, remove_columns=["messages"])
val_ds = Dataset.from_list(val).map(apply_template, remove_columns=["messages"])
test_ds = Dataset.from_list(test).map(apply_template, remove_columns=["messages"])

train_ds.to_json("train.jsonl", orient="records", lines=True)
val_ds.to_json("val.jsonl", orient="records", lines=True)
test_ds.to_json("test.jsonl", orient="records", lines=True)

print(f"train.jsonl: {len(train_ds)} samples")
print(f"val.jsonl: {len(val_ds)} samples")
print(f"test.jsonl: {len(test_ds)} samples")
print("READY FOR COLAB")