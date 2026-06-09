import { fetchFunction, invokeFunction } from './supabase';

export async function getBookingConfig() {
  return invokeFunction('booking-config');
}

export async function getAvailability(date, durationMinutes) {
  return fetchFunction('availability', { date, duration: String(durationMinutes) });
}

export async function createBooking(payload) {
  return invokeFunction('create-booking', { body: payload });
}

export async function getAdminDashboard() {
  return invokeFunction('admin-dashboard');
}

export async function getAdminSettings() {
  return fetchFunction('admin-settings');
}

export async function saveAdminSettings(settings) {
  return invokeFunction('admin-settings', { method: 'PUT', body: settings });
}

export async function startGoogleConnect() {
  return invokeFunction('admin-google-auth');
}

export async function disconnectGoogleCalendar() {
  return invokeFunction('admin-google-disconnect', { method: 'POST' });
}
