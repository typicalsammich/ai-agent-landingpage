import { env } from 'cloudflare:workers';
export function getEnvironment() { return env; }
