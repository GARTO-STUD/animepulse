/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️ تم إزالة output: 'export' لأنه يكسر الصفحات الديناميكية
  // استخدمه فقط إذا كانت جميع صفحاتك static بالكامل
  distDir: '.next',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
