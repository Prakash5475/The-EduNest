import { settingsRepository } from '@/repositories/settings.repository';

export interface SettingUpdateInput {
  key: string;
  value: string | null;
  valueType: 'string' | 'number' | 'boolean' | 'json';
}

export class AdminSettingsService {
  /** Reuses the existing ApplicationSetting table (already used by dealer capacity threshold, etc.)
   * — no new configuration model. Groups by the key's prefix (text before the first underscore),
   * since ApplicationSetting has no dedicated category column and none is being added. */
  async list() {
    const settings = await settingsRepository.listApplication();
    const byCategory: Record<string, typeof settings> = {};
    for (const setting of settings) {
      const category = setting.settingKey.split('_')[0] || 'general';
      (byCategory[category] ??= []).push(setting);
    }
    return { settings, byCategory };
  }

  async update(entries: SettingUpdateInput[]) {
    await Promise.all(entries.map((entry) => settingsRepository.upsertApplication(entry.key, entry.value, entry.valueType)));
    return this.list();
  }
}

export const adminSettingsService = new AdminSettingsService();
