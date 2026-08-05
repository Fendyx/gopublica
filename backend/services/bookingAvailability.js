const moment = require('moment-timezone');
const BeautyService = require('../models/beauty/ServiceItem');
const BeautyMaster = require('../models/beauty/Master');
const BeautyAppointment = require('../models/beauty/Appointment');

function getDayName(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function toMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).split(':').map(Number);
  return hours * 60 + minutes;
}

function normalizeTime(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).split(':').map(Number);
  const safeHours = Number.isFinite(hours) ? hours : 0;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  return `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`;
}

function isInsideBreaks(candidateStart, candidateEnd, breaks = []) {
  if (!breaks?.length) return false;
  const startMinutes = candidateStart.getHours() * 60 + candidateStart.getMinutes();
  const endMinutes = candidateEnd.getHours() * 60 + candidateEnd.getMinutes();

  return breaks.some((item) => {
    const breakStart = toMinutes(item.start);
    const breakEnd = toMinutes(item.end);
    if (breakStart == null || breakEnd == null) return false;
    return startMinutes < breakEnd && endMinutes > breakStart;
  });
}

function parseDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

async function getAvailability({ tenantId, branchId, serviceId, masterId, date, timezone = 'Europe/Warsaw', stepMinutes = 30 }) {
  if (!tenantId || !serviceId || !date) {
    throw new Error('tenantId, serviceId and date are required');
  }

  const service = await BeautyService.findOne({ _id: serviceId, tenantId, isActive: true });
  if (!service) {
    throw new Error('Service not found');
  }

  const durationMinutes = service.durationMinutes || 30;

  const masterFilter = { tenantId, isActive: true };
  if (branchId) masterFilter.branchId = branchId;
  if (masterId) masterFilter._id = masterId;

  const masters = await BeautyMaster.find(masterFilter).populate('services', 'name price durationMinutes');
  if (!masters.length) {
    return { date, serviceId, slots: [] };
  }

  const dayName = getDayName(date);
  const dayDate = parseDate(date);
  const dayStart = moment.tz(`${date}T00:00:00`, timezone);

  const slots = [];

  for (const master of masters) {
    const masterSchedule = master.schedule?.get(dayName) || [];
    const effectiveSchedule = masterSchedule.filter((entry) => entry && entry.start && entry.end);

    if (!effectiveSchedule.length) {
      continue;
    }

    const overrides = (master.overrides || []).filter((item) => item.date === date);
    const hasDayOff = overrides.some((item) => item.type === 'day_off');
    if (hasDayOff) {
      continue;
    }

    const activeWindows = [];
    for (const entry of effectiveSchedule) {
      const entryStart = toMinutes(entry.start);
      const entryEnd = toMinutes(entry.end);
      if (entryStart == null || entryEnd == null || entryEnd <= entryStart) continue;

      activeWindows.push({ start: entryStart, end: entryEnd });
    }

    const breaks = (master.breaks || []).filter((entry) => entry.dayOfWeek === dayName);
    const appointments = await BeautyAppointment.find({
      tenantId,
      masterId: master._id,
      startAt: { $gte: dayStart.toDate(), $lt: moment(dayStart).add(1, 'day').toDate() },
      status: { $nin: ['cancelled', 'completed'] },
    }).lean();

    const occupiedRanges = appointments.map((appointment) => ({
      start: new Date(appointment.startAt),
      end: new Date(appointment.endAt),
    }));

    for (const window of activeWindows) {
      const startMinutes = window.start;
      const endMinutes = window.end;
      const slotStart = startMinutes;
      const slotEnd = startMinutes + durationMinutes;

      const candidateTimes = [];
      for (let current = startMinutes; current + durationMinutes <= endMinutes; current += stepMinutes) {
        const startTime = moment.tz(`${date}T00:00:00`, timezone).add(current, 'minutes');
        const endTime = moment(startTime).add(durationMinutes, 'minutes');
        const startAt = startTime.toDate();
        const endAt = endTime.toDate();
        const candidateBreak = isInsideBreaks(startTime.toDate(), endTime.toDate(), breaks);
        if (candidateBreak) continue;

        const overlaps = occupiedRanges.some((ap) => {
          const apStart = new Date(ap.start);
          const apEnd = new Date(ap.end);
          return startAt < apEnd && endAt > apStart;
        });
        if (overlaps) continue;

        candidateTimes.push({
          startAt,
          endAt,
          start: startTime.format('HH:mm'),
          end: endTime.format('HH:mm'),
        });
      }

      slots.push(...candidateTimes.map((slot) => ({
        masterId: master._id,
        masterName: master.name,
        serviceId: service._id,
        serviceName: service.name,
        ...slot,
      })));
    }
  }

  return { date, serviceId, slots };
}

module.exports = {
  getAvailability,
};
