let mockSend;
let mockResendCtor;
let consoleLogSpy;
let consoleErrorSpy;

function loadEmailModule(env) {
  jest.resetModules();
  mockSend = jest.fn();
  mockResendCtor = jest.fn().mockImplementation(() => ({ emails: { send: mockSend } }));

  jest.doMock('resend', () => ({ Resend: mockResendCtor }));
  jest.doMock('../../config/env', () => env);

  return require('../../utils/email');
}

beforeEach(() => {
  consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
});

describe('sendPasswordResetEmail', () => {
  describe('when RESEND_API_KEY is not configured', () => {
    it('logs the reset link to the console instead of sending an email', async () => {
      const { sendPasswordResetEmail } = loadEmailModule({ resendApiKey: '', emailFrom: 'MyLineUp <onboarding@resend.dev>' });

      await sendPasswordResetEmail('alice@example.com', 'http://app.test/reset-password/abc123');

      expect(mockResendCtor).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('alice@example.com')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://app.test/reset-password/abc123')
      );
    });
  });

  describe('when RESEND_API_KEY is configured', () => {
    it('constructs Resend with the configured key and sends the email', async () => {
      const { sendPasswordResetEmail } = loadEmailModule({ resendApiKey: 'test-key', emailFrom: 'MyLineUp <hello@mylineup.app>' });
      mockSend.mockResolvedValue({ error: null });

      await sendPasswordResetEmail('alice@example.com', 'http://app.test/reset-password/abc123');

      expect(mockResendCtor).toHaveBeenCalledWith('test-key');
      expect(mockSend).toHaveBeenCalledWith({
        from: 'MyLineUp <hello@mylineup.app>',
        to: 'alice@example.com',
        subject: 'Reset your MyLineUp password',
        html: expect.stringContaining('http://app.test/reset-password/abc123'),
      });
    });

    it('includes a working reset link and a 30-minute expiry notice in the email body', async () => {
      const { sendPasswordResetEmail } = loadEmailModule({ resendApiKey: 'test-key', emailFrom: 'from@test.com' });
      mockSend.mockResolvedValue({ error: null });

      await sendPasswordResetEmail('alice@example.com', 'http://app.test/reset-password/xyz');

      const [sentPayload] = mockSend.mock.calls[0];
      expect(sentPayload.html).toContain('href="http://app.test/reset-password/xyz"');
      expect(sentPayload.html).toContain('30 minutes');
    });

    it('resolves without throwing when Resend reports no error', async () => {
      const { sendPasswordResetEmail } = loadEmailModule({ resendApiKey: 'test-key', emailFrom: 'from@test.com' });
      mockSend.mockResolvedValue({ error: null });

      await expect(
        sendPasswordResetEmail('alice@example.com', 'http://app.test/reset-password/abc123')
      ).resolves.toBeUndefined();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('logs and throws a 500 ApiError when Resend reports an error', async () => {
      const { sendPasswordResetEmail } = loadEmailModule({ resendApiKey: 'test-key', emailFrom: 'from@test.com' });
      mockSend.mockResolvedValue({ error: { message: 'Resend blew up' } });

      await expect(
        sendPasswordResetEmail('alice@example.com', 'http://app.test/reset-password/abc123')
      ).rejects.toMatchObject({ statusCode: 500 });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send password reset email:', { message: 'Resend blew up' });
    });
  });
});
