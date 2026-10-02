'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Hotel, LoaderCircle, RotateCcw, ShieldCheck, Users, X } from 'lucide-react';
import type { Booking, ModelInfo, SavedAssessment } from '@/lib/types';

type View = 'assessment' | 'performance' | 'guide';
const percent = (value: number, digits = 1) => `${(value * 100).toFixed(digits)}%`;
const groupNames = ['Reservation', 'Guests & preferences', 'Booking arrangements', 'Guest history'];
const groupDescriptions = ['Where, when and how long.', 'The people behind the reservation.', 'Room, rate and reservation terms.', 'Details known at the time of review.'];
const groupIcons = [CalendarDays, Users, Hotel, ClipboardList];
const shortLabels: Record<string, string> = {
  lead_time: 'Booking lead time', adr: 'Average daily rate', required_car_parking_spaces: 'Parking spaces',
  total_of_special_requests: 'Special requests', previous_bookings_not_canceled: 'Previous completed bookings',
  days_in_waiting_list: 'Waiting list days', reserved_room_type: 'Reserved room', assigned_room_type: 'Assigned room',
};
const hints: Record<string, string> = {
  lead_time: 'Days between booking and arrival', adr: 'Use the original dataset currency',
  agent: 'Original dataset ID · 0 if not recorded', company: 'Original dataset ID · 0 if not recorded',
  country: 'Historical three-letter country code', assigned_room_type: 'Must be known when assessing this booking',
};
const optionLabels: Record<string, Record<string, string>> = {
  meal: { BB: 'BB · Breakfast', HB: 'HB · Half board', FB: 'FB · Full board', SC: 'SC · Self catering', Undefined: 'Undefined' },
  distribution_channel: { 'TA/TO': 'TA/TO · Travel agent / tour operator', GDS: 'GDS · Global distribution system' },
};

export default function Workspace() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [view, setView] = useState<View>('assessment');
  const [booking, setBooking] = useState<Booking>({});
  const [result, setResult] = useState<SavedAssessment | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [openGroups, setOpenGroups] = useState([true, true, true, true]);
  const [guideOpen, setGuideOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  useEffect(() => {
    if (!guideOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; helpRef.current?.focus(); };
  }, [guideOpen]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError('');
    fetch('/api/model', { signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to connect to the prediction service.');
      if (!data.groups || !data.labels) throw new Error('Restart the Python backend to load the updated booking form.');
      setInfo(data);
    }).catch(reason => {
      if (reason.name !== 'AbortError') setLoadError(reason.message);
    });
    return () => controller.abort();
  }, [reload]);

  function change(key: string, value: string) {
    setBooking(previous => ({ ...previous, [key]: value }));
    setResult(null); setErrors({}); setError('');
  }

  function clear() {
    setBooking({}); setResult(null); setErrors({}); setError('');
  }

  function example() {
    if (!info) return;
    setBooking(Object.fromEntries(Object.entries(info.example).map(([key, value]) => [key, String(value)])));
    setResult(null); setErrors({}); setError(''); setView('assessment');
  }

  async function assess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setResult(null); setErrors({}); setError('');
    try {
      const response = await fetch('/api/predict', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(booking),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) {
        const fields: Record<string, string> = data.fields || {};
        setErrors(fields);
        const first = Object.keys(fields)[0];
        if (first && info) {
          setOpenGroups(previous => previous.map((open, i) => open || info.groups[i][1].includes(first)));
          setTimeout(() => document.getElementById(first)?.focus(), 50);
        }
        throw new Error(data.error || 'Unable to assess this booking.');
      }
      setResult({ booking: { ...booking }, assessment: data, assessed_at: new Date().toISOString() });
      if (window.innerWidth < 1000) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not connect. Please try again.');
    } finally { setBusy(false); }
  }

  function download() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'staywise-booking-assessment.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const required = info ? Object.keys(info.example).filter(key => !(key in info.optional)) : [];
  const completed = required.filter(key => booking[key]?.trim()).length;
  const nights = Number(booking.stays_in_week_nights || 0) + Number(booking.stays_in_weekend_nights || 0);
  const guests = Number(booking.adults || 0) + Number(booking.children || 0) + Number(booking.babies || 0);
  const navigation: { key: View; label: string; icon: typeof Hotel }[] = [
    { key: 'assessment', label: 'Booking assessment', icon: ClipboardList },
    { key: 'performance', label: 'Model performance', icon: BarChart3 },
    { key: 'guide', label: 'Assessment guide', icon: BookOpen },
  ];

  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to workspace</a>
    <aside className="sidebar" inert={guideOpen}>
      <a className="brand" href="/" aria-label="StayWise home"><span className="brand-mark"><Hotel size={23} strokeWidth={1.5} /></span><span>staywise<span className="brand-caption">RESERVATION INTELLIGENCE</span></span></a>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav aria-label="Workspace">{navigation.map(({ key, label, icon: Icon }) => <button key={key} className={`nav-item ${view === key ? 'active' : ''}`} aria-current={view === key ? 'page' : undefined} onClick={() => setView(key)}><Icon size={18} strokeWidth={1.65} /><span>{label}</span>{view === key && <span className="nav-indicator" />}</button>)}</nav>
      <div className="sidebar-note"><span className="small-rule" /><p>Thoughtful decisions.<br />Better prepared stays.</p><span>Built for hotel operations</span></div>
      <div className="sidebar-service"><span className={`status-dot ${!info ? 'offline' : ''}`} /><span>{info ? 'Prediction service connected' : 'Connecting to service'}</span></div>
    </aside>

    <div className="workspace-main" inert={guideOpen}>
      <header className="topbar"><div className="breadcrumb">Hotel operations <ChevronRight size={13} /><span>{navigation.find(item => item.key === view)?.label}</span></div><button ref={helpRef} className="help-button" onClick={() => setGuideOpen(true)}><CircleHelp size={17} /><span>How it works</span></button></header>
      <main id="main-content">
        <section className="page-heading"><div><div className="eyebrow"><span /> RESERVATION WORKSPACE</div><h1>{view === 'assessment' ? 'Booking assessment' : view === 'performance' ? 'Evidence behind the estimate' : 'A more informed next step'}</h1><p>{view === 'assessment' ? 'Understand cancellation risk before planning your next move.' : view === 'performance' ? 'Measured performance on held-out historical reservations.' : 'Know what to enter, how to read the result, and when to follow up.'}</p></div>{view === 'assessment' && <button className="button button-outline example-button" disabled={!info || busy} onClick={example}><ClipboardList size={16} /> Load example booking <ArrowUpRight size={15} /></button>}</section>

        {loadError ? <div className="connection-error" role="alert"><ShieldCheck size={28} /><h2>Let’s reconnect the prediction service.</h2><p>{loadError}</p><button className="button button-primary" onClick={() => setReload(value => value + 1)}><RotateCcw size={15} /> Try again</button></div> : !info ? <div className="loading-state" role="status"><LoaderCircle className="spin" size={25} /><p>Preparing your reservation workspace…</p></div> : <>
          {view === 'assessment' && <>
            <div className="evidence-strip"><span className="strip-label"><ShieldCheck size={16} /> MODEL SNAPSHOT</span><span><b>{percent(info.metrics.Accuracy)}</b> test accuracy</span><span><b>{info.metrics['ROC-AUC'].toFixed(3)}</b> ROC-AUC</span><span><b>17,480</b> test bookings</span><button onClick={() => setView('performance')}>View evidence <ArrowUpRight size={14} /></button></div>
            <div className="assessment-layout">
              <div className="form-column"><div className="section-intro"><div><h2>Reservation details</h2><p>Use the information available at the time of review.</p></div><span className="completion-count">{completed}<span> / {required.length} required</span></span></div>
                <form id="booking-form" onSubmit={assess} noValidate>
                  {info.groups.map(([, keys], index) => {
                    const Icon = groupIcons[index];
                    const complete = keys.filter(key => !(key in info.optional)).every(key => booking[key]?.trim());
                    return <section className="form-section" key={index}>
                      <button type="button" className="section-toggle" aria-expanded={openGroups[index]} aria-controls={`section-${index}`} onClick={() => setOpenGroups(previous => previous.map((value, i) => i === index ? !value : value))}><span className="section-icon"><Icon size={19} strokeWidth={1.65} /></span><span className="section-title"><span><span className="section-number">0{index + 1}</span>{groupNames[index]}</span><small>{groupDescriptions[index]}</small></span><span className="section-end">{complete && <CheckCircle2 size={17} className="complete-icon" />}<ChevronDown size={17} className={openGroups[index] ? 'chevron-open' : ''} /></span></button>
                      <div id={`section-${index}`} hidden={!openGroups[index]} className="field-grid">{keys.map(key => {
                        const optional = key in info.optional;
                        const options = key === 'is_repeated_guest' ? ['0', '1'] : (key !== 'agent' && key !== 'company' ? info.categories[key] : undefined);
                        const shared = { id: key, name: key, value: booking[key] || '', disabled: busy, required: !optional, 'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': errors[key] ? `error-${key}` : hints[key] ? `hint-${key}` : undefined, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => change(key, event.target.value) };
                        return <div className="field" key={key}><label htmlFor={key}>{shortLabels[key] || info.labels[key]}{optional && <span>Optional</span>}</label>{options ? <div className="select-wrap"><select {...shared}><option value="">{optional ? 'Not recorded' : 'Select an option'}</option>{options.map(option => <option key={option} value={option}>{key === 'is_repeated_guest' ? option === '1' ? 'Yes · Returning guest' : 'No · First-time guest' : optionLabels[key]?.[option] || option}</option>)}</select><ChevronDown size={14} aria-hidden="true" /></div> : <input {...shared} type={key === 'arrival_date' ? 'date' : 'number'} min={key === 'arrival_date' ? '1900-01-01' : 0} max={key === 'arrival_date' ? '2100-12-31' : info.limits[key]} step={key === 'adr' ? '0.01' : '1'} placeholder={optional ? '0' : 'Enter value'} />}{hints[key] && <small id={`hint-${key}`} className="field-hint">{hints[key]}</small>}{errors[key] && <span className="field-error" id={`error-${key}`}>{errors[key]}</span>}</div>;
                      })}</div>
                    </section>;
                  })}
                  <div className="form-actions"><button type="button" className="button button-text" onClick={clear} disabled={busy}><RotateCcw size={15} /> Clear form</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> Assessing booking</> : <>Assess cancellation risk <ArrowRight size={17} /></>}</button></div>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <p className="privacy-note"><ShieldCheck size={13} /> Booking inputs are used for this assessment and are not stored on the server.</p>
                </form>
              </div>

              <aside className="results-column" ref={resultRef}>
                <div className={`assessment-card ${result ? result.assessment.risk_band.toLowerCase() : ''}`} aria-live="polite" aria-busy={busy}>
                  <div className="assessment-card-top"><span className="eyebrow">CANCELLATION OUTLOOK</span><span className="outlined-icon"><BarChart3 size={17} /></span></div>
                  {result ? <div id="prediction"><div className="risk-label" id="risk-band"><span />{result.assessment.risk_band} cancellation risk</div><div className="risk-dial"><svg viewBox="0 0 220 130" aria-hidden="true"><path className="dial-track" d="M 20 110 A 90 90 0 0 1 200 110" /><path className="dial-value" d="M 20 110 A 90 90 0 0 1 200 110" pathLength="100" strokeDasharray={`${result.assessment.cancellation_probability * 100} 100`} /></svg><div><strong id="probability">{percent(result.assessment.cancellation_probability, 2)}</strong><span>estimated cancellation probability</span></div></div><h2 id="outcome">{result.assessment.outcome}</h2><div className="probability-split"><span>Keep booking <b>{percent(result.assessment.retention_probability)}</b></span><div><i style={{ width: percent(result.assessment.retention_probability, 3) }} /></div><span>Cancel booking <b>{percent(result.assessment.cancellation_probability)}</b></span></div><div className="next-action"><span className="eyebrow">RECOMMENDED FOLLOW-UP</span><p>{result.assessment.recommendation}</p></div><button className="button download-button" onClick={download}><ArrowDownToLine size={15} /> Download assessment <ArrowUpRight size={14} /></button><p className="assessed-time">Assessed at {new Date(result.assessed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div> : <div id="empty-result"><div className="empty-dial"><svg viewBox="0 0 220 130" aria-hidden="true"><path d="M 20 110 A 90 90 0 0 1 200 110" /></svg><span>{busy ? <LoaderCircle size={30} className="spin" /> : <Hotel size={31} strokeWidth={1.3} />}</span></div><h2>{busy ? 'Reading the reservation.' : <>Every booking.<br />A clearer outlook.</>}</h2><p>{busy ? 'Calculating risk from the booking details.' : 'Add reservation details to see the estimated risk and a considered next step.'}</p><div className="empty-steps"><span><Check size={13} /> Enter booking details</span><span><ArrowRight size={13} /> Assess cancellation risk</span></div></div>}
                </div>
                <section className="booking-preview"><div className="preview-heading"><h3>Reservation at a glance</h3><CalendarDays size={16} /></div><dl><div><dt>Property type</dt><dd>{booking.hotel || '—'}</dd></div><div><dt>Arrival</dt><dd>{booking.arrival_date ? new Date(`${booking.arrival_date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</dd></div><div><dt>Length of stay</dt><dd>{nights ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : '—'}</dd></div><div><dt>Guests</dt><dd>{guests || '—'}</dd></div></dl></section>
                <div className="judgement-note"><ShieldCheck size={18} /><div><h3>An estimate, with context.</h3><p>Use risk alongside staff judgement. Scores are uncalibrated and based on 2015–2017 bookings. Assigned rooms and booking changes must be known at assessment time.</p><button onClick={() => setView('guide')}>Understanding your result <ArrowUpRight size={13} /></button></div></div>
              </aside>
            </div>
          </>}
          {view === 'performance' && <Performance info={info} />}
          {view === 'guide' && <Guide onExample={example} />}
        </>}
        <footer><span>StayWise <span className="footer-dot">/</span> Reservation intelligence</span><span>Historical evidence. Human judgement.</span></footer>
      </main>
    </div>
    {guideOpen && <div className="modal-backdrop" onClick={() => setGuideOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="help-dialog" onClick={event => event.stopPropagation()} onKeyDown={event => {
      if (event.key === 'Escape') setGuideOpen(false);
      if (event.key === 'Tab') { const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button'); const first = buttons[0]; const last = buttons[buttons.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    }}><button autoFocus className="dialog-close" aria-label="Close guide" onClick={() => setGuideOpen(false)}><X size={19} /></button><span className="eyebrow">A QUICK INTRODUCTION</span><h2 id="dialog-title">From reservation<br />to informed decision.</h2><ol><li><b>Enter what you know.</b><span>Complete booking details available at the time of review.</span></li><li><b>Review the estimate.</b><span>See cancellation risk, likely outcome and suggested follow-up.</span></li><li><b>Choose the next step.</b><span>Use your judgement to confirm bookings and plan resources.</span></li></ol><button className="button button-primary" onClick={() => { setGuideOpen(false); setView('guide'); }}>Read the assessment guide <ArrowRight size={16} /></button></div></div>}
  </div>;
}

function Performance({ info }: { info: ModelInfo }) {
  const metrics = [
    ['Accuracy', 'All test bookings classified correctly.'],
    ['Precision', 'Cancellation alerts that were correct.'],
    ['Recall', 'Actual cancellations the model detected.'],
    ['F1', 'The balance between precision and recall.'],
  ];
  return <div className="performance-view"><div className="performance-summary"><div><span className="eyebrow">HELD-OUT EVALUATION</span><h2>Measured on unseen bookings.</h2><p>17,480 historical reservations were held aside for final evaluation. These results describe that test population, rather than present-day hotel performance.</p><div className="model-tag"><ShieldCheck size={16} /> {info.model}</div></div><div className="auc-feature"><span>ROC-AUC</span><strong>{info.metrics['ROC-AUC'].toFixed(4)}</strong><p>Risk ranking across classification thresholds</p></div></div><div className="metric-grid">{metrics.map(([key, description]) => <article className="metric-card" key={key}><span>{key}</span><strong>{percent(info.metrics[key], 2)}</strong><div className="metric-track"><i style={{ width: percent(info.metrics[key], 3) }} /></div><p>{description}</p></article>)}</div><div className="evidence-grid"><section className="white-panel"><span className="eyebrow">VALIDATION APPROACH</span><h2>Separate learning from evaluation.</h2><dl className="evidence-list"><div><dt>Dataset after deduplication</dt><dd>87,396 bookings</dd></div><div><dt>Training / test split</dt><dd>80% / 20% · Stratified</dd></div><div><dt>Training validation</dt><dd>3-fold stratified CV</dd></div><div><dt>Selection criterion</dt><dd>Mean training CV ROC-AUC</dd></div><div><dt>Selected CV ROC-AUC</dt><dd>{info.training_cv_roc_auc.toFixed(4)}</dd></div><div><dt>Classification threshold</dt><dd>{info.threshold.toFixed(2)}</dd></div></dl></section><section className="white-panel"><span className="eyebrow">READING THE NUMBERS</span><h2>Good evidence has boundaries.</h2><p>Accuracy measures correct classifications. ROC-AUC measures ranking; it is not a percentage of correct predictions.</p><p>Precision and recall expose different errors. False alerts need unnecessary follow-up; missed cancellations can affect occupancy planning.</p><div className="subtle-callout"><ShieldCheck size={19} /><p>The model uses data from two hotels in 2015–2017. Current-hotel validation and probability calibration are still needed. No financial improvement has been measured.</p></div></section></div></div>;
}

function Guide({ onExample }: { onExample: () => void }) {
  return <div className="guide-view"><section className="guide-intro"><span className="eyebrow">THE ASSESSMENT, EXPLAINED</span><h2>Risk informs the conversation.<br />Your team decides the action.</h2><p>Assess a reservation using details already known to your team. The estimate helps prioritize follow-up and prepare for changes in occupancy.</p><button className="button button-primary" onClick={onExample}>Explore an example booking <ArrowRight size={17} /></button></section><div className="risk-guide">{[
    ['Low', 'Below 25%', 'Continue routine follow-up and occupancy planning.'],
    ['Moderate', '25% to below 50%', 'Consider a confirmation reminder and monitor booking changes.'],
    ['High', '50% and above', 'Prioritize a friendly confirmation and review cancellation terms.'],
  ].map(([name, range, text]) => <article key={name}><span className={`band-dot ${name.toLowerCase()}`} /><h3>{name} risk</h3><span className="range">{range}</span><p>{text}</p></article>)}</div><p className="band-disclaimer">These bands are operational guidance, not validated business-optimal cutoffs. A score is an estimate, not a guarantee.</p><div className="evidence-grid"><section className="white-panel"><span className="eyebrow">BEFORE YOU ASSESS</span><h2>Enter consistent booking details.</h2><ul className="guide-list"><li>Use the arrival date, booking lead time and planned nights.</li><li>Room codes, agent IDs and company IDs should match the historical dataset conventions.</li><li>Missing children, country, agent and company use documented defaults.</li><li>Assigned room and booking changes must already be known at the time of assessment.</li></ul></section><section className="white-panel"><span className="eyebrow">AFTER YOU ASSESS</span><h2>Keep the result in context.</h2><ul className="guide-list"><li>A result estimates cancellation risk; it does not explain the cause.</li><li>Editing any booking detail clears the old result. Assess again to update it.</li><li>Download the assessment as JSON to retain a local copy.</li><li>Use the estimate alongside staff judgement when planning follow-up.</li></ul></section></div></div>;
}
