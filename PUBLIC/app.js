const $ = (selector) => document.querySelector(selector);

const state = { requests: [], areas: [], filter: 'todos', query: '' };
const dialog = $('#request-dialog');
const form = $('#request-form');
let toastTimer;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3300);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Ocurrió un error al comunicarse con el servidor.');
  return payload;
}

function setConnection(connected, label) {
  const dot = $('#connection-dot');
  dot.className = connected ? 'online' : 'offline';
  $('#connection-label').textContent = label;
}

function updateStats() {
  const count = (status) => state.requests.filter((request) => request.estado === status).length;
  $('#stat-total').textContent = state.requests.length;
  $('#stat-pending').textContent = count('pendiente');
  $('#stat-approved').textContent = count('aprobada');
  $('#stat-rejected').textContent = count('rechazada');
  $('#pending-badge').textContent = count('pendiente');
}

function getVisibleRequests() {
  return state.requests.filter((request) => {
    const matchesStatus = state.filter === 'todos' || request.estado === state.filter;
    const text = `${request.codigo_trabajador} ${request.area} ${request.tipo}`.toLocaleLowerCase('es');
    return matchesStatus && text.includes(state.query.toLocaleLowerCase('es'));
  });
}

function renderRows() {
  const rows = getVisibleRequests();
  $('#result-count').textContent = `${rows.length} ${rows.length === 1 ? 'solicitud' : 'solicitudes'}`;
  if (!rows.length) {
    $('#request-rows').innerHTML = '<tr><td colspan="6" class="empty-row">No hay solicitudes que coincidan con la búsqueda.</td></tr>';
    return;
  }
  $('#request-rows').innerHTML = rows.map((request) => {
    const statusLabel = { pendiente: 'Pendiente', aprobada: 'Aprobada', rechazada: 'Rechazada' }[request.estado] || request.estado;
    const actions = request.estado === 'pendiente'
      ? `<div class="review-actions"><button class="mini-action" data-decision="aprobada" data-id="${Number(request.id)}">Aprobar</button><button class="mini-action reject" data-decision="rechazada" data-id="${Number(request.id)}">Rechazar</button></div>`
      : '<span class="no-action">—</span>';
    return `<tr>
      <td class="code-cell">${escapeHtml(request.codigo_trabajador)}</td>
      <td>${escapeHtml(request.area)}</td>
      <td class="type-cell">${escapeHtml(request.tipo)}</td>
      <td class="date-cell">${formatDate(request.fecha_inicio)} <span aria-hidden="true">→</span> ${formatDate(request.fecha_fin)}</td>
      <td><span class="status-pill status-${escapeHtml(request.estado)}">${escapeHtml(statusLabel)}</span></td>
      <td class="action-cell">${actions}</td>
    </tr>`;
  }).join('');
}

async function loadRequests() {
  try {
    state.requests = await api('/api/solicitudes');
    setConnection(true, 'Base conectada');
  } catch (error) {
    state.requests = [];
    setConnection(false, 'Base sin configurar');
    $('#request-rows').innerHTML = `<tr><td colspan="6" class="empty-row">${escapeHtml(error.message)}</td></tr>`;
  }
  updateStats();
  renderRows();
}

async function loadAreas() {
  const select = $('#area-select');
  try {
    state.areas = await api('/api/areas');
    select.innerHTML = '<option value="">Selecciona un área</option>' + state.areas
      .map((area) => `<option value="${Number(area.id)}">${escapeHtml(area.nombre)}</option>`).join('');
  } catch {
    select.innerHTML = '<option value="">Configura la conexión de base de datos</option>';
  }
}

function openDialog() {
  $('#form-message').textContent = '';
  $('#form-message').className = 'form-message';
  dialog.showModal();
}

$('#open-request').addEventListener('click', openDialog);
$('#close-dialog').addEventListener('click', () => dialog.close());
$('#cancel-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

$('#search-input').addEventListener('input', (event) => {
  state.query = event.target.value.trim();
  renderRows();
});

$('#status-filter').addEventListener('change', (event) => {
  state.filter = event.target.value;
  renderRows();
});

$('#pending-link').addEventListener('click', () => {
  $('#status-filter').value = 'pendiente';
  state.filter = 'pendiente';
  renderRows();
});

$('#refresh-list').addEventListener('click', loadRequests);

$('#request-rows').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-decision]');
  if (!button) return;
  button.disabled = true;
  try {
    await api(`/api/solicitudes/${button.dataset.id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: button.dataset.decision })
    });
    showToast(button.dataset.decision === 'aprobada' ? 'Solicitud demo aprobada.' : 'Solicitud demo rechazada.');
    await loadRequests();
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const body = Object.fromEntries(formData.entries());
  const submitButton = form.querySelector('[type="submit"]');
  const message = $('#form-message');
  submitButton.disabled = true;
  message.textContent = '';
  try {
    await api('/api/solicitudes', { method: 'POST', body: JSON.stringify(body) });
    message.textContent = 'Solicitud ficticia guardada.';
    message.classList.add('success');
    form.reset();
    form.elements.codigo_trabajador.value = 'DEMO-004';
    await loadRequests();
    setTimeout(() => dialog.close(), 650);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

$('#today-label').textContent = new Intl.DateTimeFormat('es-PE', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
}).format(new Date());

loadAreas();
loadRequests();
