import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../routes/routePaths';
import { ApiError } from '../../services/apiClient';
import { expireCurrentSession } from '../../services/authSession';
import { getDoctorProfile, updateDoctorProfile } from '../../services/doctorPortalService';

type DoctorDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type Step = 1 | 2 | 3 | 4;
type Qualification = { degree: string; institution: string; year: string };
type Upload = { label: string; fileName: string; contentType: string; dataBase64: string; optional?: boolean };
type Slot = { day: DoctorDay; startTime: string; endTime: string };

const SPECIALIZATIONS = ['Cardiology', 'Neurology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Gastroenterology', 'Endocrinology', 'Pulmonology', 'General Medicine', 'Psychiatry', 'Urology', 'Gynecology', 'Oncology', 'Ophthalmology', 'ENT'];
const DAYS: Array<{ key: DoctorDay; short: string; label: string }> = [
  { key: 'monday', short: 'Mon', label: 'Monday' }, { key: 'tuesday', short: 'Tue', label: 'Tuesday' },
  { key: 'wednesday', short: 'Wed', label: 'Wednesday' }, { key: 'thursday', short: 'Thu', label: 'Thursday' },
  { key: 'friday', short: 'Fri', label: 'Friday' }, { key: 'saturday', short: 'Sat', label: 'Saturday' }, { key: 'sunday', short: 'Sun', label: 'Sunday' }
];
const STEPS = ['Professional Info', 'Qualifications & Documents', 'Practice Details', 'Review & Submit'];
const emptyUploads: Upload[] = [
  { label: 'Medical License Document', fileName: '', contentType: '', dataBase64: '' },
  { label: 'Government ID (CNIC/Passport)', fileName: '', contentType: '', dataBase64: '' },
  { label: 'Degree Certificate(s)', fileName: '', contentType: '', dataBase64: '' },
  { label: 'Additional Certifications', fileName: '', contentType: '', dataBase64: '', optional: true }
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}

function Icon({ children }: { children: string }) {
  return <span className="onboarding-icon" aria-hidden="true">{children}</span>;
}

export default function DoctorOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [focusInput, setFocusInput] = useState('');
  const [languages, setLanguages] = useState<string[]>(['English']);
  const [languageInput, setLanguageInput] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [hospital, setHospital] = useState('');
  const [bio, setBio] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [qualifications, setQualifications] = useState<Qualification[]>([{ degree: '', institution: '', year: '' }]);
  const [uploads, setUploads] = useState<Upload[]>(emptyUploads);
  const [photo, setPhoto] = useState<{ fileName: string; contentType: string; dataBase64: string; preview: string } | null>(null);
  const [consultationTypes, setConsultationTypes] = useState({ inPerson: true, teleconsultation: true });
  const [inPersonFee, setInPersonFee] = useState('');
  const [teleconsultationFee, setTeleconsultationFee] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [activeDays, setActiveDays] = useState<DoctorDay[]>(['monday', 'wednesday', 'friday']);
  const [slots, setSlots] = useState<Slot[]>([
    { day: 'monday', startTime: '09:00', endTime: '17:00' }, { day: 'wednesday', startTime: '09:00', endTime: '17:00' }, { day: 'friday', startTime: '09:00', endTime: '17:00' }
  ]);
  const [responseTime, setResponseTime] = useState('Same day');
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDoctorProfile().then((profile) => {
      if (cancelled) return;
      setSpecialization(profile.specialization || ''); setLicenseNumber(profile.licenseNumber || ''); setHospital(profile.hospital || ''); setBio(profile.bio || '');
      setExperienceYears(profile.experienceYears === undefined ? '' : String(profile.experienceYears));
      if (profile.qualifications.length) setQualifications(profile.qualifications.map((item) => ({ degree: item, institution: '', year: '' })));
      if (profile.availabilitySchedule.length) { setSlots(profile.availabilitySchedule); setActiveDays([...new Set(profile.availabilitySchedule.map((slot) => slot.day))]); }
      if (profile.legalDocuments.length) setUploads((items) => items.map((item) => { const existing = profile.legalDocuments.find((doc) => doc.label === item.label); return existing ? { ...item, fileName: existing.fileName } : item; }));
    }).catch((loadError) => setError(loadError instanceof ApiError ? loadError.message : 'Unable to load your profile.')).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const requiredDocsComplete = uploads.slice(0, 3).every((item) => Boolean(item.fileName || item.dataBase64));
  const profileComplete = Boolean(specialization && experienceYears && hospital && bio.trim());
  const practiceComplete = Boolean((!consultationTypes.inPerson || inPersonFee) && (!consultationTypes.teleconsultation || teleconsultationFee) && activeDays.length && slots.length);
  const canSubmit = profileComplete && qualifications.some((item) => item.degree.trim()) && requiredDocsComplete && practiceComplete && confirmed;
  const stepIncomplete = useMemo(() => [!profileComplete, !requiredDocsComplete || !qualifications.some((item) => item.degree.trim()), !practiceComplete, !canSubmit], [canSubmit, practiceComplete, profileComplete, qualifications, requiredDocsComplete]);

  function addTag() { const value = focusInput.trim(); if (value && !focusAreas.includes(value)) setFocusAreas([...focusAreas, value]); setFocusInput(''); }
  function addLanguage() { const value = languageInput.trim(); if (value && !languages.includes(value)) setLanguages([...languages, value]); setLanguageInput(''); }
  function toggleDay(day: DoctorDay) {
    if (activeDays.includes(day)) { setActiveDays(activeDays.filter((item) => item !== day)); setSlots(slots.filter((slot) => slot.day !== day)); return; }
    setActiveDays([...activeDays, day]); setSlots([...slots, { day, startTime: '09:00', endTime: '17:00' }]);
  }
  function updateSlot(index: number, patch: Partial<Slot>) { setSlots(slots.map((slot, slotIndex) => slotIndex === index ? { ...slot, ...patch } : slot)); }
  function addSlot(day: DoctorDay) { setSlots([...slots, { day, startTime: '09:00', endTime: '17:00' }]); }
  function copyToAllDays() { setActiveDays(DAYS.map((day) => day.key)); setSlots(DAYS.map((day) => ({ day: day.key, startTime: slots[0]?.startTime || '09:00', endTime: slots[0]?.endTime || '17:00' }))); }
  function updateQualification(index: number, patch: Partial<Qualification>) { setQualifications(qualifications.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
  function updateUpload(index: number, patch: Partial<Upload>) { setUploads(uploads.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    const dataBase64 = await fileToBase64(file); setPhoto({ fileName: file.name, contentType: file.type, dataBase64, preview: URL.createObjectURL(file) });
  }
  async function handleUpload(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Files must be smaller than 5MB.'); return; }
    const dataBase64 = await fileToBase64(file); updateUpload(index, { fileName: file.name, contentType: file.type, dataBase64 }); setError('');
  }
  function validateCurrentStep() {
    if (step === 1 && (!specialization || !experienceYears || !hospital || !bio.trim())) { setError('Please complete the required professional fields before continuing.'); return false; }
    if (step === 2 && (!licenseNumber || !qualifications.some((item) => item.degree.trim()) || !requiredDocsComplete)) { setError('Add your license number, one qualification, and all required documents.'); return false; }
    if (step === 3 && !practiceComplete) { setError('Choose a consultation type, fee, and at least one availability day.'); return false; }
    setError(''); return true;
  }
  async function saveProfile(submit = false) {
    const cleanedSlots = slots.filter((slot) => activeDays.includes(slot.day) && slot.startTime < slot.endTime);
    const legalDocuments = uploads
      .filter((item) => item.fileName && item.dataBase64)
      .map(({ label, fileName, contentType, dataBase64 }) => ({
        label,
        fileName,
        contentType: contentType || 'application/pdf',
        dataBase64
      }));

    await updateDoctorProfile({ specialization: specialization.trim(), licenseNumber: licenseNumber.trim() || undefined, qualifications: qualifications.map((item) => [item.degree, item.institution, item.year].filter(Boolean).join(' - ')).filter(Boolean), experienceYears: experienceYears ? Number(experienceYears) : undefined, hospital: hospital.trim() || undefined, fee: Number(inPersonFee || teleconsultationFee) || undefined, bio: bio.trim() || undefined, availability: `${activeDays.length} days per week`, availabilitySchedule: cleanedSlots, profilePhoto: photo ? { fileName: photo.fileName, contentType: photo.contentType, dataBase64: photo.dataBase64 } : undefined, legalDocuments: legalDocuments.length ? legalDocuments : undefined });
    if (submit) navigate(ROUTE_PATHS.doctor.pendingApproval, { replace: true });
  }
  async function nextStep() {
    if (!validateCurrentStep()) return;
    setSaving(true); setError('');
    try { await saveProfile(); setToast('Saved'); window.setTimeout(() => setToast(''), 1800); if (step < 4) setStep((step + 1) as Step); } catch (saveError) { setError(saveError instanceof ApiError ? saveError.message : 'Unable to save your progress.'); } finally { setSaving(false); }
  }
  async function submit(event: FormEvent) { event.preventDefault(); if (!validateCurrentStep() || !canSubmit) { setError('Please complete all required fields and confirm your information.'); return; } setSaving(true); try { await saveProfile(true); } catch (submitError) { setError(submitError instanceof ApiError ? submitError.message : 'Unable to submit your profile.'); setSaving(false); } }
  async function exit() { try { await expireCurrentSession(); } finally { navigate(ROUTE_PATHS.auth.login, { replace: true }); } }

  if (loading) return <main className="onboarding-page"><div className="onboarding-loading">Loading your profile...</div></main>;

  return <main className="onboarding-page">
    <header className="onboarding-header"><div className="onboarding-brand"><span className="onboarding-brand-mark"><Icon>+</Icon></span><span>HealthMonitor <strong>Pro</strong></span></div><div className="onboarding-header-actions"><button type="button" className="onboarding-save" onClick={exit}>Save &amp; Exit</button><button type="button" className="onboarding-logout" onClick={exit}><Icon>↪</Icon> Logout</button></div></header>
    <div className="onboarding-progress-wrap"><div className="onboarding-progress-head"><span>Profile setup</span><strong>Step {step} of 4</strong></div><div className="onboarding-steps">{STEPS.map((label, index) => { const number = index + 1; const done = number < step; return <button type="button" key={label} className={`onboarding-step ${number === step ? 'active' : ''} ${done ? 'done' : ''}`} onClick={() => number < step && setStep(number as Step)}><span className="onboarding-step-circle">{done ? '✓' : number}</span><span>{label}</span>{stepIncomplete[index] && number !== step ? <i /> : null}</button>; })}</div><div className="onboarding-progress-bar"><span style={{ width: `${((step - 1) / 3) * 100}%` }} /></div></div>
    <section className="onboarding-content"><div className="onboarding-intro"><span className="onboarding-eyebrow">Doctor profile</span><h1>Complete Your Doctor Profile</h1><p>Build a trusted profile patients can rely on. You can save your progress and return anytime.</p></div>
      {error ? <div className="onboarding-alert error"><Icon>!</Icon>{error}</div> : null}{toast ? <div className="onboarding-toast"><Icon>✓</Icon>{toast}</div> : null}
      <form className="onboarding-card" onSubmit={submit}>
        {step === 1 ? <div className="onboarding-panel"><div className="panel-heading"><div><h2>Tell us about your practice</h2><p>This information will appear on your public doctor profile.</p></div><span className="panel-count">01 <small>/ 04</small></span></div><div className="photo-row"><label className="photo-dropzone"><input type="file" accept="image/*" onChange={handlePhoto} />{photo ? <img src={photo.preview} alt="Profile preview" /> : <><span className="photo-icon"><Icon>◎</Icon></span><b>Upload photo</b><small>Drag and drop or click to browse</small></>}</label><div><h3>Profile photo <span>(optional)</span></h3><p>Use a clear headshot. JPG or PNG, up to 5MB.</p></div></div><div className="field-grid"><label className="field full"><span>Specialization <em>*</em></span><select value={specialization} onChange={(event) => setSpecialization(event.target.value)}><option value="">Choose your specialization</option>{SPECIALIZATIONS.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Years of experience <em>*</em></span><input className="numeric" type="number" min="0" value={experienceYears} onChange={(event) => setExperienceYears(event.target.value)} placeholder="e.g. 8" /></label><label className="field"><span>Hospital / clinic affiliation <em>*</em></span><input value={hospital} onChange={(event) => setHospital(event.target.value)} placeholder="e.g. City General Hospital" /></label><label className="field full"><span>Sub-specialization / focus areas</span><div className="tag-input"><div>{focusAreas.map((tag) => <span key={tag}>{tag}<button type="button" onClick={() => setFocusAreas(focusAreas.filter((item) => item !== tag))}>×</button></span>)}</div><input value={focusInput} onChange={(event) => setFocusInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(); } }} placeholder="Type an area and press Enter" /></div></label><label className="field full"><span>Languages spoken</span><div className="tag-input"><div>{languages.map((language) => <span key={language}>{language}<button type="button" onClick={() => setLanguages(languages.filter((item) => item !== language))}>×</button></span>)}</div><input value={languageInput} onChange={(event) => setLanguageInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addLanguage(); } }} placeholder="Add English, Urdu, Punjabi..." /></div></label><label className="field full"><span>Short bio <em>*</em></span><textarea rows={4} maxLength={500} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Tell patients about your approach to care..." /><small className="char-count">{bio.length}/500</small></label></div></div> : null}
        {step === 2 ? <div className="onboarding-panel"><div className="panel-heading"><div><h2>Verify your credentials</h2><p>Required for admin approval. Documents are reviewed within 24–48 hours.</p></div><span className="panel-count">02 <small>/ 04</small></span></div><div className="info-banner"><Icon>⌾</Icon><span><strong>Your documents are secure</strong><small>Encrypted and only visible to our verification team.</small></span></div><div className="section-line"><h3>Qualifications</h3><button type="button" className="text-action" onClick={() => setQualifications([...qualifications, { degree: '', institution: '', year: '' }])}>+ Add qualification</button></div><div className="qualification-list">{qualifications.map((item, index) => <div className="qualification-row" key={index}><span className="timeline-dot">{index + 1}</span><label className="field"><span>Degree name <em>*</em></span><input value={item.degree} onChange={(event) => updateQualification(index, { degree: event.target.value })} placeholder="e.g. MBBS, FCPS" /></label><label className="field"><span>Institution</span><input value={item.institution} onChange={(event) => updateQualification(index, { institution: event.target.value })} placeholder="University or college" /></label><label className="field"><span>Year</span><select value={item.year} onChange={(event) => updateQualification(index, { year: event.target.value })}><option value="">Year</option>{Array.from({ length: 45 }, (_, year) => <option key={year}>{String(new Date().getFullYear() - year)}</option>)}</select></label>{qualifications.length > 1 ? <button type="button" className="remove-button" onClick={() => setQualifications(qualifications.filter((_, itemIndex) => itemIndex !== index))}>×</button> : null}</div>)}</div><div className="section-line documents-heading"><h3>Required documents</h3><small>PDF or JPG · Max 5MB each</small></div><label className="field license-field"><span>Medical license number <em>*</em></span><input value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} placeholder="e.g. PMDC-XXXX-1234" /></label><div className="upload-grid">{uploads.map((item, index) => <label className={`upload-card ${item.fileName ? 'uploaded' : ''}`} key={item.label}><span className="upload-card-title"><b>{item.label}</b>{item.optional ? <small>Optional</small> : <em>*</em>}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple={index === 2} onChange={(event) => handleUpload(index, event)} />{item.fileName ? <span className="file-chip"><Icon>✓</Icon>{item.fileName}<button type="button" onClick={(event) => { event.preventDefault(); updateUpload(index, { fileName: '', dataBase64: '' }); }}>×</button></span> : <span className="upload-placeholder"><Icon>↑</Icon><b>Drop file here or browse</b><small>PDF, JPG, PNG</small></span>}</label>)}</div></div> : null}
        {step === 3 ? <div className="onboarding-panel"><div className="panel-heading"><div><h2>Set up your practice details</h2><p>Patients will use this information to book appointments with you.</p></div><span className="panel-count">03 <small>/ 04</small></span></div><h3 className="subheading">Consultation type <em>*</em></h3><div className="consultation-grid"><button type="button" className={consultationTypes.inPerson ? 'selected' : ''} onClick={() => setConsultationTypes({ ...consultationTypes, inPerson: !consultationTypes.inPerson })}><Icon>⌂</Icon><span><b>In-person</b><small>At your clinic or hospital</small></span><i>✓</i></button><button type="button" className={consultationTypes.teleconsultation ? 'selected' : ''} onClick={() => setConsultationTypes({ ...consultationTypes, teleconsultation: !consultationTypes.teleconsultation })}><Icon>◉</Icon><span><b>Teleconsultation</b><small>Secure video appointment</small></span><i>✓</i></button></div><div className="field-grid fee-grid">{consultationTypes.inPerson ? <label className="field"><span>In-person fee <em>*</em></span><div className="prefix-input"><b>PKR</b><input className="numeric" type="number" min="0" value={inPersonFee} onChange={(event) => setInPersonFee(event.target.value)} placeholder="1,500" /></div></label> : null}{consultationTypes.teleconsultation ? <label className="field"><span>Teleconsultation fee <em>*</em></span><div className="prefix-input"><b>PKR</b><input className="numeric" type="number" min="0" value={teleconsultationFee} onChange={(event) => setTeleconsultationFee(event.target.value)} placeholder="1,000" /></div></label> : null}</div>{consultationTypes.inPerson ? <><h3 className="subheading address-heading">Clinic / hospital address</h3><div className="field-grid"><label className="field full"><span>Address line</span><input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street address, building, floor" /></label><label className="field"><span>City</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Lahore" /></label><label className="field"><span>Hospital / clinic</span><input value={hospital} onChange={(event) => setHospital(event.target.value)} placeholder="Select or add a location" /></label></div></> : null}<div className="schedule-heading"><h3 className="subheading">Availability schedule <em>*</em></h3><button type="button" className="text-action" onClick={copyToAllDays}>Copy to all days</button></div><div className="day-pills">{DAYS.map((day) => <button type="button" className={activeDays.includes(day.key) ? 'active' : ''} key={day.key} onClick={() => toggleDay(day.key)}>{day.short}</button>)}</div><div className="schedule-list">{activeDays.map((day) => <div className="schedule-row" key={day}><b>{DAYS.find((item) => item.key === day)?.label}</b>{slots.filter((slot) => slot.day === day).map((slot) => { const index = slots.indexOf(slot); return <span className="time-range" key={`${day}-${index}`}><input type="time" value={slot.startTime} onChange={(event) => updateSlot(index, { startTime: event.target.value })} /><span>to</span><input type="time" value={slot.endTime} onChange={(event) => updateSlot(index, { endTime: event.target.value })} /></span>; })}<button type="button" className="add-slot" onClick={() => addSlot(day)}>+ Add another slot</button></div>)}</div><div className="field-grid preferences"><label className="field"><span>Typical response time</span><select value={responseTime} onChange={(event) => setResponseTime(event.target.value)}><option>Within 1 hour</option><option>Within 2 hours</option><option>Same day</option><option>Within 24 hours</option></select></label><div className="toggle-fields"><span>Contact preferences</span><label><input type="checkbox" checked={showPhone} onChange={(event) => setShowPhone(event.target.checked)} /> Show phone number on public profile</label><label><input type="checkbox" checked={showEmail} onChange={(event) => setShowEmail(event.target.checked)} /> Show email on public profile</label></div></div></div> : null}
        {step === 4 ? <div className="onboarding-panel review-panel"><div className="panel-heading"><div><h2>Review your profile</h2><p>Please confirm everything is correct before submitting for admin review.</p></div><span className="panel-count">04 <small>/ 04</small></span></div><div className="review-list"><ReviewSection title="Professional info" step={1} onEdit={setStep}><div className="review-profile"><span className="review-avatar">{photo ? <img src={photo.preview} alt="" /> : <Icon>◎</Icon>}</span><span><b>{specialization || 'Specialization not added'}</b><small>{hospital || 'Clinic not added'}{experienceYears ? ` · ${experienceYears} years experience` : ''}</small><p>{bio || 'No bio added yet.'}</p></span></div></ReviewSection><ReviewSection title="Qualifications & documents" step={2} onEdit={setStep}><div className="review-checks">{qualifications.filter((item) => item.degree).map((item) => <span key={item.degree}><Icon>✓</Icon>{item.degree}</span>)}{uploads.map((item) => <span className={!item.fileName && !item.optional ? 'missing' : ''} key={item.label}><Icon>{item.fileName ? '✓' : '!'}</Icon>{item.label}: {item.fileName || (item.optional ? 'Optional' : 'Missing')}</span>)}</div></ReviewSection><ReviewSection title="Practice details" step={3} onEdit={setStep}><div className="review-practice"><span><b>{consultationTypes.inPerson ? `PKR ${inPersonFee || '—'}` : '—'}</b><small>In-person fee</small></span><span><b>{consultationTypes.teleconsultation ? `PKR ${teleconsultationFee || '—'}` : '—'}</b><small>Teleconsultation fee</small></span><span><b>{activeDays.length} days</b><small>Weekly availability</small></span></div></ReviewSection></div><label className="confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I confirm that all information and documents provided are accurate and belong to me.</span></label><div className="submit-note"><Icon>✓</Icon><span><b>Almost there.</b> Your profile will be reviewed within 24–48 hours.</span></div></div> : null}
        <footer className="onboarding-footer">{step > 1 ? <button type="button" className="back-button" onClick={() => setStep((step - 1) as Step)}>← Back</button> : <span />}{step === 4 ? <button type="submit" className="continue-button submit-button" disabled={!canSubmit || saving}>{saving ? 'Submitting...' : 'Submit for verification'} <Icon>→</Icon></button> : <button type="button" className="continue-button" onClick={nextStep} disabled={saving}>{saving ? 'Saving...' : 'Save & continue'} <Icon>→</Icon></button>}</footer>
      </form><p className="onboarding-footnote"><Icon>⌾</Icon> Your information is protected with enterprise-grade security.</p>
    </section>
  </main>;
}

function ReviewSection({ title, step, onEdit, children }: { title: string; step: Step; onEdit: (step: Step) => void; children: React.ReactNode }) {
  return <section className="review-section"><div className="review-section-head"><h3>{title}</h3><button type="button" onClick={() => onEdit(step)}>Edit <Icon>↗</Icon></button></div>{children}</section>;
}
