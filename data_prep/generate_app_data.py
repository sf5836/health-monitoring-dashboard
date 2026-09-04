#!/usr/bin/env python3
"""
Generate Layer B synthetic data from HealthMonitor Pro schemas + risk engine.
Run: python generate_app_data.py
"""
import json
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()
OUTPUT_FILE = "layer_b_app_grounded.jsonl"
TARGET_SAMPLES = 12000

VITAL_FIELDS = {
    "bloodPressure": {"systolic": (90, 180), "diastolic": (50, 110)},
    "heartRate": (40, 140),
    "spo2": (85, 100),
    "temperatureC": (35.0, 40.0),
    "glucose": {"value": (50, 300), "mode": ["fasting", "post_meal", "random"]},
    "weightKg": (40, 130),
}

CONDITIONS = ["hypertension", "type 2 diabetes", "heart disease", "asthma", "COPD", 
              "high cholesterol", "thyroid disorder", "chronic kidney disease", "none"]
MEDICATIONS = [
    {"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily", "duration": "ongoing"},
    {"name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "duration": "ongoing"},
    {"name": "Amlodipine", "dosage": "5mg", "frequency": "once daily", "duration": "ongoing"},
    {"name": "Atorvastatin", "dosage": "20mg", "frequency": "at bedtime", "duration": "ongoing"},
    {"name": "Aspirin", "dosage": "81mg", "frequency": "once daily", "duration": "ongoing"},
]
ALLERGIES = ["penicillin", "sulfa drugs", "aspirin", "latex", "none"]

def evaluate_risk(vital):
    """Exact port of your riskEngine.js"""
    reasons = []
    risk = "normal"
    
    sys = vital.get("bloodPressure", {}).get("systolic")
    dia = vital.get("bloodPressure", {}).get("diastolic")
    if sys and (sys >= 150 or (dia and dia >= 95)):
        risk = "high"; reasons.append("Blood pressure is in high-risk range")
    elif sys and 135 <= sys <= 149 or (dia and 85 <= dia <= 94):
        if risk != "high": risk = "medium"
        reasons.append("Blood pressure is above normal range")
    
    glu = vital.get("glucose", {}).get("value")
    glu_mode = vital.get("glucose", {}).get("mode")
    if glu:
        if glu_mode == "fasting" and glu >= 126:
            risk = "high"; reasons.append("Fasting glucose is in high-risk range")
        if glu_mode == "post_meal" and glu >= 180:
            risk = "high"; reasons.append("Post-meal glucose is in high-risk range")
    
    spo2 = vital.get("spo2")
    if spo2 and spo2 < 94:
        risk = "high"; reasons.append("SpO2 is below safe threshold")
    
    hr = vital.get("heartRate")
    if hr:
        if hr > 120 or hr < 45:
            risk = "high"; reasons.append("Heart rate is in high-risk range")
        elif (hr > 110 or hr < 50) and risk != "high":
            risk = "medium"; reasons.append("Heart rate is outside normal range")
    
    return {"riskLevel": risk, "riskReasons": reasons}

def random_vital():
    return {
        "bloodPressure": {
            "systolic": random.randint(*VITAL_FIELDS["bloodPressure"]["systolic"]),
            "diastolic": random.randint(*VITAL_FIELDS["bloodPressure"]["diastolic"]),
        },
        "heartRate": random.randint(*VITAL_FIELDS["heartRate"]),
        "spo2": random.randint(*VITAL_FIELDS["spo2"]),
        "temperatureC": round(random.uniform(*VITAL_FIELDS["temperatureC"]), 1),
        "glucose": {
            "value": random.randint(*VITAL_FIELDS["glucose"]["value"]),
            "mode": random.choice(VITAL_FIELDS["glucose"]["mode"]),
        },
        "weightKg": round(random.uniform(*VITAL_FIELDS["weightKg"]), 1),
        "notes": random.choice(["", "Felt dizzy this morning", "After exercise", "Before breakfast", "Stressful day"]),
    }

def random_patient_profile():
    age = random.randint(25, 85)
    conditions = random.sample([c for c in CONDITIONS if c != "none"], k=random.randint(0, 2))
    if not conditions: conditions = ["none"]
    meds = random.sample(MEDICATIONS, k=random.randint(0, 3))
    return {
        "age": age,
        "gender": random.choice(["male", "female"]),
        "bloodGroup": random.choice(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]),
        "heightCm": random.randint(150, 195),
        "weightKg": round(random.uniform(50, 110), 1),
        "allergies": random.sample([a for a in ALLERGIES if a != "none"], k=random.randint(0, 1)) or ["none"],
        "medications": [m["name"] for m in meds],
        "medicalHistory": "; ".join(conditions) if conditions != ["none"] else "No significant history",
        "connectedDoctorIds": [f"doc_{random.randint(1,5)}"],
    }

def vital_to_natural_language(vital, risk_result):
    parts = []
    bp = vital.get("bloodPressure", {})
    if bp.get("systolic") and bp.get("diastolic"):
        parts.append(f"Blood pressure {bp['systolic']}/{bp['diastolic']} mmHg")
    if vital.get("heartRate"): parts.append(f"Heart rate {vital['heartRate']} bpm")
    if vital.get("spo2"): parts.append(f"Oxygen level {vital['spo2']}%")
    if vital.get("temperatureC"): parts.append(f"Temperature {vital['temperatureC']}°C")
    glu = vital.get("glucose", {})
    if glu.get("value"): parts.append(f"{glu['mode'].replace('_',' ')} glucose {glu['value']} mg/dL")
    if vital.get("weightKg"): parts.append(f"Weight {vital['weightKg']} kg")
    
    reading = ", ".join(parts)
    templates = [
        f"My latest reading: {reading}. What does this mean?",
        f"I just recorded: {reading}. Should I be worried?",
        f"Today's vitals: {reading}. Can you explain this to me?",
    ]
    return random.choice(templates)

def risk_to_explanation(vital, risk_result, profile):
    risk = risk_result["riskLevel"]
    reasons = risk_result["riskReasons"]
    
    if not reasons:
        return ("Your readings look normal today. Keep up the good work with regular monitoring "
                "and share these with your doctor at your next visit.")
    
    lines = []
    if risk == "high":
        lines.append("⚠️ **Important:** One or more of your readings are in the high-risk range today.")
    elif risk == "medium":
        lines.append("⚡ **Note:** Some readings are outside the normal range.")
    
    for r in reasons:
        lines.append(f"- {r}")
    
    if "Blood pressure" in " ".join(reasons):
        lines.append("Blood pressure can vary with stress, activity, or time of day. "
                     "Rest for 10 minutes and take another reading.")
    if "glucose" in " ".join(reasons).lower():
        lines.append("Glucose levels are affected by meals, medication timing, and activity. "
                     "Log another reading at the same time tomorrow.")
    if "SpO2" in " ".join(reasons):
        lines.append("Low oxygen levels should be taken seriously. "
                     "If you feel short of breath, seek immediate care.")
    if "Heart rate" in " ".join(reasons):
        lines.append("Heart rate changes with activity, stress, caffeine, or medications. "
                     "Recheck after resting.")
    
    lines.append("\n**Next steps:**")
    lines.append("1. Log another reading after resting")
    lines.append("2. Contact your connected doctor today to discuss")
    if risk == "high":
        lines.append("3. **If you experience chest pain, severe headache, confusion, or difficulty breathing — call emergency services immediately.**")
    else:
        lines.append("3. Continue monitoring as usual")
    
    lines.append("\n*This is not a diagnosis. Always consult your doctor for medical decisions.*")
    return "\n".join(lines)

def generate_vital_explanation_samples(n):
    samples = []
    for _ in range(n):
        profile = random_patient_profile()
        vital = random_vital()
        risk_result = evaluate_risk(vital)
        
        user = vital_to_natural_language(vital, risk_result)
        asst = risk_to_explanation(vital, risk_result, profile)
        
        samples.append({
            "messages": [
                {"role": "system", "content": "You are HealthMonitor Pro's assistant. Explain health readings simply using the patient's context. Never diagnose. Always recommend a doctor for medical decisions. Include emergency escalation for high-risk symptoms."},
                {"role": "user", "content": user},
                {"role": "assistant", "content": asst}
            ]
        })
    return samples

def generate_trend_summary_samples(n):
    templates = [
        "Trend (last 7 days): systolic mean {sys_mean} (range {sys_min}-{sys_max}, slope {sys_slope:+.1f}/day), "
        "diastolic mean {dia_mean}, heart rate avg {hr_mean} bpm, "
        "fasting glucose avg {glu_mean} ({glu_high} readings >126), weight {wt_trend}. Summarize my week.",
        "My 30-day vitals summary: BP trending {bp_trend}, HR {hr_trend}, glucose {glu_trend}. What should I focus on?",
    ]
    samples = []
    for _ in range(n):
        sys_mean = random.randint(115, 155)
        sys_slope = round(random.uniform(-2, 3), 1)
        glu_high = random.randint(0, 4)
        wt_trend = random.choice(["stable", "up 1.2kg", "down 0.8kg"])
        bp_trend = "upward" if sys_slope > 0.5 else "downward" if sys_slope < -0.5 else "stable"
        
        user = random.choice(templates).format(
            sys_mean=sys_mean, sys_min=sys_mean-10, sys_max=sys_mean+15, sys_slope=sys_slope,
            dia_mean=random.randint(70, 95), hr_mean=random.randint(65, 95),
            glu_mean=random.randint(90, 140), glu_high=glu_high, wt_trend=wt_trend,
            bp_trend=bp_trend, hr_trend=random.choice(["stable", "slightly elevated"]),
            glu_trend=random.choice(["improving", "variable", "needs attention"])
        )
        
        asst = (f"Your blood pressure averaged {sys_mean}/... this week, trending {bp_trend} "
                f"({'worth watching' if sys_slope > 0.5 else 'stable'}). "
                f"{glu_high} fasting glucose reading{'s' if glu_high!=1 else ''} crossed the diabetic-range threshold. "
                f"Weight {wt_trend}. "
                f"Suggestion: keep logging daily readings and share this trend with your doctor at your next visit. "
                f"*Not a diagnosis — consult your doctor.*")
        
        samples.append({
            "messages": [
                {"role": "system", "content": "You are HealthMonitor Pro's assistant. Summarize vital trends into plain-language insights. Never diagnose. Always recommend consulting a doctor for medical decisions."},
                {"role": "user", "content": user},
                {"role": "assistant", "content": asst}
            ]
        })
    return samples

def generate_medication_qa_samples(n):
    samples = []
    for _ in range(n):
        profile = random_patient_profile()
        meds = profile["medications"]
        if not meds or meds == ["none"]: continue
        
        user_templates = [
            f"I take {', '.join(meds)}. When should I take each one?",
            f"What's my medication schedule? My meds: {', '.join(meds)}",
            f"Can you remind me how to take my medications: {', '.join(meds)}?",
        ]
        user = random.choice(user_templates)
        
        asst = "Your current medications:\n"
        for m in random.sample(MEDICATIONS, k=len(meds)):
            asst += f"- **{m['name']}** {m['dosage']}: {m['frequency']} ({m['duration']})\n"
        asst += "\n⚠️ **Important:** Never change dosages or stop medications without your doctor's approval. "
        asst += "If you have side effects or questions about timing, contact your prescribing doctor. "
        asst += "*This is a schedule reminder, not medical advice.*"
        
        samples.append({
            "messages": [
                {"role": "system", "content": "You are HealthMonitor Pro's assistant. Provide medication schedule reminders from the patient's profile. Never modify dosages. Always direct changes to the prescribing doctor."},
                {"role": "user", "content": user},
                {"role": "assistant", "content": asst}
            ]
        })
    return samples

def generate_safety_refusal_samples(n):
    triggers = [
        ("What disease do I have?", "I cannot diagnose conditions. Your readings show [X], which your doctor can interpret in context. Please discuss with your connected doctor."),
        ("Should I stop my medication?", "Never stop or change medication without your doctor's guidance. Contact your prescribing doctor to discuss any concerns."),
        ("I have severe chest pain and can't breathe", "🚨 **EMERGENCY:** Chest pain with breathing difficulty requires immediate medical attention. Call emergency services (911/112/your local number) or go to the nearest ER right now. Do not wait."),
        ("I think I'm having a stroke — face drooping, arm weakness", "🚨 **EMERGENCY:** Stroke symptoms (face drooping, arm weakness, speech difficulty) — call emergency services IMMEDIATELY. Time is critical. Do not wait."),
        ("Diagnose me based on these symptoms", "I'm not able to provide medical diagnoses. I can explain your recorded readings and risk levels, but only a qualified healthcare provider can diagnose. Please share your concerns with your connected doctor."),
        ("What's my blood pressure from 2019?", "I only have access to your recent readings in the app. For historical data, please check your records or ask your doctor."),
    ]
    samples = []
    for _ in range(n):
        user, asst = random.choice(triggers)
        samples.append({
            "messages": [
                {"role": "system", "content": "You are HealthMonitor Pro's assistant. Safety first: never diagnose, never change medications, always escalate emergencies. If unsure, refer to doctor."},
                {"role": "user", "content": user},
                {"role": "assistant", "content": asst}
            ]
        })
    return samples

def generate_doctor_summary_samples(n):
    samples = []
    for _ in range(n):
        profile = random_patient_profile()
        n_readings = random.randint(15, 30)
        vitals = [random_vital() for _ in range(n_readings)]
        risks = [evaluate_risk(v) for v in vitals]
        high_days = sum(1 for r in risks if r["riskLevel"] == "high")
        med_days = sum(1 for r in risks if r["riskLevel"] == "medium")
        
        sys_vals = [v["bloodPressure"]["systolic"] for v in vitals if v["bloodPressure"].get("systolic")]
        sys_mean = sum(sys_vals)/len(sys_vals) if sys_vals else 120
        
        user = (f"Generate clinical summary for doctor review:\n"
                f"Patient: {profile['age']}yo {profile['gender']}, conditions: {profile['medicalHistory']}\n"
                f"Meds: {', '.join(profile['medications']) if profile['medications'] != ['none'] else 'None'}\n"
                f"30-day vitals: {n_readings} readings, BP avg {sys_mean:.0f} mmHg, "
                f"high-risk days: {high_days}, medium-risk: {med_days}")
        
        asst = (f"**Clinical Summary — Patient {profile['age']}yo {profile['gender']}**\n"
                f"**Conditions:** {profile['medicalHistory']}\n"
                f"**Medications:** {', '.join(profile['medications']) if profile['medications'] != ['none'] else 'None'}\n"
                f"**Allergies:** {', '.join(profile['allergies']) if profile['allergies'] != ['none'] else 'None'}\n\n"
                f"**30-Day Vitals ({n_readings} readings):**\n"
                f"- Mean systolic BP: {sys_mean:.0f} mmHg\n"
                f"- High-risk readings: {high_days} ({high_days/n_readings*100:.0f}%)\n"
                f"- Medium-risk readings: {med_days}\n\n"
                f"**Assessment:** {'Elevated BP trend, recommend medication review' if high_days > 3 else 'Generally stable, continue current plan'}\n"
                f"**Plan:** Follow up in 2 weeks. Reinforce home monitoring adherence.\n\n"
                f"*Auto-generated summary for clinician review — not a clinical decision.*")
        
        samples.append({
            "messages": [
                {"role": "system", "content": "You are HealthMonitor Pro's assistant. Generate structured clinical summaries for doctor review from patient vital trends. Concise, structured, actionable. Not a clinical decision."},
                {"role": "user", "content": user},
                {"role": "assistant", "content": asst}
            ]
        })
    return samples

def main():
    print("Generating Layer B synthetic app-grounded data...")
    all_samples = []
    
    all_samples.extend(generate_vital_explanation_samples(5000))
    print(f"  Vital explanations: 5000")
    
    all_samples.extend(generate_trend_summary_samples(2000))
    print(f"  Trend summaries: 2000")
    
    all_samples.extend(generate_medication_qa_samples(1500))
    print(f"  Medication Q&A: 1500")
    
    all_samples.extend(generate_safety_refusal_samples(2000))
    print(f"  Safety/refusal: 2000")
    
    all_samples.extend(generate_doctor_summary_samples(1500))
    print(f"  Doctor summaries: 1500")
    
    print(f"Total Layer B samples: {len(all_samples)}")
    
    random.shuffle(all_samples)
    all_samples = all_samples[:TARGET_SAMPLES]
    
    with open(OUTPUT_FILE, "w") as f:
        for s in all_samples:
            f.write(json.dumps(s) + "\n")
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()