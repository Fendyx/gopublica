const { triggerRevalidation } = require('./revalidationService');

/**
 * Register revalidation post-hooks on a Mongoose schema.
 *
 * IMPORTANT: This MUST be called BEFORE `mongoose.model()` compiles the schema.
 * Hooks attached after compilation are silently ignored by the compiled model.
 *
 * @param {mongoose.Schema} schema - The schema to attach hooks to
 * @param {Object} config
 * @param {string} config.modelName - Name used for logging
 * @param {Function} config.getTags - (doc) => string[] - returns cache tags
 * @param {Function} [config.getBranchId] - (doc) => string|null - optional branchId
 * @param {Function} [config.getEntityId] - (doc) => string|null - optional entity identifier
 */
function registerRevalidationHooks(schema, { modelName, getTags, getBranchId, getEntityId }) {
  const getTenantId = (doc) => doc?.tenantId;

  // ── POST SAVE (create + update) ──
  schema.post('save', async function (doc) {
    if (!doc) return;
    try {
      const tags = getTags(doc);
      const branchId = getBranchId?.(doc) || null;
      const entityId = getEntityId?.(doc) || null;
      const action = this.isNew ? 'create' : 'update';

      await triggerRevalidation({
        tenantId: getTenantId(doc),
        branchId,
        tags,
        action,
        model: modelName,
        entityId,
      });
    } catch (err) {
      console.error(`❌ Revalidation hook error (${modelName}.save):`, err.message);
    }
  });

  // ── POST FIND ONE AND UPDATE ──
  schema.post('findOneAndUpdate', async function (doc) {
    if (!doc) return;
    try {
      const tags = getTags(doc);
      const branchId = getBranchId?.(doc) || null;
      const entityId = getEntityId?.(doc) || null;

      await triggerRevalidation({
        tenantId: getTenantId(doc),
        branchId,
        tags,
        action: 'update',
        model: modelName,
        entityId,
      });
    } catch (err) {
      console.error(
        `❌ Revalidation hook error (${modelName}.findOneAndUpdate):`,
        err.message
      );
    }
  });

  // ── POST FIND ONE AND DELETE ──
  schema.post('findOneAndDelete', async function (doc) {
    if (!doc) return;
    try {
      const tags = getTags(doc);
      const branchId = getBranchId?.(doc) || null;
      const entityId = getEntityId?.(doc) || null;

      await triggerRevalidation({
        tenantId: getTenantId(doc),
        branchId,
        tags,
        action: 'delete',
        model: modelName,
        entityId,
      });
    } catch (err) {
      console.error(
        `❌ Revalidation hook error (${modelName}.findOneAndDelete):`,
        err.message
      );
    }
  });
}

module.exports = { registerRevalidationHooks };