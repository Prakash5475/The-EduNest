import { hashPassword, comparePassword, getPasswordStrengthIssues, sha256Hash } from '@/helpers/password.helper';

describe('password.helper', () => {
  it('hashes and verifies a password correctly', async () => {
    const hash = await hashPassword('Sup3r$ecret!');
    expect(hash).not.toBe('Sup3r$ecret!');
    await expect(comparePassword('Sup3r$ecret!', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong', hash)).resolves.toBe(false);
  });

  it('flags weak passwords', () => {
    expect(getPasswordStrengthIssues('abc')).not.toHaveLength(0);
    expect(getPasswordStrengthIssues('Sup3r$ecret!')).toHaveLength(0);
  });

  it('produces a stable sha256 hash', () => {
    expect(sha256Hash('hello')).toBe(sha256Hash('hello'));
    expect(sha256Hash('hello')).not.toBe(sha256Hash('world'));
  });
});
