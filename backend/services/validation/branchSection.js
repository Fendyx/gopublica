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
 *   - type === 'entity_carousel' / 'feature_carousel':
 *       desktopItemsPerRow must be one of: 3, 4, 5 (default: 3)
 *       entity_carousel also passes through linkToDetailPage (boolean)
 *   - type === 'hero' / 'hero_video':
 *       mediaType      must be one of: 'image', 'video', 'slider'
 *                      (inferred from videoUrl for legacy docs missing the key)
 *       textAlignment  must be one of: 'left', 'center', 'right' (default: 'center')
 *       slides         sanitized only when mediaType === 'slider':
 *                      [{ imageUrl?: string, videoUrl?: string }] - at least one
 *                      of the two required per slide (max 10 items)
 *
 * Unknown keys are preserved for carousel and hero settings to avoid breaking
 * dynamic-mode configurations (mode, selectionMode, primaryCta, etc.).
 * Only the booking validator strips unknown keys.
 */

const ALLOWED_SIDE_CONTENT_TYPES = ['none', 'map', 'text'];
const ALLOWED_CHECKOUT_FLOWS = ['inline', 'redirect'];
const ALLOWED_BOOKING_MODES = ['reservation', 'slot_booking'];
const ALLOWED_SLOT_INTERVALS = [15, 30, 60, 90, 120, 180];
const DEFAULT_SLOT_START = '09:00';
const DEFAULT_SLOT_END = '22:00';
const DEFAULT_SLOT_INTERVAL = 60;
const DEFAULT_SLOT_CAPACITY = 10;

const ALLOWED_DESKTOP_ITEMS_PER_ROW = [3, 4, 5];
const DEFAULT_DESKTOP_ITEMS_PER_ROW = 3;

const ALLOWED_HERO_MEDIA_TYPES = ['image', 'video', 'slider'];
const ALLOWED_TEXT_ALIGNMENTS = ['left', 'center', 'right'];
const DEFAULT_TEXT_ALIGNMENT = 'center';
const DEFAULT_MAX_SLIDES = 10;
const ALLOWED_HERO_PRESETS = ['classic_with_buttons', 'banner_link', 'gallery_slider'];
const ALLOWED_HERO_CTA_VARIANTS = ['filled', 'outline', 'ghost', 'soft', 'borderless', 'underline'];
const ALLOWED_GRADIENT_DIRECTIONS = ['to-r', 'to-br', 'to-b', 'to-bl'];
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// ─── Dynamic Form (reuses JobFormSettings field contract) ──────────────
const ALLOWED_FIELD_TYPES = [
  'text', 'email', 'tel', 'textarea', 'select', 'file', 'checkbox', 'radio', 'date',
];
const DEFAULT_MAX_FORM_FIELDS = 30;

const ALLOWED_LAYOUT_MODES = ['grid', 'carousel'];
const DEFAULT_LAYOUT_MODE = 'grid';

const ALLOWED_ASPECT_RATIOS = ['16:9', '4:3', '1:1', '9:16'];
const DEFAULT_ASPECT_RATIO = '16:9';

const ALLOWED_CARD_VARIANTS = ['default', 'overlay'];
const DEFAULT_CARD_VARIANT = 'default';

const ALLOWED_ITEMS_PER_ROW = [2, 3, 4, 5];
const DEFAULT_ITEMS_PER_ROW = 3;

/**
 * Coerce a value to a string. Returns '' for null/undefined.
 * Objects/arrays are stringified; numbers/booleans become their String() form.
 */
function coerceString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    // Avoid storing complex objects - flatten to JSON string
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

  // sideContentType - must be an allowed enum value
  let sideContentType = settings.sideContentType;
  if (sideContentType === undefined || sideContentType === null || sideContentType === '') {
    sideContentType = 'none';
  } else if (typeof sideContentType !== 'string' || !ALLOWED_SIDE_CONTENT_TYPES.includes(sideContentType)) {
    errors.push(`sideContentType must be one of: ${ALLOWED_SIDE_CONTENT_TYPES.join(', ')}`);
  }

  // checkoutFlow - must be 'inline' or 'redirect' (default 'inline')
  let checkoutFlow = settings.checkoutFlow;
  if (checkoutFlow === undefined || checkoutFlow === null || checkoutFlow === '') {
    checkoutFlow = 'inline';
  } else if (typeof checkoutFlow !== 'string' || !ALLOWED_CHECKOUT_FLOWS.includes(checkoutFlow)) {
    errors.push(`checkoutFlow must be one of: ${ALLOWED_CHECKOUT_FLOWS.join(', ')}`);
  }

  // address - coerce to string
  const address = coerceString(settings.address);

  // customText - coerce to string
  const customText = coerceString(settings.customText);

  // ── Slot booking mode fields ──
  let bookingMode = settings.bookingMode;
  if (bookingMode === undefined || bookingMode === null || bookingMode === '') {
    bookingMode = 'reservation';
  } else if (typeof bookingMode !== 'string' || !ALLOWED_BOOKING_MODES.includes(bookingMode)) {
    errors.push(`bookingMode must be one of: ${ALLOWED_BOOKING_MODES.join(', ')}`);
  }

  let slotStartTime = coerceString(settings.slotStartTime) || DEFAULT_SLOT_START;
  let slotEndTime = coerceString(settings.slotEndTime) || DEFAULT_SLOT_END;
  let slotIntervalMinutes = settings.slotIntervalMinutes;
  let slotCapacity = settings.slotCapacity;

  if (bookingMode === 'slot_booking') {
    // Validate time format (HH:mm)
    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(slotStartTime)) {
      errors.push('slotStartTime must be in HH:mm format');
    }
    if (!timeRe.test(slotEndTime)) {
      errors.push('slotEndTime must be in HH:mm format');
    }

    if (slotIntervalMinutes === undefined || slotIntervalMinutes === null) {
      slotIntervalMinutes = DEFAULT_SLOT_INTERVAL;
    } else if (typeof slotIntervalMinutes !== 'number' || !ALLOWED_SLOT_INTERVALS.includes(slotIntervalMinutes)) {
      errors.push(`slotIntervalMinutes must be one of: ${ALLOWED_SLOT_INTERVALS.join(', ')}`);
    }

    if (slotCapacity === undefined || slotCapacity === null) {
      slotCapacity = DEFAULT_SLOT_CAPACITY;
    } else if (typeof slotCapacity !== 'number' || !Number.isInteger(slotCapacity) || slotCapacity < 1 || slotCapacity > 999) {
      errors.push('slotCapacity must be an integer between 1 and 999');
    }
  } else {
    // Reset slot fields to defaults for non-slot mode
    slotStartTime = DEFAULT_SLOT_START;
    slotEndTime = DEFAULT_SLOT_END;
    slotIntervalMinutes = DEFAULT_SLOT_INTERVAL;
    slotCapacity = DEFAULT_SLOT_CAPACITY;
  }

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return {
    ok: true,
    errors: [],
    value: {
      sideContentType,
      checkoutFlow,
      address,
      customText,
      bookingMode,
      slotStartTime,
      slotEndTime,
      slotIntervalMinutes,
      slotCapacity,
    },
  };
}

/**
 * Validate and sanitize carousel settings for entity_carousel / feature_carousel.
 *
 * Enforces:
 *   - desktopItemsPerRow must be one of: 3, 4, 5 (default: 3)
 *   - entity_carousel also passes through linkToDetailPage (boolean)
 *
 * All other existing keys (mode, selectionMode, selectedCategoryKeys,
 * productCardVariant, etc.) are preserved as-is to avoid breaking
 * dynamic carousel configurations.
 *
 * @param {object} settings - the raw settings payload from req.body
 * @param {boolean} includeLinkToDetailPage - true for entity_carousel, false for feature_carousel
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateCarouselSettings(settings, includeLinkToDetailPage) {
  const errors = [];

  // desktopItemsPerRow - default to 3 when absent/null/empty
  let desktopItemsPerRow = settings.desktopItemsPerRow;
  if (desktopItemsPerRow === undefined || desktopItemsPerRow === null || desktopItemsPerRow === '') {
    desktopItemsPerRow = DEFAULT_DESKTOP_ITEMS_PER_ROW;
  } else if (typeof desktopItemsPerRow !== 'number' || !Number.isInteger(desktopItemsPerRow)) {
    errors.push('desktopItemsPerRow must be an integer');
  } else if (!ALLOWED_DESKTOP_ITEMS_PER_ROW.includes(desktopItemsPerRow)) {
    errors.push(`desktopItemsPerRow must be one of: ${ALLOWED_DESKTOP_ITEMS_PER_ROW.join(', ')}`);
  }

  // Preserve all existing settings - only override the fields we validate.
  // This prevents stripping mode, selectionMode, selectedCategoryKeys,
  // productCardVariant, and any future additions.
  const value = { ...settings };

  value.desktopItemsPerRow = desktopItemsPerRow;

  if (includeLinkToDetailPage) {
    value.linkToDetailPage = Boolean(settings.linkToDetailPage);
  }

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return { ok: true, errors: [], value };
}

/**
 * Validate and sanitize hero settings for 'hero' / 'hero_video'.
 *
 * Enforces:
 *   - mediaType must be one of: 'image', 'video', 'slider'.
 *     Legacy docs without the key are inferred from videoUrl
 *     (non-empty string → 'video', otherwise → 'image').
 *   - textAlignment must be one of: 'left', 'center', 'right' (default: 'center')
 *   - slides sanitized only when effective mediaType === 'slider':
 *       [{ imageUrl?: string, videoUrl?: string }], max DEFAULT_MAX_SLIDES items.
 *       Each slide must have at least one of the two; unknown keys are stripped.
 *     When mediaType !== 'slider' a stale slides array is removed.
 *
 * All other existing keys (primaryCta, secondaryCta, videoUrl, imageUrl,
 * overlayOpacity, etc.) are preserved as-is - same contract as carousel.
 *
 * @param {object} settings - the raw settings payload from req.body
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateHeroSettings(settings) {
  const errors = [];

  // Preserve all existing settings - only override the fields we validate.
  const value = { ...settings };

  // textAlignment - default to 'center' when absent/null/empty
  let textAlignment = settings.textAlignment;
  if (textAlignment === undefined || textAlignment === null || textAlignment === '') {
    textAlignment = DEFAULT_TEXT_ALIGNMENT;
  } else if (
    typeof textAlignment !== 'string' ||
    !ALLOWED_TEXT_ALIGNMENTS.includes(textAlignment)
  ) {
    errors.push(`textAlignment must be one of: ${ALLOWED_TEXT_ALIGNMENTS.join(', ')}`);
  }

  // mediaType - infer for legacy docs missing the key
  let mediaType = settings.mediaType;
  if (mediaType === undefined || mediaType === null || mediaType === '') {
    mediaType =
      typeof settings.videoUrl === 'string' && settings.videoUrl.trim() !== ''
        ? 'video'
        : 'image';
  } else if (
    typeof mediaType !== 'string' ||
    !ALLOWED_HERO_MEDIA_TYPES.includes(mediaType)
  ) {
    errors.push(`mediaType must be one of: ${ALLOWED_HERO_MEDIA_TYPES.join(', ')}`);
  }

  // slides - sanitize only when the effective media type is 'slider'
  if (!errors.includes(`mediaType must be one of: ${ALLOWED_HERO_MEDIA_TYPES.join(', ')}`)) {
    if (mediaType === 'slider') {
      let slides = settings.slides;
      if (slides === undefined || slides === null || slides === '') {
        slides = [];
      } else if (!Array.isArray(slides)) {
        errors.push('slides must be an array');
        slides = [];
      } else {
        if (slides.length > DEFAULT_MAX_SLIDES) {
          errors.push(`slides must contain at most ${DEFAULT_MAX_SLIDES} items`);
        }
        const sanitized = [];
        slides.forEach((slide, i) => {
          if (!slide || typeof slide !== 'object' || Array.isArray(slide)) {
            errors.push(`slides[${i}] must be an object`);
            return;
          }
          // Backward-compatible contract: a slide carries imageUrl and/or videoUrl.
          const imageUrl = typeof slide.imageUrl === 'string' ? slide.imageUrl.trim() : undefined;
          const videoUrl = typeof slide.videoUrl === 'string' ? slide.videoUrl.trim() : undefined;

          if (!imageUrl && !videoUrl) {
            errors.push(
              `slides[${i}] must contain at least one of: imageUrl, videoUrl (non-empty strings)`
            );
            return;
          }

          // Strip unknown keys - keep only the whitelisted fields.
          const cleanSlide = {};
          if (imageUrl) cleanSlide.imageUrl = imageUrl;
          if (videoUrl) cleanSlide.videoUrl = videoUrl;
          // clickableUrl - optional per-slide link
          const clickableUrl = typeof slide.clickableUrl === 'string' ? slide.clickableUrl.trim() : '';
          if (clickableUrl) cleanSlide.clickableUrl = clickableUrl;
          sanitized.push(cleanSlide);
        });
        slides = sanitized;
      }
      value.slides = slides;
    } else {
      // Avoid stale payloads confusing the frontend when switching away from slider
      delete value.slides;
    }
  }

  value.mediaType = mediaType;
  value.textAlignment = textAlignment;

  // preset - must be one of allowed values or undefined
  if (settings.preset !== undefined && settings.preset !== null && settings.preset !== '') {
    if (typeof settings.preset !== 'string' || !ALLOWED_HERO_PRESETS.includes(settings.preset)) {
      errors.push(`preset must be one of: ${ALLOWED_HERO_PRESETS.join(', ')}`);
    } else {
      value.preset = settings.preset;
    }
  } else {
    delete value.preset;
  }

  // clickableUrl - optional string for clickable background
  if (settings.clickableUrl !== undefined && settings.clickableUrl !== null) {
    const clickableUrl = typeof settings.clickableUrl === 'string' ? settings.clickableUrl.trim() : '';
    if (clickableUrl) {
      value.clickableUrl = clickableUrl;
    } else {
      delete value.clickableUrl;
    }
  }

  // sliderShowArrows - optional boolean
  if (typeof settings.sliderShowArrows === 'boolean') {
    value.sliderShowArrows = settings.sliderShowArrows;
  } else {
    delete value.sliderShowArrows;
  }

  // sliderPauseOnInteraction - optional boolean
  if (typeof settings.sliderPauseOnInteraction === 'boolean') {
    value.sliderPauseOnInteraction = settings.sliderPauseOnInteraction;
  } else {
    delete value.sliderPauseOnInteraction;
  }

  // overlayOpacity - optional number 0-100
  if (settings.overlayOpacity !== undefined && settings.overlayOpacity !== null) {
    const op = Number(settings.overlayOpacity);
    if (Number.isNaN(op) || op < 0 || op > 100) {
      errors.push('overlayOpacity must be a number between 0 and 100');
    } else {
      value.overlayOpacity = op;
    }
  }

  // Validate CTA fields (primaryCta, secondaryCta)
  const validateCta = (cta, ctaLabel) => {
    if (!cta || typeof cta !== 'object') return;
    // color - optional hex string
    if (cta.color !== undefined && cta.color !== null && cta.color !== '') {
      if (typeof cta.color !== 'string' || !HEX_COLOR_RE.test(cta.color)) {
        errors.push(`${ctaLabel}.color must be a valid hex color (e.g. #ff0000)`);
      }
    }
    // textColor - optional hex string
    if (cta.textColor !== undefined && cta.textColor !== null && cta.textColor !== '') {
      if (typeof cta.textColor !== 'string' || !HEX_COLOR_RE.test(cta.textColor)) {
        errors.push(`${ctaLabel}.textColor must be a valid hex color (e.g. #ffffff)`);
      }
    }
    // variant - must be one of allowed values
    if (cta.variant !== undefined && cta.variant !== null && cta.variant !== '') {
      if (typeof cta.variant !== 'string' || !ALLOWED_HERO_CTA_VARIANTS.includes(cta.variant)) {
        errors.push(`${ctaLabel}.variant must be one of: ${ALLOWED_HERO_CTA_VARIANTS.join(', ')}`);
      }
    }
    // gradientFrom - optional hex string
    if (cta.gradientFrom !== undefined && cta.gradientFrom !== null && cta.gradientFrom !== '') {
      if (typeof cta.gradientFrom !== 'string' || !HEX_COLOR_RE.test(cta.gradientFrom)) {
        errors.push(`${ctaLabel}.gradientFrom must be a valid hex color`);
      }
    }
    // gradientTo - optional hex string
    if (cta.gradientTo !== undefined && cta.gradientTo !== null && cta.gradientTo !== '') {
      if (typeof cta.gradientTo !== 'string' || !HEX_COLOR_RE.test(cta.gradientTo)) {
        errors.push(`${ctaLabel}.gradientTo must be a valid hex color`);
      }
    }
    // gradientDirection - must be one of allowed values
    if (cta.gradientDirection !== undefined && cta.gradientDirection !== null && cta.gradientDirection !== '') {
      if (typeof cta.gradientDirection !== 'string' || !ALLOWED_GRADIENT_DIRECTIONS.includes(cta.gradientDirection)) {
        errors.push(`${ctaLabel}.gradientDirection must be one of: ${ALLOWED_GRADIENT_DIRECTIONS.join(', ')}`);
      }
    }
  };
  validateCta(settings.primaryCta, 'primaryCta');
  validateCta(settings.secondaryCta, 'secondaryCta');

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return { ok: true, errors: [], value };
}

/**
 * Validate and sanitize article_grid settings.
 *
 * Enforces:
 *   - layoutMode must be one of: 'grid', 'carousel' (default: 'grid')
 *   - aspectRatio must be one of: '16:9', '4:3', '1:1' (default: '16:9')
 *   - cardVariant must be one of: 'default', 'overlay' (default: 'default')
 *
 * All other existing keys are preserved as-is to avoid breaking
 * dynamic article_grid configurations.
 *
 * @param {object} settings - the raw settings payload from req.body
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateArticleGridSettings(settings) {
  const errors = [];

  // Preserve all existing settings - only override the fields we validate.
  const value = { ...settings };

  // layoutMode - default to 'grid' when absent/null/empty
  let layoutMode = settings.layoutMode;
  if (layoutMode === undefined || layoutMode === null || layoutMode === '') {
    layoutMode = DEFAULT_LAYOUT_MODE;
  } else if (
    typeof layoutMode !== 'string' ||
    !ALLOWED_LAYOUT_MODES.includes(layoutMode)
  ) {
    errors.push(`layoutMode must be one of: ${ALLOWED_LAYOUT_MODES.join(', ')}`);
  }

  // aspectRatio - default to '16:9' when absent/null/empty
  let aspectRatio = settings.aspectRatio;
  if (aspectRatio === undefined || aspectRatio === null || aspectRatio === '') {
    aspectRatio = DEFAULT_ASPECT_RATIO;
  } else if (
    typeof aspectRatio !== 'string' ||
    !ALLOWED_ASPECT_RATIOS.includes(aspectRatio)
  ) {
    errors.push(`aspectRatio must be one of: ${ALLOWED_ASPECT_RATIOS.join(', ')}`);
  }

  // cardVariant - default to 'default' when absent/null/empty
  let cardVariant = settings.cardVariant;
  if (cardVariant === undefined || cardVariant === null || cardVariant === '') {
    cardVariant = DEFAULT_CARD_VARIANT;
  } else if (
    typeof cardVariant !== 'string' ||
    !ALLOWED_CARD_VARIANTS.includes(cardVariant)
  ) {
    errors.push(`cardVariant must be one of: ${ALLOWED_CARD_VARIANTS.join(', ')}`);
  }

  // itemsPerRow - default to 3 when absent/null/empty, must be an allowed integer
  let itemsPerRow = settings.itemsPerRow;
  if (itemsPerRow === undefined || itemsPerRow === null || itemsPerRow === '') {
    itemsPerRow = DEFAULT_ITEMS_PER_ROW;
  } else if (typeof itemsPerRow !== 'number' || !Number.isInteger(itemsPerRow)) {
    errors.push('itemsPerRow must be an integer');
  } else if (!ALLOWED_ITEMS_PER_ROW.includes(itemsPerRow)) {
    errors.push(`itemsPerRow must be one of: ${ALLOWED_ITEMS_PER_ROW.join(', ')}`);
  }

  value.layoutMode = layoutMode;
  value.aspectRatio = aspectRatio;
  value.cardVariant = cardVariant;
  value.itemsPerRow = itemsPerRow;

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return { ok: true, errors: [], value };
}

/**
 * Validate and sanitize a settings object for a given section type.
 *
 * @param {string} type - the BranchSection.type value
 * @param {object} settings - the raw settings payload from req.body
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

    case 'entity_carousel':
      return validateCarouselSettings(settings, true);

    case 'feature_carousel':
      return validateCarouselSettings(settings, false);

    case 'hero':
    case 'hero_video':
      return validateHeroSettings(settings);

    case 'article_grid':
      return validateArticleGridSettings(settings);

    case 'dynamic_form':
      return validateDynamicFormSettings(settings);

    case 'rich_text':
      return validateRichTextSettings(settings);

    default:
      // For all other section types we currently have no enforced shape.
      // Return the settings as-is (shallow clone) to avoid mutating req.body.
      return { ok: true, errors: [], value: { ...settings } };
  }
}

/**
 * Validate and sanitize settings for a 'dynamic_form' section type.
 *
 * Reuses the field contract from JobFormSettings (see models/JobFormSettings.js):
 *   { id, label, labelI18n, type, required, options, optionsI18n,
 *     placeholder, placeholderI18n, validation: { pattern, minLength, maxLength }, order }
 *
 * Enforces:
 *   - fields must be an array (max DEFAULT_MAX_FORM_FIELDS items)
 *   - each field is sanitized to the whitelisted keys above (unknown keys stripped)
 *   - field ids must be unique and non-empty
 *   - type must be one of ALLOWED_FIELD_TYPES
 *   - options required for select/radio types
 *
 * Top-level presentation keys (title, description, submitButtonText, etc.)
 * are preserved as-is to allow future additions.
 *
 * @param {object} settings - the raw settings payload from req.body
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateDynamicFormSettings(settings) {
  const errors = [];

  // Preserve all top-level keys - only sanitize the fields array.
  const value = { ...settings };

  // fields - must be an array
  let fields = settings.fields;
  if (fields === undefined || fields === null) {
    fields = [];
  } else if (!Array.isArray(fields)) {
    errors.push('fields must be an array');
    fields = [];
  } else {
    if (fields.length > DEFAULT_MAX_FORM_FIELDS) {
      errors.push(`fields must contain at most ${DEFAULT_MAX_FORM_FIELDS} items`);
    }

    const seenIds = new Set();
    const sanitized = [];

    fields.forEach((field, i) => {
      if (!field || typeof field !== 'object' || Array.isArray(field)) {
        errors.push(`fields[${i}] must be an object`);
        return;
      }

      // id - required, unique, non-empty string
      const id = typeof field.id === 'string' ? field.id.trim() : '';
      if (!id) {
        errors.push(`fields[${i}].id is required and must be a non-empty string`);
        return;
      }
      if (seenIds.has(id)) {
        errors.push(`fields[${i}].id must be unique (duplicate: '${id}')`);
        return;
      }
      seenIds.add(id);

      // type - must be one of the allowed enums
      const type = field.type;
      if (!ALLOWED_FIELD_TYPES.includes(type)) {
        errors.push(
          `fields[${i}].type must be one of: ${ALLOWED_FIELD_TYPES.join(', ')}`
        );
        return;
      }

      // options required for select/radio
      if ((type === 'select' || type === 'radio') && !Array.isArray(field.options)) {
        errors.push(`fields[${i}].options is required for type '${type}'`);
      }

      // Build sanitized field - whitelist only known keys
      const cleanField = {
        id,
        label: coerceString(field.label),
        type,
        required: Boolean(field.required),
        order: typeof field.order === 'number' ? field.order : i,
      };

      // Optional keys - only include if present
      if (field.labelI18n && typeof field.labelI18n === 'object') {
        cleanField.labelI18n = field.labelI18n;
      }
      if (Array.isArray(field.options)) {
        cleanField.options = field.options;
      }
      if (field.optionsI18n && typeof field.optionsI18n === 'object') {
        cleanField.optionsI18n = field.optionsI18n;
      }
      if (field.placeholder !== undefined) {
        cleanField.placeholder = coerceString(field.placeholder);
      }
      if (field.placeholderI18n && typeof field.placeholderI18n === 'object') {
        cleanField.placeholderI18n = field.placeholderI18n;
      }
      if (field.validation && typeof field.validation === 'object') {
        const v = field.validation;
        cleanField.validation = {
          pattern: v.pattern !== undefined ? coerceString(v.pattern) : '',
          minLength: typeof v.minLength === 'number' ? v.minLength : 0,
          maxLength: typeof v.maxLength === 'number' ? v.maxLength : 0,
        };
      }

      sanitized.push(cleanField);
    });

    fields = sanitized;
  }

  value.fields = fields;

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return { ok: true, errors: [], value };
}

module.exports = { validateSectionSettings, validateDynamicFormSettings, coerceString };

/**
 * Validate and sanitize settings for a 'rich_text' section type.
 *
 * Enforces:
 *   - content must be a string (coerced from truthy non-string values)
 *   - contentI18n must be an object with string values
 *
 * @param {object} settings - the raw settings payload from req.body
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateRichTextSettings(settings) {
  const errors = [];

  const content = coerceString(settings.content);

  const value = { content };

  if (settings.contentI18n && typeof settings.contentI18n === 'object' && !Array.isArray(settings.contentI18n)) {
    const sanitized = {};
    for (const [lang, text] of Object.entries(settings.contentI18n)) {
      sanitized[lang] = coerceString(text);
    }
    value.contentI18n = sanitized;
  }

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return { ok: true, errors: [], value };
}