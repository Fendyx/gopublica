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
 *                      [{ imageUrl?: string, videoUrl?: string }] — at least one
 *                      of the two required per slide (max 10 items)
 *
 * Unknown keys are preserved for carousel and hero settings to avoid breaking
 * dynamic-mode configurations (mode, selectionMode, primaryCta, etc.).
 * Only the booking validator strips unknown keys.
 */

const ALLOWED_SIDE_CONTENT_TYPES = ['none', 'map', 'text'];

const ALLOWED_DESKTOP_ITEMS_PER_ROW = [3, 4, 5];
const DEFAULT_DESKTOP_ITEMS_PER_ROW = 3;

const ALLOWED_HERO_MEDIA_TYPES = ['image', 'video', 'slider'];
const ALLOWED_TEXT_ALIGNMENTS = ['left', 'center', 'right'];
const DEFAULT_TEXT_ALIGNMENT = 'center';
const DEFAULT_MAX_SLIDES = 10;

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
 * @param {object} settings — the raw settings payload from req.body
 * @param {boolean} includeLinkToDetailPage — true for entity_carousel, false for feature_carousel
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateCarouselSettings(settings, includeLinkToDetailPage) {
  const errors = [];

  // desktopItemsPerRow — default to 3 when absent/null/empty
  let desktopItemsPerRow = settings.desktopItemsPerRow;
  if (desktopItemsPerRow === undefined || desktopItemsPerRow === null || desktopItemsPerRow === '') {
    desktopItemsPerRow = DEFAULT_DESKTOP_ITEMS_PER_ROW;
  } else if (typeof desktopItemsPerRow !== 'number' || !Number.isInteger(desktopItemsPerRow)) {
    errors.push('desktopItemsPerRow must be an integer');
  } else if (!ALLOWED_DESKTOP_ITEMS_PER_ROW.includes(desktopItemsPerRow)) {
    errors.push(`desktopItemsPerRow must be one of: ${ALLOWED_DESKTOP_ITEMS_PER_ROW.join(', ')}`);
  }

  // Preserve all existing settings — only override the fields we validate.
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
 * overlayOpacity, etc.) are preserved as-is — same contract as carousel.
 *
 * @param {object} settings — the raw settings payload from req.body
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateHeroSettings(settings) {
  const errors = [];

  // Preserve all existing settings — only override the fields we validate.
  const value = { ...settings };

  // textAlignment — default to 'center' when absent/null/empty
  let textAlignment = settings.textAlignment;
  if (textAlignment === undefined || textAlignment === null || textAlignment === '') {
    textAlignment = DEFAULT_TEXT_ALIGNMENT;
  } else if (
    typeof textAlignment !== 'string' ||
    !ALLOWED_TEXT_ALIGNMENTS.includes(textAlignment)
  ) {
    errors.push(`textAlignment must be one of: ${ALLOWED_TEXT_ALIGNMENTS.join(', ')}`);
  }

  // mediaType — infer for legacy docs missing the key
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

  // slides — sanitize only when the effective media type is 'slider'
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

          // Strip unknown keys — keep only the whitelisted fields.
          const cleanSlide = {};
          if (imageUrl) cleanSlide.imageUrl = imageUrl;
          if (videoUrl) cleanSlide.videoUrl = videoUrl;
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
 * @param {object} settings — the raw settings payload from req.body
 * @returns {{ ok: boolean, errors: string[], value: object|null }}
 */
function validateArticleGridSettings(settings) {
  const errors = [];

  // Preserve all existing settings — only override the fields we validate.
  const value = { ...settings };

  // layoutMode — default to 'grid' when absent/null/empty
  let layoutMode = settings.layoutMode;
  if (layoutMode === undefined || layoutMode === null || layoutMode === '') {
    layoutMode = DEFAULT_LAYOUT_MODE;
  } else if (
    typeof layoutMode !== 'string' ||
    !ALLOWED_LAYOUT_MODES.includes(layoutMode)
  ) {
    errors.push(`layoutMode must be one of: ${ALLOWED_LAYOUT_MODES.join(', ')}`);
  }

  // aspectRatio — default to '16:9' when absent/null/empty
  let aspectRatio = settings.aspectRatio;
  if (aspectRatio === undefined || aspectRatio === null || aspectRatio === '') {
    aspectRatio = DEFAULT_ASPECT_RATIO;
  } else if (
    typeof aspectRatio !== 'string' ||
    !ALLOWED_ASPECT_RATIOS.includes(aspectRatio)
  ) {
    errors.push(`aspectRatio must be one of: ${ALLOWED_ASPECT_RATIOS.join(', ')}`);
  }

  // cardVariant — default to 'default' when absent/null/empty
  let cardVariant = settings.cardVariant;
  if (cardVariant === undefined || cardVariant === null || cardVariant === '') {
    cardVariant = DEFAULT_CARD_VARIANT;
  } else if (
    typeof cardVariant !== 'string' ||
    !ALLOWED_CARD_VARIANTS.includes(cardVariant)
  ) {
    errors.push(`cardVariant must be one of: ${ALLOWED_CARD_VARIANTS.join(', ')}`);
  }

  // itemsPerRow — default to 3 when absent/null/empty, must be an allowed integer
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

    case 'entity_carousel':
      return validateCarouselSettings(settings, true);

    case 'feature_carousel':
      return validateCarouselSettings(settings, false);

    case 'hero':
    case 'hero_video':
      return validateHeroSettings(settings);

    case 'article_grid':
      return validateArticleGridSettings(settings);

    default:
      // For all other section types we currently have no enforced shape.
      // Return the settings as-is (shallow clone) to avoid mutating req.body.
      return { ok: true, errors: [], value: { ...settings } };
  }
}

module.exports = { validateSectionSettings, coerceString };