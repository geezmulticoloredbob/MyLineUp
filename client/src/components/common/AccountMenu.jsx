import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  updateUserIcon,
  updateProfile as updateProfileApi,
  updatePassword as updatePasswordApi,
} from '../../features/auth/services/authApi';
import { USER_ICONS, getIcon } from '../../constants/userIcons';
import { teamColors } from '../../data/teamColors';

const DATE_FORMATS = ['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'];

function AccountMenu({ onClose }) {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme, bgTeamId, setBgTeam, dateFormat, setDateFormat } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [accountError, setAccountError] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [accountSaving, setAccountSaving] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? '');
    setEmail(user?.email ?? '');
  }, [user?.username, user?.email]);

  const savedTeams = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('mylineup_bg_teams') || '[]'); }
    catch { return []; }
  }, []);

  const userIcon = getIcon(user?.iconId);

  async function handleSelectIcon(iconId) {
    try {
      const { user: updated } = await updateUserIcon(iconId);
      updateUser({ iconId: updated.iconId });
    } catch { /* best-effort */ }
  }

  async function handleSaveAccount(e) {
    e.preventDefault();
    setAccountError('');
    setAccountSuccess('');
    const updates = {};
    if (username.trim() !== user.username) updates.username = username.trim();
    if (email.trim().toLowerCase() !== user.email) updates.email = email.trim();
    if (!Object.keys(updates).length) {
      setAccountSuccess('No changes');
      setTimeout(() => setAccountSuccess(''), 2000);
      return;
    }
    setAccountSaving(true);
    try {
      const { user: updated } = await updateProfileApi(updates);
      updateUser({ username: updated.username, email: updated.email });
      setAccountSuccess('Saved');
      setTimeout(() => setAccountSuccess(''), 3000);
    } catch (err) {
      setAccountError(err.message || 'Failed to save');
    } finally {
      setAccountSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePasswordApi({ currentPassword, newPassword });
      setPasswordSuccess('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    onClose();
    navigate('/login');
  }

  return (
    <div className="account-menu" role="dialog" aria-label="Account menu">
      <div className="account-menu__profile">
        <span className="account-menu__avatar">{userIcon.emoji}</span>
        <div>
          <p className="account-menu__display-name">{user?.username}</p>
          <p className="account-menu__display-email">{user?.email}</p>
        </div>
      </div>

      <div className="account-menu__section">
        <span className="account-menu__section-title">Icon</span>
        <div className="icon-picker__grid">
          {USER_ICONS.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className={`icon-picker__item${user?.iconId === icon.id ? ' icon-picker__item--active' : ''}`}
              onClick={() => handleSelectIcon(icon.id)}
              title={icon.label}
              aria-label={icon.label}
              aria-pressed={user?.iconId === icon.id}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="account-menu__section">
        <span className="account-menu__section-title">Account</span>
        <form className="account-form" onSubmit={handleSaveAccount} noValidate>
          <div className="account-form__field">
            <label htmlFor="am-username">Username</label>
            <input
              id="am-username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setAccountError(''); setAccountSuccess(''); }}
              minLength={2}
              maxLength={30}
              autoComplete="username"
              required
            />
          </div>
          <div className="account-form__field">
            <label htmlFor="am-email">Email</label>
            <input
              id="am-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setAccountError(''); setAccountSuccess(''); }}
              autoComplete="email"
              required
            />
          </div>
          {accountError && <p className="account-form__feedback account-form__feedback--error">{accountError}</p>}
          {accountSuccess && <p className="account-form__feedback account-form__feedback--success">{accountSuccess}</p>}
          <button type="submit" className="btn-primary account-form__save" disabled={accountSaving}>
            {accountSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        <button
          type="button"
          className="account-menu__pw-toggle"
          onClick={() => {
            setShowPassword((v) => !v);
            setPasswordError('');
            setPasswordSuccess('');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          }}
        >
          {showPassword ? 'Cancel' : 'Change Password'}
        </button>

        {showPassword && (
          <form className="account-form" onSubmit={handleChangePassword} noValidate>
            <div className="account-form__field">
              <label htmlFor="am-cur-pw">Current Password</label>
              <input
                id="am-cur-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); }}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="account-form__field">
              <label htmlFor="am-new-pw">New Password</label>
              <input
                id="am-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                minLength={8}
                autoComplete="new-password"
                required
              />
              <span className="account-form__hint">Min 8 chars, one uppercase, one number</span>
            </div>
            <div className="account-form__field">
              <label htmlFor="am-confirm-pw">Confirm New Password</label>
              <input
                id="am-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
            {passwordError && <p className="account-form__feedback account-form__feedback--error">{passwordError}</p>}
            {passwordSuccess && <p className="account-form__feedback account-form__feedback--success">{passwordSuccess}</p>}
            <button type="submit" className="btn-primary account-form__save" disabled={passwordSaving}>
              {passwordSaving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      <div className="account-menu__section">
        <span className="account-menu__section-title">Preferences</span>
        <div className="settings-panel__section">
          <span className="settings-panel__label">Theme</span>
          <div className="settings-panel__toggle">
            <button
              type="button"
              className={`settings-toggle__btn${theme === 'dark' ? ' settings-toggle__btn--active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={13} strokeWidth={2} /> Dark
            </button>
            <button
              type="button"
              className={`settings-toggle__btn${theme === 'light' ? ' settings-toggle__btn--active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={13} strokeWidth={2} /> Light
            </button>
          </div>
        </div>
        <div className="settings-panel__section">
          <span className="settings-panel__label">Date Format</span>
          <div className="settings-panel__toggle settings-panel__toggle--col">
            {DATE_FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                className={`settings-toggle__btn${dateFormat === f ? ' settings-toggle__btn--active' : ''}`}
                onClick={() => setDateFormat(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-panel__section">
          <span className="settings-panel__label">Background</span>
          <div className="settings-panel__bg-grid">
            <button
              type="button"
              className={`settings-bg__item settings-bg__item--none${!bgTeamId ? ' settings-bg__item--active' : ''}`}
              onClick={() => setBgTeam(null, null)}
              title="No background"
            >
              <X size={14} />
            </button>
            {savedTeams.map((team) => {
              const c = teamColors[team.teamId];
              return (
                <button
                  key={team.teamId}
                  type="button"
                  className={`settings-bg__item${bgTeamId === team.teamId ? ' settings-bg__item--active' : ''}`}
                  onClick={() => setBgTeam(team.teamId, team.teamName)}
                  title={team.teamName}
                >
                  <div
                    className="settings-bg__swatch"
                    style={{ background: c ? `linear-gradient(135deg, ${c.primary} 50%, ${c.secondary} 50%)` : '#333' }}
                  />
                </button>
              );
            })}
            {savedTeams.length === 0 && (
              <p className="settings-bg__empty">Load the dashboard to see your teams</p>
            )}
          </div>
        </div>
      </div>

      <div className="account-menu__footer">
        <button type="button" className="account-menu__logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export default AccountMenu;
