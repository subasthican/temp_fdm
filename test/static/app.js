const form = document.querySelector('#booking-form');
const defaults = JSON.parse(document.querySelector('#defaults').textContent);
const submit = document.querySelector('#submit');
let latest = null;
function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  document.querySelector('#form-error').textContent = '';
}
function invalidateResult() {
  latest = null;
  document.querySelector('#prediction').hidden = true;
  document.querySelector('#empty-result').hidden = false;
}
document.querySelector('#example').addEventListener('click', () => {
  Object.entries(defaults).forEach(([key, value]) => form.elements[key].value = value);
  clearErrors(); invalidateResult();
  document.querySelector('#booking').scrollIntoView({behavior: 'smooth'});
});
form.addEventListener('input', () => { clearErrors(); invalidateResult(); });
form.addEventListener('reset', () => { clearErrors(); invalidateResult(); });
form.addEventListener('submit', async event => {
  event.preventDefault(); clearErrors(); invalidateResult();
  if (!form.reportValidity()) return;
  const booking = Object.fromEntries(new FormData(form));
  submit.disabled = true; submit.textContent = 'Assessing booking…';
  form.querySelectorAll('input,select,button').forEach(el => el.disabled = true);
  document.querySelector('#example').disabled = true;
  try {
    const response = await fetch('/api/predict', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(booking)});
    const result = await response.json();
    if (!response.ok) {
      Object.entries(result.fields || {}).forEach(([key, message]) => {
        const field = form.elements[key];
        if (field) { field.setAttribute('aria-invalid', 'true'); field.setAttribute('aria-describedby', `error-${key}`); document.querySelector(`#error-${key}`).textContent = message; }
      });
      throw new Error(result.error || 'Unable to assess booking. Please try again.');
    }
    latest = {booking, assessment: result, assessed_at: new Date().toISOString()};
    document.querySelector('#empty-result').hidden = true;
    document.querySelector('#prediction').hidden = false;
    document.querySelector('#probability').textContent = `${(result.cancellation_probability * 100).toFixed(2)}%`;
    const badge = document.querySelector('#risk-band');
    badge.textContent = `${result.risk_band} cancellation risk`; badge.className = `risk-badge ${result.risk_band.toLowerCase()}`;
    document.querySelector('#meter-fill').style.width = `${result.cancellation_probability * 100}%`;
    document.querySelector('#outcome').textContent = result.outcome;
    document.querySelector('#booking-summary').textContent = `${booking.hotel} · ${result.total_nights} nights · Arrival ${booking.arrival_date}`;
    document.querySelector('#recommendation').textContent = result.recommendation;
    document.querySelector('#result-note').textContent = result.note;
    if (window.innerWidth < 900) document.querySelector('.results').scrollIntoView({behavior: 'smooth'});
  } catch (error) {
    document.querySelector('#form-error').textContent = error.message || 'Could not connect to the prediction service.';
  } finally {
    form.querySelectorAll('input,select,button').forEach(el => el.disabled = false);
    document.querySelector('#example').disabled = false;
    submit.innerHTML = 'Assess cancellation risk <span>→</span>';
    form.querySelector('[aria-invalid=true]')?.focus();
  }
});
document.querySelector('#download').addEventListener('click', () => {
  if (!latest) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(latest, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = 'booking-assessment.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
