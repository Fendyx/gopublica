import withNextIntl from "next-intl/plugin";

const nextConfig = {
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