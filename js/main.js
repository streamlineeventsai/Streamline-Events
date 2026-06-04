// Shared JavaScript for Streamline Events pages
const webhookUrl = 'https://hook.make.com/YOUR_WEBHOOK_ID';

// ============ VALIDATION FUNCTIONS ============
function validateFullName(name) {
  const trimmed = name.trim();
  if (!/^[a-zA-Z\s]{3,}$/.test(trimmed)) return false;
  return true;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(email.trim());
}

function validatePakistanPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return /^923\d{9}$/.test(cleaned) && cleaned.length === 12;
}

function validateEventSelect(event) {
  return event !== '' && event !== null;
}

// ============ LOCAL STORAGE FUNCTIONS ============
function initializeLocalStorage() {
  if (!localStorage.getItem('events')) {
    const defaultEvents = [
      { id: 1, name: 'Tech Conference 2026', date: '2026-12-10', location: 'Lahore Expo Center', capacity: 500, description: 'Industry tech leaders and networking' },
      { id: 2, name: 'AI Workshop', date: '2026-12-15', location: 'Digital Hub Lahore', capacity: 100, description: 'Hands-on AI techniques and tools' },
      { id: 3, name: 'Networking Night', date: '2026-12-20', location: 'The Skyline Lounge', capacity: 200, description: 'Entrepreneurs and creatives' },
      { id: 4, name: 'Leadership Summit', date: '2027-01-05', location: 'City Conference Hall', capacity: 300, description: 'Executive leadership focus' }
    ];
    localStorage.setItem('events', JSON.stringify(defaultEvents));
  }

  if (!localStorage.getItem('registrations')) {
    const defaultRegs = [
      { regId: 'REG-001', name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '03001234567', event: 'Tech Conference 2026', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REG-001', timestamp: new Date().toISOString() },
      { regId: 'REG-002', name: 'Faisal Ahmed', email: 'faisal@example.com', phone: '03109876543', event: 'AI Workshop', qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REG-002', timestamp: new Date().toISOString() }
    ];
    localStorage.setItem('registrations', JSON.stringify(defaultRegs));
  }

  if (!localStorage.getItem('attendance')) {
    localStorage.setItem('attendance', JSON.stringify([]));
  }
}

function getNextRegId() {
  const regs = JSON.parse(localStorage.getItem('registrations') || '[]');
  const highest = regs.reduce((max, r) => Math.max(max, parseInt(r.regId.split('-')[1]) || 0), 0);
  return `REG-${String(highest + 1).padStart(3, '0')}`;
}

function saveRegistrationToLocalStorage(data) {
  const regId = getNextRegId();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(regId)}`;
  
  const registration = {
    regId,
    name: data.name,
    email: data.email,
    phone: data.phone,
    event: data.event,
    qrUrl,
    timestamp: new Date().toISOString()
  };

  const existing = JSON.parse(localStorage.getItem('registrations') || '[]');
  existing.push(registration);
  localStorage.setItem('registrations', JSON.stringify(existing));
  
  return registration;
}

function getEvents() {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem('events') || '[]');
}

function getRegistrations() {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem('registrations') || '[]');
}

function getAttendance() {
  initializeLocalStorage();
  return JSON.parse(localStorage.getItem('attendance') || '[]');
}

function saveEvent(event) {
  const events = getEvents();
  if (event.id) {
    const index = events.findIndex(e => e.id === event.id);
    if (index > -1) events[index] = event;
  } else {
    event.id = Math.max(...events.map(e => e.id), 0) + 1;
    events.push(event);
  }
  localStorage.setItem('events', JSON.stringify(events));
  return event;
}

function deleteEvent(eventId) {
  const events = getEvents().filter(e => e.id !== eventId);
  localStorage.setItem('events', JSON.stringify(events));
}

function deleteRegistration(regId) {
  const regs = getRegistrations().filter(r => r.regId !== regId);
  localStorage.setItem('registrations', JSON.stringify(regs));
}

function markAttendance(regId, status) {
  let attendance = getAttendance();
  const existing = attendance.findIndex(a => a.regId === regId);
  if (existing > -1) {
    attendance[existing].status = status;
  } else {
    const reg = getRegistrations().find(r => r.regId === regId);
    if (reg) {
      attendance.push({ regId, name: reg.name, event: reg.event, status });
    }
  }
  localStorage.setItem('attendance', JSON.stringify(attendance));
}

// ============ QR CODE & WEBHOOK ============
function generateQrCodeUrl(regId) {
  const safeData = encodeURIComponent(regId);
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${safeData}`;
}

async function sendToWebhook(data) {
  try {
    console.log('Sending to webhook:', data);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    console.log('Webhook response status:', response.status);
  } catch (error) {
    console.warn('Webhook request failed:', error);
  }
}

// ============ CSV EXPORT ============
function exportToCSV(filename, headers, rows) {
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// ============ FORM VALIDATION & HANDLERS ============
function validateForm(form) {
  const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.checkValidity()) {
      input.classList.add('input-error');
      isValid = false;
    } else {
      input.classList.remove('input-error');
    }
  });

  return isValid;
}

async function handleRegistrationSubmit(event) {
  event.preventDefault();
  const form = event.target;
  
  const name = form.fullName.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const event_name = form.eventSelect.value;

  // Validate each field
  let isValid = true;
  if (!validateFullName(name)) {
    form.fullName.classList.add('input-error');
    isValid = false;
  } else {
    form.fullName.classList.remove('input-error');
  }

  if (!validateEmail(email)) {
    form.email.classList.add('input-error');
    isValid = false;
  } else {
    form.email.classList.remove('input-error');
  }

  if (!validatePakistanPhone(phone)) {
    form.phone.classList.add('input-error');
    isValid = false;
  } else {
    form.phone.classList.remove('input-error');
  }

  if (!validateEventSelect(event_name)) {
    form.eventSelect.classList.add('input-error');
    isValid = false;
  } else {
    form.eventSelect.classList.remove('input-error');
  }

  if (!isValid) {
    alert('Please fill all fields with valid information.');
    return;
  }

  const formData = {
    name,
    email,
    phone,
    event: event_name,
    timestamp: new Date().toISOString(),
  };

  const reg = saveRegistrationToLocalStorage(formData);
  await sendToWebhook(formData);

  alert('Form validated successfully');
  console.log('Registration saved:', reg);

  const status = document.querySelector('#registration-status');
  const qrContainer = document.querySelector('#qrCodeContainer');

  if (status) {
    status.textContent = `Registration successful! Your ID: ${reg.regId}`;
  }

  if (qrContainer) {
    qrContainer.innerHTML = `
      <img src="${reg.qrUrl}" alt="Registration QR code" style="max-width: 200px; margin: 1rem auto;" />
      <p class="qr-note">Registration ID: <strong>${reg.regId}</strong></p>
      <p class="qr-note">Save this QR code or view it in your confirmation email.</p>
    `;
  }

  form.reset();
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if (!validateForm(form)) {
    alert('Please fill out all contact fields.');
    return;
  }

  const contactData = {
    name: form.contactName.value.trim(),
    email: form.contactEmail.value.trim(),
    message: form.contactMessage.value.trim(),
    timestamp: new Date().toISOString(),
  };

  console.log('Contact message submitted:', contactData);
  await sendToWebhook(contactData);

  alert('Thank you! Your message has been sent successfully.');
  form.reset();
}

function handleAttendanceScan() {
  const scanInput = document.querySelector('#scanInput');
  if (!scanInput || !scanInput.value.trim()) {
    alert('Enter a valid registration code to mark attendance.');
    return;
  }

  const code = scanInput.value.trim();
  alert(`Attendance marked for ${code}.`);
  scanInput.value = '';
}

// ============ ADMIN TABLE RENDERING ============
function populateAdminTable() {
  const tableBody = document.querySelector('#registrationTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  const registrations = getRegistrations();

  registrations.forEach((registration) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${registration.regId}</td>
      <td>${registration.name}</td>
      <td>${registration.email}</td>
      <td>${registration.event}</td>
      <td><span class="badge badge-success">Registered</span></td>
    `;
    tableBody.appendChild(row);
  });
}

// ============ PAGE INITIALIZATION ============
function attachPageHandlers() {
  const registrationForm = document.querySelector('#registration-form');
  if (registrationForm) {
    registrationForm.addEventListener('submit', handleRegistrationSubmit);
  }

  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  const markAttendanceBtn = document.querySelector('#markAttendanceBtn');
  if (markAttendanceBtn) {
    markAttendanceBtn.addEventListener('click', handleAttendanceScan);
  }

  populateAdminTable();

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  // Initialize localStorage
  initializeLocalStorage();
}

window.addEventListener('DOMContentLoaded', attachPageHandlers);
