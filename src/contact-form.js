/**
 * Contact form submission → POST /api/send-telegram (see api/send-telegram.js).
 *
 * - Honeypot field silently short-circuits obvious bots (they fill every
 *   field; real visitors never see `.hp-field`, it's off-screen).
 * - On success the form is swapped for a thank-you panel, matching the
 *   original design.
 * - On failure the form stays put (nobody wants to retype a wedding date)
 *   and an inline, screen-reader-announced error appears instead.
 */
const SUBMIT_TIMEOUT_MS = 15000;

export function initContactForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('contact-success');
  const errorPanel = document.getElementById('contact-error');
  const errorText = document.getElementById('contact-error-text');
  const resetButton = document.getElementById('contact-reset');
  const submitButton = document.getElementById('contact-submit');

  if (!form || !success || !errorPanel || !resetButton || !submitButton) return;

  const submitLabel = submitButton.querySelector('.btn__label');
  const idleLabel = submitLabel ? submitLabel.textContent : '';

  function setBusy(isBusy) {
    submitButton.disabled = isBusy;
    if (submitLabel) submitLabel.textContent = isBusy ? 'НАДСИЛАЄМО…' : idleLabel;
  }

  function hideError() {
    errorPanel.hidden = true;
  }

  function showError(message) {
    if (errorText) errorText.textContent = message;
    errorPanel.hidden = false;
    errorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showSuccess() {
    form.hidden = true;
    hideError();
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showForm() {
    success.hidden = true;
    hideError();
    form.hidden = false;
    form.reset();
    form.querySelector('input, textarea, select')?.focus();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();

    // Honeypot: bots that auto-fill every input trip this field. Real
    // visitors never see it, so if it's non-empty, pretend to succeed
    // and stop — no point telling a bot it was caught.
    const honeypot = form.elements.namedItem('company');
    if (honeypot && 'value' in honeypot && honeypot.value.trim() !== '') {
      showSuccess();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.company;

    setBusy(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

    try {
      const response = await fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${response.status}`);
      }

      showSuccess();
    } catch (err) {
      const timedOut = err instanceof DOMException && err.name === 'AbortError';
      console.error('[contact-form] submit failed:', err);
      showError(
        timedOut
          ? 'Сервер довго не відповідає. Спробуйте ще раз або напишіть напряму в Telegram.'
          : 'Не вдалося надіслати заявку. Спробуйте ще раз або напишіть напряму в Telegram.'
      );
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  });

  resetButton.addEventListener('click', showForm);
}
