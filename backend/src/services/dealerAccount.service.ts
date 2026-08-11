import { dealerRepository } from '@/repositories/dealer.repository';
import { dealerAddressRepository } from '@/repositories/dealerAddress.repository';
import type { Dealer } from '@prisma/client';

export interface DealerAccountUpdateInput {
  businessName?: string;
  gstin?: string;
  panNumber?: string;
}

export interface DealerAddressInput {
  addressType: 'registered' | 'warehouse' | 'billing';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
}

export class DealerAccountService {
  async getMyAccount(dealer: Dealer) {
    const addresses = await dealerAddressRepository.listByDealer(dealer.id);
    return { ...dealer, addresses };
  }

  async updateMyAccount(dealer: Dealer, input: DealerAccountUpdateInput) {
    await dealerRepository.update(dealer.id, input);
    const updated = await dealerRepository.findById(dealer.id);
    return this.getMyAccount(updated as Dealer);
  }

  async addAddress(dealer: Dealer, input: DealerAddressInput) {
    const isFirst = (await dealerAddressRepository.listByDealer(dealer.id)).length === 0;
    const address = await dealerAddressRepository.create({
      dealer: { connect: { id: dealer.id } },
      ...input,
      isDefault: input.isDefault ?? isFirst,
    });
    if (address.isDefault) {
      await dealerAddressRepository.clearDefaultsExcept(dealer.id, address.id);
    }
    return address;
  }
}

export const dealerAccountService = new DealerAccountService();
