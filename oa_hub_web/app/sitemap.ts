import { MetadataRoute } from 'next';
import { API_URL as BASE_API_URL } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://codinzhub.com';
const API_URL = `${BASE_API_URL}/api`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const routes = [{
        url: BASE_URL,
        lastModified: new Date().toISOString(),
    }];

    try {
        const companiesRes = await fetch(`${API_URL}/companies`, {
            next: { revalidate: 3600 },
        });
        const companies = await companiesRes.json();

        const companyRoutes = companies.map((comp: any) => ({
            url: `${BASE_URL}/company/${comp.slug}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        const questionsRes = await fetch(`${API_URL}/questions`, {
            next: { revalidate: 3600 },
        });
        const questions = (await questionsRes.json())
            .filter((q: any) => q.slug || q.id);

        const questionRoutes = questions.map((q: any) => ({
            url: `${BASE_URL}/question/${q.slug || q.id}`,
            lastModified: new Date(q.date).toISOString(),
            changeFrequency: 'monthly',
            priority: 0.8,
        }));

        const topics = ['arrays', 'strings', 'linked-list', 'trees', 'graphs', 'dp', 'system-design', 'heaps', 'backtracking'];
        const topicRoutes = topics.map(t => ({
            url: `${BASE_URL}/topic/${t}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        const difficulties = ['easy', 'medium', 'hard'];
        const difficultyRoutes = difficulties.map(d => ({
            url: `${BASE_URL}/difficulty/${d}`,
            lastModified: new Date().toISOString(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        const companyQuestionRoutes = questions.map((q: any) => ({
            url: `${BASE_URL}/company/${q.company.toLowerCase().replace(/\s+/g, '-')}/${q.slug || q.id}`,
            lastModified: new Date(q.date).toISOString(),
            changeFrequency: 'monthly',
            priority: 0.6,
        }));

        return [
            ...routes,
            ...companyRoutes,
            ...questionRoutes,
            ...topicRoutes,
            ...difficultyRoutes,
            ...companyQuestionRoutes,
        ];
    } catch (e) {
        console.error('Sitemap error:', e);
        return routes;
    }
}
