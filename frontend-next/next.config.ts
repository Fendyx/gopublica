import withNextIntl from "next-intl/plugin";

const nextConfig = {
  async redirects() {
    return [
      // Legacy legal routes → new /legal/* paths
      { source: '/:locale/privacy',  destination: '/:locale/legal/privacy',  permanent: true },
      { source: '/:locale/terms',    destination: '/:locale/legal/terms',    permanent: true },
      { source: '/:locale/services', destination: '/:locale/legal/services', permanent: true },
      { source: '/:locale/delivery', destination: '/:locale/legal/delivery', permanent: true },
      { source: '/:locale/payment',  destination: '/:locale/legal/payment',  permanent: true },
      { source: '/:locale/imprint',  destination: '/:locale/legal/imprint',  permanent: true },
    ];
  },
  async rewrites() {
    const API_URL = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default withNextIntl()(nextConfig);