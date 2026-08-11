import { env } from '@/config/env';
import type { WhatsappProvider } from './whatsapp.types';
import { NoneProvider } from './providers/none.provider';
import { MetaCloudProvider } from './providers/metaCloud.provider';

let cached: WhatsappProvider | null = null;

/** The single place that decides which WhatsApp vendor is active. */
export function getWhatsappProvider(): WhatsappProvider {
  if (cached) return cached;
  cached = env.WHATSAPP_PROVIDER === 'meta_cloud' ? new MetaCloudProvider() : new NoneProvider();
  return cached;
}
