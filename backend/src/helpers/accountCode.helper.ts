import crypto from 'node:crypto';
import { schoolRepository } from '@/repositories/school.repository';
import { dealerRepository } from '@/repositories/dealer.repository';
import { ApiError } from '@/utils/ApiError';

export async function generateSchoolCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `SCH-${crypto.randomInt(100000, 999999)}`;
    const existing = await schoolRepository.findByCode(candidate);
    if (!existing) return candidate;
  }
  throw ApiError.internal('Could not generate a unique school code, please try again');
}

export async function generateDealerCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `DLR-${crypto.randomInt(100000, 999999)}`;
    const existing = await dealerRepository.findByCode(candidate);
    if (!existing) return candidate;
  }
  throw ApiError.internal('Could not generate a unique dealer code, please try again');
}
