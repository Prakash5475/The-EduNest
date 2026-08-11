import { BaseRepository } from './base.repository';

export class SettingsRepository extends BaseRepository {
  listApplication() {
    return this.db.applicationSetting.findMany({ orderBy: { settingKey: 'asc' } });
  }

  upsertApplication(key: string, value: string | null, valueType: 'string' | 'number' | 'boolean' | 'json') {
    return this.db.applicationSetting.upsert({
      where: { settingKey: key },
      update: { settingValue: value, valueType },
      create: { settingKey: key, settingValue: value, valueType },
    });
  }

  listForSchool(schoolId: bigint) {
    return this.db.schoolSetting.findMany({ where: { schoolId } });
  }

  upsertForSchool(schoolId: bigint, key: string, value: string | null) {
    return this.db.schoolSetting.upsert({
      where: { schoolId_settingKey: { schoolId, settingKey: key } },
      update: { settingValue: value },
      create: { schoolId, settingKey: key, settingValue: value },
    });
  }

  listForDealer(dealerId: bigint) {
    return this.db.dealerSetting.findMany({ where: { dealerId } });
  }

  upsertForDealer(dealerId: bigint, key: string, value: string | null) {
    return this.db.dealerSetting.upsert({
      where: { dealerId_settingKey: { dealerId, settingKey: key } },
      update: { settingValue: value },
      create: { dealerId, settingKey: key, settingValue: value },
    });
  }

  listPayment() {
    return this.db.paymentSetting.findMany();
  }

  upsertPayment(providerName: string, configKey: string, configValue: string | null, isActive: boolean) {
    return this.db.paymentSetting.upsert({
      where: { providerName_configKey: { providerName, configKey } },
      update: { configValue, isActive },
      create: { providerName, configKey, configValue, isActive },
    });
  }

  listEmail() {
    return this.db.emailSetting.findMany();
  }

  upsertEmail(configKey: string, configValue: string | null) {
    return this.db.emailSetting.upsert({
      where: { configKey },
      update: { configValue },
      create: { configKey, configValue },
    });
  }

  listSms() {
    return this.db.smsSetting.findMany();
  }

  upsertSms(configKey: string, configValue: string | null) {
    return this.db.smsSetting.upsert({
      where: { configKey },
      update: { configValue },
      create: { configKey, configValue },
    });
  }

  listTheme(scopeType: 'platform' | 'school', scopeId?: bigint) {
    return this.db.themeSetting.findMany({ where: { scopeType, scopeId: scopeId ?? null } });
  }

  async upsertTheme(
    scopeType: 'platform' | 'school',
    scopeId: bigint | null,
    configKey: string,
    configValue: string | null,
  ) {
    // Prisma's compound-unique `where` type does not accept `null` for scopeId,
    // even though the column itself is nullable, so we can't use upsert() directly here.
    const existing = await this.db.themeSetting.findFirst({ where: { scopeType, scopeId, configKey } });
    if (existing) {
      return this.db.themeSetting.update({ where: { id: existing.id }, data: { configValue } });
    }
    return this.db.themeSetting.create({ data: { scopeType, scopeId, configKey, configValue } });
  }
}

export const settingsRepository = new SettingsRepository();
