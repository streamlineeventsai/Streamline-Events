// Make.com Webhook Configuration
const WEBHOOK_URL = 'https://hook.eu1.make.com/r6rcpxdpzrtk8sgr6b7o5xoe6wjc1qyb';

// QR code – Google Charts API
function generateQrCodeUrl(regId) {
  const safeData = encodeURIComponent(regId);
  return `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${safeData}`;
}

const defaultEvents = [
  {
    id: 'EVT-001',
    name: 'Tech Conference 2026',
    date: 'Dec 10, 2026',
    time: '9:00 AM - 5:00 PM',
    location: 'Expo Center',
    capacity: 250,
    description: 'Discover the latest technology trends, networking opportunities, and expert talks.',
    fee: 1500,
    image: 'assets/images/tech-conference.jpg',
  },
  {
    id: 'EVT-002',
    name: 'AI Workshop',
    date: 'Dec 15, 2026',
    time: '10:00 AM - 4:00 PM',
    location: 'Tech Hub',
    capacity: 120,
    description: 'A hands-on workshop to learn practical AI tools and build empowered solutions.',
    fee: 3000,
    image: 'assets/images/ai-workshop.jpg',
  },
  {
    id: 'EVT-003',
    name: 'Networking Night',
    date: 'Dec 20, 2026',
    time: '7:00 PM - 11:00 PM',
    location: 'Royal Palm',
    capacity: 180,
    description: 'Connect with entrepreneurs, creatives, and influencers in a refined evening setting.',
    fee: 5000,
    image: 'assets/images/networking-night.jpg',
  },
];

// Sample registrations with CNIC field
const sampleRegistrations = [
  {
    regId: 'REG-001',
    name: 'Ayesha Khan',
    email: 'ayesha@example.com',
    phone: '03001234567',
    cnic: '12345-1234567-1',
    eventId: 'EVT-001',
    eventName: 'Tech Conference 2026',
    fee: 1500,
    paymentStatus: 'Paid',
    qrCodeUrl: generateQrCodeUrl('REG-001'),
    timestamp: '2026-06-01T10:00:00Z',
  },
  {
    regId: 'REG-002',
    name: 'Bilal Shah',
    email: 'bilal@example.com',
    phone: '03009876543',
    cnic: '54321-7654321-9',
    eventId: 'EVT-002',
    eventName: 'AI Workshop',
    fee: 3000,
    paymentStatus: 'Pending',
    qrCodeUrl: generateQrCodeUrl('REG-002'),
    timestamp: '2026-06-02T11:30:00Z',
  },
];

const sampleAttendance = [
  { regId: 'REG-001', status: 'Present' },
  { regId: 'REG-002', status: 'Absent' },
];

function getStorageArray(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    saveStorageArray(key, fallback);
    return fallback.map((item) => ({ ...item }));
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback.map((item) => ({ ...item }));
  } catch {
    saveStorageArray(key, fallback);
    return fallback.map((item) => ({ ...item }));
  }
}

function saveStorageArray(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function initData() {
  const storedEvents = getStorageArray('events', defaultEvents);
  const mergedEvents = [
    ...defaultEvents.map((def) => {
      const existing = storedEvents.find((item) => item.id === def.id);
      return existing ? { ...existing, ...def } : def;
    }),
    ...storedEvents.filter((item) => !defaultEvents.some((def) => def.id === item.id)),
  ];
  saveStorageArray('events', mergedEvents);
  getStorageArray('registrations', sampleRegistrations);
  getStorageArray('attendance', sampleAttendance);
}

function getEvents() {
  return getStorageArray('events', defaultEvents);
}

function getRegistrations() {
  return getStorageArray('registrations', sampleRegistrations);
}

function getAttendance() {
  return getStorageArray('attendance', sampleAttendance);
}

function saveRegistration(registration) {
  const registrations = getRegistrations();
  registrations.push(registration);
  saveStorageArray('registrations', registrations);
}

function updateAttendance(regId, status) {
  const attendance = getAttendance();
  const index = attendance.findIndex((item) => item.regId === regId);
  if (index > -1) {
    attendance[index].status = status;
  } else {
    attendance.push({ regId, status });
  }
  saveStorageArray('attendance', attendance);
}

function updateRegistrationPayment(regId) {
  const registrations = getRegistrations();
  const index = registrations.findIndex((item) => item.regId === regId);
  if (index > -1) {
    registrations[index].paymentStatus = 'Paid';
    saveStorageArray('registrations', registrations);
  }
}

function getEventById(id) {
  return getEvents().find((event) => event.id === id);
}

function createRegistrationId() {
  const registrations = getRegistrations();
  const maxId = registrations.reduce((max, item) => {
    const numeric = parseInt(item.regId.replace('REG-', ''), 10);
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 0);
  return `REG-${String(maxId + 1).padStart(3, '0')}`;
}

function createEventId() {
  const events = getEvents();
  const maxId = events.reduce((max, item) => {
    const numeric = parseInt(item.id.replace('EVT-', ''), 10);
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 0);
  return `EVT-${String(maxId + 1).padStart(3, '0')}`;
}

async function sendToWebhook(data) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const responseText = await response.text();
    if (response.ok || responseText.includes('Accepted')) {
      return { success: true, message: 'Webhook processed successfully' };
    } else {
      console.warn('Webhook response:', responseText);
      return { success: false, message: 'Webhook processing failed' };
    }
  } catch (error) {
    console.error('Webhook request error:', error);
    return { success: false, message: error.message };
  }
}

function formatFee(amount) {
  return `PKR ${Number(amount).toLocaleString('en-US')}`;
}

function validateName(value) {
  return /^[A-Za-z ]{3,}$/.test(value.trim());
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validatePakistanPhone(value) {
  const cleaned = value.replace(/[-\s]/g, '');
  return /^03\d{9}$/.test(cleaned);
}

function setupNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const body = document.body;
  const navLinks = document.querySelectorAll('.main-nav a');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', (!expanded).toString());
    body.classList.toggle('nav-open');
  });
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Note: bindRegisterPage is no longer used because register.html uses its own script.
// We keep a dummy function to avoid errors.
function bindRegisterPage() {
  // custom form in register.html handles everything
}

function bindContactPage() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  const contactName = document.getElementById('contactName');
  const contactEmail = document.getElementById('contactEmail');
  const contactMessage = document.getElementById('contactMessage');
  function setError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = message;
  }
  function validateContactForm() {
    let valid = true;
    setError('contactNameError', '');
    setError('contactEmailError', '');
    setError('contactMessageError', '');
    if (!contactName.value.trim()) {
      setError('contactNameError', 'Name is required.');
      valid = false;
    }
    if (!validateEmail(contactEmail.value)) {
      setError('contactEmailError', 'Enter a valid email address.');
      valid = false;
    }
    if (!contactMessage.value.trim()) {
      setError('contactMessageError', 'Message cannot be blank.');
      valid = false;
    }
    return valid;
  }
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateContactForm()) return;
    const contactData = {
      name: contactName.value.trim(),
      email: contactEmail.value.trim(),
      message: contactMessage.value.trim(),
      timestamp: new Date().toISOString(),
    };
    const webhookResult = await sendToWebhook(contactData);
    if (webhookResult.success) {
      alert('Thank you! Your message has been sent successfully.');
    } else {
      alert('Message saved but could not be sent. Please try again later.');
    }
    contactForm.reset();
  });
}

function validateAdminAccess() {
  if (sessionStorage.getItem('adminAccess') === 'granted') return true;
  const password = prompt('Enter admin password:');
  if (password === 'admin123') {
    sessionStorage.setItem('adminAccess', 'granted');
    return true;
  }
  window.location.href = 'index.html';
  return false;
}

function bindAdminPage() {
  const eventTableBody = document.getElementById('eventTableBody');
  if (!eventTableBody) return;
  if (!validateAdminAccess()) return;

  const registrationTableBody = document.getElementById('registrationTableBody');
  const attendanceTableBody = document.getElementById('attendanceTableBody');
  const registrationFilter = document.getElementById('registrationFilter');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const markPresentBtn = document.getElementById('markPresentBtn');
  const adminScanInput = document.getElementById('adminScanInput');
  const totalEventsEl = document.getElementById('totalEvents');
  const totalRegistrationsEl = document.getElementById('totalRegistrations');
  const totalPresentEl = document.getElementById('totalPresent');
  const totalPendingEl = document.getElementById('totalPending');
  const attendanceCounts = document.getElementById('attendanceCounts');
  const registrationChartCanvas = document.getElementById('registrationChart');
  const eventForm = document.getElementById('eventForm');
  const eventIdInput = document.getElementById('eventId');
  const eventNameInput = document.getElementById('eventName');
  const eventDateInput = document.getElementById('eventDate');
  const eventTimeInput = document.getElementById('eventTime');
  const eventLocationInput = document.getElementById('eventLocation');
  const eventCapacityInput = document.getElementById('eventCapacity');
  const eventDescriptionInput = document.getElementById('eventDescription');
  const eventFeeInput = document.getElementById('eventFee');
  const saveEventBtn = document.getElementById('saveEventBtn');
  const resetEventBtn = document.getElementById('resetEventBtn');
  let registrationChart = null;

  function renderEventOptions() {
    const events = getEvents();
    registrationFilter.innerHTML = '<option value="">All events</option>';
    events.forEach((event) => {
      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = event.name;
      registrationFilter.appendChild(option);
    });
  }

  function renderEventTable() {
    const events = getEvents();
    eventTableBody.innerHTML = '';
    events.forEach((event) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${event.id}</td>
        <td>${event.name}</td>
        <td>${event.date}</td>
        <td>${event.time}</td>
        <td>${event.location}</td>
        <td>${event.capacity}</td>
        <td>${formatFee(event.fee)}</td>
        <td class="table-actions">
          <button class="btn btn-small btn-secondary" data-action="edit" data-id="${event.id}">Edit</button>
          <button class="btn btn-small btn-secondary" data-action="delete" data-id="${event.id}">Delete</button>
        </td>
      `;
      eventTableBody.appendChild(row);
    });
  }

  function clearEventForm() {
    eventIdInput.value = '';
    eventNameInput.value = '';
    eventDateInput.value = '';
    eventTimeInput.value = '';
    eventLocationInput.value = '';
    eventCapacityInput.value = '';
    eventDescriptionInput.value = '';
    eventFeeInput.value = '';
    saveEventBtn.textContent = 'Add Event';
  }

  function loadEventIntoForm(eventId) {
    const event = getEventById(eventId);
    if (!event) return;
    eventIdInput.value = event.id;
    eventNameInput.value = event.name;
    eventDateInput.value = event.date;
    eventTimeInput.value = event.time;
    eventLocationInput.value = event.location;
    eventCapacityInput.value = event.capacity;
    eventDescriptionInput.value = event.description;
    eventFeeInput.value = event.fee;
    saveEventBtn.textContent = 'Save Event';
  }

  function saveEvent(event) {
    event.preventDefault();
    const eventName = eventNameInput.value.trim();
    const eventDate = eventDateInput.value.trim();
    const eventTime = eventTimeInput.value.trim();
    const eventLocation = eventLocationInput.value.trim();
    const eventCapacity = Number(eventCapacityInput.value);
    const eventDescription = eventDescriptionInput.value.trim();
    const eventFee = Number(eventFeeInput.value);
    if (!eventName || !eventDate || !eventTime || !eventLocation || !eventCapacity || !eventDescription || Number.isNaN(eventFee)) {
      alert('Please complete all event fields.');
      return;
    }
    const events = getEvents();
    if (eventIdInput.value) {
      const index = events.findIndex((item) => item.id === eventIdInput.value);
      if (index > -1) {
        events[index] = {
          ...events[index],
          name: eventName,
          date: eventDate,
          time: eventTime,
          location: eventLocation,
          capacity: eventCapacity,
          description: eventDescription,
          fee: eventFee,
        };
      }
    } else {
      events.push({
        id: createEventId(),
        name: eventName,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        capacity: eventCapacity,
        description: eventDescription,
        fee: eventFee,
        image: 'assets/images/hero-banner.jpg',
      });
    }
    saveStorageArray('events', events);
    clearEventForm();
    refreshAdminViews();
  }

  function deleteEvent(eventId) {
    if (!confirm('Delete this event? This will not remove existing registrations.')) return;
    const events = getEvents().filter((item) => item.id !== eventId);
    saveStorageArray('events', events);
    refreshAdminViews();
  }

  function renderRegistrationTable() {
    const registrations = getRegistrations();
    const filterValue = registrationFilter.value;
    registrationTableBody.innerHTML = '';
    registrations
      .filter((registration) => !filterValue || registration.eventId === filterValue)
      .forEach((registration) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${registration.regId}</td>
          <td>${registration.name}</td>
          <td>${registration.email}</td>
          <td>${registration.phone}</td>
          <td>${registration.cnic || '-'}</td>
          <td>${registration.eventName}</td>
          <td>${formatFee(registration.fee)}</td>
          <td>${registration.paymentStatus}</td>
          <td><a href="${registration.qrCodeUrl}" target="_blank" rel="noreferrer">View</a></td>
          <td class="table-actions">
            <button class="btn btn-small btn-secondary" data-action="mark-paid" data-id="${registration.regId}">Mark Paid</button>
            <button class="btn btn-small btn-secondary" data-action="delete-registration" data-id="${registration.regId}">Delete</button>
          </td>
        `;
        registrationTableBody.appendChild(row);
      });
  }

  function renderAttendanceTable() {
    const registrations = getRegistrations();
    const attendance = getAttendance();
    attendanceTableBody.innerHTML = '';
    attendance.forEach((record) => {
      const registration = registrations.find((item) => item.regId === record.regId) || {};
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.regId}</td>
        <td>${registration.name || '-'}</td>
        <td>${registration.eventName || '-'}</td>
        <td>${record.status}</td>
        <td><button class="btn btn-small btn-secondary" data-action="toggle-attendance" data-id="${record.regId}">Toggle</button></td>
      `;
      attendanceTableBody.appendChild(row);
    });
  }

  function renderAttendanceCounts() {
    const events = getEvents();
    const registrations = getRegistrations();
    const attendance = getAttendance();
    const counts = events.map((event) => {
      const eventRegistrations = registrations.filter((registration) => registration.eventId === event.id);
      const present = attendance.filter((record) => eventRegistrations.some((reg) => reg.regId === record.regId) && record.status === 'Present').length;
      return { title: event.name, present, total: eventRegistrations.length };
    });
    attendanceCounts.innerHTML = counts
      .map((item) => `<div class="attendance-count-card"><strong>${item.title}</strong><span>${item.present}/${item.total} Present</span></div>`)
      .join('');
  }

  function refreshAdminViews() {
    renderEventOptions();
    renderEventTable();
    renderRegistrationTable();
    renderAttendanceTable();
    renderAttendanceCounts();
    renderDashboardStats();
    renderRegistrationChart();
  }

  function renderDashboardStats() {
    const events = getEvents();
    const registrations = getRegistrations();
    const attendance = getAttendance();
    totalEventsEl.textContent = events.length;
    totalRegistrationsEl.textContent = registrations.length;
    totalPresentEl.textContent = attendance.filter((item) => item.status === 'Present').length;
    const pendingTotal = registrations
      .filter((registration) => registration.paymentStatus !== 'Paid')
      .reduce((sum, registration) => sum + Number(registration.fee), 0);
    totalPendingEl.textContent = formatFee(pendingTotal);
  }

  function renderRegistrationChart() {
    const events = getEvents();
    const registrations = getRegistrations();
    const labels = events.map((event) => event.name);
    const data = events.map((event) => registrations.filter((reg) => reg.eventId === event.id).length);
    if (registrationChart) registrationChart.destroy();
    registrationChart = new Chart(registrationChartCanvas, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Registrations', data, backgroundColor: 'rgba(198, 164, 63, 0.7)', borderColor: 'rgba(26, 42, 79, 0.9)', borderWidth: 1 }] },
      options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }

  function exportRegistrationsCsv() {
    const registrations = getRegistrations();
    const headers = ['Reg ID', 'Name', 'Email', 'Phone', 'CNIC', 'Event', 'Fee', 'Payment Status', 'QR Code URL', 'Timestamp'];
    const rows = registrations.map((registration) => [
      registration.regId, registration.name, registration.email, registration.phone, registration.cnic || '',
      registration.eventName, registration.fee, registration.paymentStatus, registration.qrCodeUrl, registration.timestamp
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'streamline-events-registrations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleMarkPresent() {
    const regId = adminScanInput.value.trim();
    if (!regId) { alert('Enter a valid registration ID.'); return; }
    const registrationExists = getRegistrations().some((reg) => reg.regId === regId);
    if (!registrationExists) { alert('Registration code not found.'); return; }
    updateAttendance(regId, 'Present');
    adminScanInput.value = '';
    refreshAdminViews();
    alert(`${regId} marked present.`);
  }

  eventForm.addEventListener('submit', saveEvent);
  resetEventBtn.addEventListener('click', clearEventForm);
  registrationFilter.addEventListener('change', renderRegistrationTable);
  exportCsvBtn.addEventListener('click', exportRegistrationsCsv);
  markPresentBtn.addEventListener('click', handleMarkPresent);
  eventTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'edit') loadEventIntoForm(id);
    if (action === 'delete') deleteEvent(id);
  });
  registrationTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'mark-paid') { updateRegistrationPayment(id); refreshAdminViews(); }
    if (action === 'delete-registration') {
      const registrations = getRegistrations().filter((registration) => registration.regId !== id);
      saveStorageArray('registrations', registrations);
      refreshAdminViews();
    }
  });
  attendanceTableBody.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === 'toggle-attendance') {
      const attendance = getAttendance();
      const entry = attendance.find((record) => record.regId === id);
      if (entry) { updateAttendance(id, entry.status === 'Present' ? 'Absent' : 'Present'); refreshAdminViews(); }
    }
  });
  refreshAdminViews();
}

window.addEventListener('DOMContentLoaded', () => {
  initData();
  setupNavigation();
  bindRegisterPage();
  bindContactPage();
  bindAdminPage();
});
