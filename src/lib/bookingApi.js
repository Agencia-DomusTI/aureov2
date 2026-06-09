import { adminFetch, adminInvoke } from './adminAuth';
import { fetchFunction, invokeFunction } from './supabase';

export async function getBookingConfig() {
  return invokeFunction('booking-config', { method: 'POST', body: {} });
}

export async function getAvailability(date, durationMinutes) {
  return fetchFunction('availability', { date, duration: String(durationMinutes) });
}

export async function createBooking(payload) {
  return invokeFunction('create-booking', { body: payload });
}

export async function getAdminDashboard({ weekOffset = 0, weeks = 2 } = {}) {
  return adminFetch('admin-dashboard', {
    weekOffset: String(weekOffset),
    weeks: String(weeks),
  });
}

export async function deleteAdminBooking({ source, id }) {
  return adminInvoke('admin-delete-booking', {
    method: 'POST',
    body: { source, id },
  });
}

export async function getAdminSettings() {
  return adminFetch('admin-settings');
}

export async function saveAdminSettings(settings) {
  return adminInvoke('admin-settings', { method: 'PUT', body: settings });
}

export async function startGoogleConnect() {
  return adminInvoke('admin-google-auth');
}

export async function disconnectGoogleCalendar() {
  return adminInvoke('admin-google-disconnect', { method: 'POST' });
}
