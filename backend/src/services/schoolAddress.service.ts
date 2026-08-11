import { schoolAddressRepository } from '@/repositories/schoolAddress.repository';
import { ApiError } from '@/utils/ApiError';
import type { School, SchoolAddressAddressType } from '@prisma/client';

export interface AddressInput {
  addressType: SchoolAddressAddressType;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export class SchoolAddressService {
  list(school: School) {
    return schoolAddressRepository.listBySchool(school.id);
  }

  async create(school: School, input: AddressInput) {
    const isFirstAddress = (await schoolAddressRepository.listBySchool(school.id)).length === 0;
    const address = await schoolAddressRepository.create({
      school: { connect: { id: school.id } },
      addressType: input.addressType,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      country: input.country,
      pincode: input.pincode,
      latitude: input.latitude,
      longitude: input.longitude,
      isDefault: input.isDefault ?? isFirstAddress,
    });
    if (address.isDefault) {
      await schoolAddressRepository.clearDefaultsExcept(school.id, address.id);
    }
    return address;
  }

  private async assertOwnership(school: School, addressId: bigint) {
    const address = await schoolAddressRepository.findById(addressId);
    if (!address || address.schoolId !== school.id) {
      throw ApiError.notFound('Address not found');
    }
    return address;
  }

  async update(school: School, addressId: bigint, input: Partial<AddressInput>) {
    await this.assertOwnership(school, addressId);
    const updated = await schoolAddressRepository.update(addressId, input);
    if (input.isDefault) {
      await schoolAddressRepository.clearDefaultsExcept(school.id, addressId);
    }
    return updated;
  }

  async remove(school: School, addressId: bigint) {
    await this.assertOwnership(school, addressId);
    await schoolAddressRepository.delete(addressId);
  }

  async setDefault(school: School, addressId: bigint) {
    await this.assertOwnership(school, addressId);
    const updated = await schoolAddressRepository.update(addressId, { isDefault: true });
    await schoolAddressRepository.clearDefaultsExcept(school.id, addressId);
    return updated;
  }
}

export const schoolAddressService = new SchoolAddressService();
