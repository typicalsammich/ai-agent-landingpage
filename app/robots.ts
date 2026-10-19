import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:'/api/'},sitemap:'https://virtual-agent-voice-studio.typical-sammich.chatgpt.site/sitemap.xml'}}
