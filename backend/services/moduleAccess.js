const MODULE_KEYS = ['orders', 'menu', 'reservations', 'gallery', 'news', 'jobs', 'sections'];

const DEFAULT_MODULES_BY_NICHE = {
  auto: {
    orders: false,
    menu: false,
    reservations: true,
    gallery: true,
    news: true,
    jobs: true,
    sections: true,
  },
  beauty: {
    orders: false,
    menu: true,
    reservations: true,
    gallery: true,
    news: true,
    jobs: true,
    sections: true,
  },
  food: {
    orders: true,
    menu: true,
    reservations: true,
    gallery: true,
    news: true,
    jobs: true,
    sections: true,
  },
  restaurant: {
    orders: true,
    menu: true,
    reservations: true,
    gallery: true,
    news: true,
    jobs: true,
    sections: true,
  },
  ecommerce: {
    orders: true,
    menu: true,
    reservations: false,
    gallery: true,
    news: true,
    jobs: true,
    sections: true,
  },
};

function buildTenantModuleAccess(tenant = {}) {
  const niche = String(tenant.niche || tenant.businessType || 'food').toLowerCase();
  const defaults = DEFAULT_MODULES_BY_NICHE[niche] || DEFAULT_MODULES_BY_NICHE.food;
  const moduleAccessOverrides = tenant.moduleAccess || {};

  const resolved = {};
  for (const key of MODULE_KEYS) {
    const explicitValue = moduleAccessOverrides[key];
    const hasExplicitValue = explicitValue !== undefined && explicitValue !== null;
    resolved[key] = hasExplicitValue ? Boolean(explicitValue) : Boolean(defaults[key]);
  }

  const moduleAccess = {
    orders: { enabled: resolved.orders, canManage: resolved.orders },
    menu: { enabled: resolved.menu, canManage: resolved.menu },
    reservations: { enabled: resolved.reservations, canManage: resolved.reservations },
    gallery: { enabled: resolved.gallery, canManage: resolved.gallery },
    news: { enabled: resolved.news, canManage: resolved.news },
    jobs: { enabled: resolved.jobs, canManage: resolved.jobs },
    sections: { enabled: resolved.sections, canManage: resolved.sections },
  };

  return {
    niche,
    moduleAccess,
    availableModules: MODULE_KEYS.filter((key) => resolved[key]),
    orders: resolved.orders,
    menu: resolved.menu,
    reservations: resolved.reservations,
    gallery: resolved.gallery,
    news: resolved.news,
    jobs: resolved.jobs,
    sections: resolved.sections,
    canManageOrders: resolved.orders,
    canManageMenu: resolved.menu,
    canManageReservations: resolved.reservations,
    canManageGallery: resolved.gallery,
    canManageNews: resolved.news,
    canManageJobs: resolved.jobs,
    canManageSections: resolved.sections,
  };
}

function getModuleAccess(tenant) {
  return buildTenantModuleAccess(tenant);
}

function enforceModuleAccess(tenant, moduleName, res) {
  const access = buildTenantModuleAccess(tenant);
  if (!access.moduleAccess[moduleName]?.enabled) {
    res.status(403).json({
      error: `${moduleName} module is disabled for this tenant niche`,
      niche: access.niche,
    });
    return false;
  }
  return true;
}

module.exports = {
  buildTenantModuleAccess,
  getModuleAccess,
  enforceModuleAccess,
};
