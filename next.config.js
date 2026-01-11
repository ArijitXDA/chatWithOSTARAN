/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'your-supabase-project.supabase.co',
      'webinar.ostaran.com',
    ],
  },
}

module.exports = nextConfig
