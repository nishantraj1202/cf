import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codinzhub.com';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/chintu-1202',
                    '/api',
                    '/login',
                    '/dashboard',
                    '/signup',
                    '/preview',
                ],
            },
            {
                userAgent: 'GPTBot',
                disallow: ['/'],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
