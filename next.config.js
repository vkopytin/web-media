const withPWA = require('next-pwa');

module.exports = async (phase, { defaultConfig }) => {
    /**
     * @type {import('next').NextConfig}
     */
    const nextConfig = withPWA({
        compress: false,
        pwa: {
            dest: "public",
            register: true,
            skipWaiting: true,
        }
    });

    return nextConfig
};
