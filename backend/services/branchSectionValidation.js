'use strict';

/**
 * branchSectionValidation.js
 *
 * Lightweight, dependency-free validation for BranchSection.settings.
 *
 * The BranchSection.settings field is mongoose.Schema.Types.Mixed, so it
 * accepts any shape. This module enforces a minimal contract per section
 * type so that the frontend always receives a predictable, safe payload.
 *
 * Current rules:
 *   - type === 'booking':
 *       sideContentType must be one of: 'none', 'map', 'text'
 *       address        must be a string (coerced from truthy non-string values)
 *       customText     must be a string (coerced from truthy non-string values)
 *
 * Unknown keys are stripped to prevent mass-assignment into the Mixed doc.
 */

const ALLOWED_SIDE_CONTENT_TYPES = ['none', 'map', 'text'];

/**
 * Coerce a value to a string. Returns '' for null/undefined.
 * Objects/arrays are stringified; numbers/booleans become their String() form.
 */
function coerceString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    // Avoid storing complex objects — flatten to JSON string
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

function validateBookingSettings(settings) {
  const errors = [];

  // sideContentType — must be an allowed enum value
  let sideContentType = settings.sideContentType;
  if (sideContentType === undefined || sideContentType === null || sideContentType === '') {
    sideContentType = 'none';
  } else if (typeof sideContentType !== 'string' || !ALLOWED_SIDE_CONTENT_TYPES.includes(sideContentType)) {
    errors.push(`sideContentType must be one of: ${ALLOWED_SIDE_CONTENT_TYPES.join(', ')}`);
  }

  // address — coerce to string
  const address = coerceString(settings.address);

  // customText — coerce to string
  const customText = coerceString(settings.customText);

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return {
    ok: true,
    errors: [],
    value: {
      sideContentType,
      address,
      customText,
    },
  };
}

/**
 * Validate and sanitize a settings object for a given section type.
 *
 * @param {string} type — the BranchSection.type value
 * @param {object} settings — the raw settings payload from req.body
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateSectionSettings(type, settings) {
  // Guard: settings should be a plain object
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return { ok: false, errors: ['settings must be a plain object'], value: null };
  }

  switch (type) {
    case 'booking':
      return validateBookingSettings(settings);

    default:
      // For all other section types we currently have no enforced shape.
      // Return the settings as-is (shallow clone) to avoid mutating req.body.
      return { ok: true, errors: [], value: { ...settings } };
  }
}

module.exports = { validateSectionSettings, coerceString };