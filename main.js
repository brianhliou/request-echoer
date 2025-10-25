const $ = id => document.getElementById(id);

function buildUrl(base, qs) {
  const normalized = qs.trim().replace(/^\?/, '');
  return normalized ? `${base}?${normalized}` : base;
}

// Modal functionality
const modal = $('modal');
const modalClose = $('modal-close');
const howItWorksBtn = $('how-it-works-btn');

function openModal() {
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = 'unset';
}

howItWorksBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'block') {
    closeModal();
  }
});

document.getElementById('send').addEventListener('click', async () => {
  const method = $('method').value;
  const qs = $('qs').value;
  const contentType = $('ct').value.trim();
  const body = $('body').value;
  const url = buildUrl('/api/echo', qs);
  const opts = { method, headers: {} };

  if (!['GET', 'HEAD'].includes(method) && body) {
    opts.headers['Content-Type'] = contentType || 'text/plain';
    opts.body = body;
  }

  try {
    const response = await fetch(url, opts);
    const text = await response.text();
    try {
      $('out').textContent = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      $('out').textContent = text;
    }
  } catch (err) {
    $('out').textContent = `Request failed: ${err}`;
  }
});
