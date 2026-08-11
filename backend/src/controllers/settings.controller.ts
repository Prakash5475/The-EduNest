import type { NextFunction, Response } from 'express';
import { settingsRepository } from '@/repositories/settings.repository';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { requireDealerContext } from '@/helpers/dealerContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class SettingsController {
  async listApplication(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsRepository.listApplication();
      ApiResponse.success(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async upsertApplication(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const setting = await settingsRepository.upsertApplication(req.body.key, req.body.value, req.body.valueType);
      ApiResponse.success(res, { setting }, 'Setting updated');
    } catch (err) {
      next(err);
    }
  }

  async listMySchoolSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const settings = await settingsRepository.listForSchool(school.id);
      ApiResponse.success(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async upsertMySchoolSetting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const setting = await settingsRepository.upsertForSchool(school.id, req.body.key, req.body.value);
      ApiResponse.success(res, { setting }, 'Setting updated');
    } catch (err) {
      next(err);
    }
  }

  async listMyDealerSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const settings = await settingsRepository.listForDealer(dealer.id);
      ApiResponse.success(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async upsertMyDealerSetting(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const setting = await settingsRepository.upsertForDealer(dealer.id, req.body.key, req.body.value);
      ApiResponse.success(res, { setting }, 'Setting updated');
    } catch (err) {
      next(err);
    }
  }

  async listPayment(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsRepository.listPayment();
      ApiResponse.success(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async upsertPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const setting = await settingsRepository.upsertPayment(
        req.body.providerName,
        req.body.configKey,
        req.body.configValue,
        req.body.isActive,
      );
      ApiResponse.success(res, { setting }, 'Payment setting updated');
    } catch (err) {
      next(err);
    }
  }

  async listEmail(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsRepository.listEmail();
      ApiResponse.success(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async upsertEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const setting = await settingsRepository.upsertEmail(req.body.configKey, req.body.configValue);
      ApiResponse.success(res, { setting }, 'Email setting updated');
    } catch (err) {
      next(err);
    }
  }

  async listSms(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsRepository.listSms();
      ApiResponse.success(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async upsertSms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const setting = await settingsRepository.upsertSms(req.body.configKey, req.body.configValue);
      ApiResponse.success(res, { setting }, 'SMS setting updated');
    } catch (err) {
      next(err);
    }
  }

  async listTheme(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const scopeType = (req.query.scopeType as 'platform' | 'school') ?? 'platform';
      const scopeId = req.query.scopeId ? BigInt(req.query.scopeId as string) : undefined;
      const settings = await settingsRepository.listTheme(scopeType, scopeId);
      ApiResponse.success(res, { settings });
    } catch (err) {
      next(err);
    }
  }

  async upsertTheme(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const setting = await settingsRepository.upsertTheme(
        req.body.scopeType,
        req.body.scopeId ?? null,
        req.body.configKey,
        req.body.configValue,
      );
      ApiResponse.success(res, { setting }, 'Theme setting updated');
    } catch (err) {
      next(err);
    }
  }
}

export const settingsController = new SettingsController();
