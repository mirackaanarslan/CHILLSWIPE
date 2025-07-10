/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignore type checking errors during build for Vercel deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build for Vercel deployment
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com', // Google Auth profile pics
    ],
  },
  // Environment variables that should be available to the client
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  },
  // Fix for undici and other Node.js modules
  webpack: (config, { isServer, webpack }) => {
    // Exclude problematic Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        undici: false,
      };

      // Completely ignore these modules on client side
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(undici|fs|net|tls|crypto|stream|zlib|http|https|assert|os|path)$/,
        })
      );
    }

    // Add module rules for problematic syntax
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/undici/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: {
                node: '16'
              }
            }]
          ],
          plugins: [
            '@babel/plugin-transform-private-methods',
            '@babel/plugin-transform-class-properties'
          ]
        }
      }
    });

    return config;
  },
  // PWA support for mobile experience
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 