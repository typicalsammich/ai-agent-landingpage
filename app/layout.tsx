import type { Metadata } from 'next';
import './globals.css';
const origin='https://virtual-agent-voice-studio.typical-sammich.chatgpt.site';
export const metadata: Metadata = { metadataBase:new URL(origin), title:'AI Receptionist Services for Businesses | Virtual Agent AI', description:'Professional AI receptionists that answer calls, capture leads, and support appointment scheduling. Explore Virtual Agent AI and get a personalized quote.', alternates:{canonical:'https://www.virtualagentai.org/'}, openGraph:{title:'Every Call Deserves an Answer. | Virtual Agent AI',description:'A professionally managed AI receptionist, configured around your business.',url:origin,siteName:'Virtual Agent AI',type:'website',images:[{url:'/og.png',width:1200,height:630}]}, icons:{icon:'/favicon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

