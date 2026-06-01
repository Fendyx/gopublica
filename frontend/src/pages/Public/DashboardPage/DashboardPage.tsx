import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTenantAuthStore } from '../../../store/tenantAuthStore';
import { tenantApi } from '../../../features/tenant/api/tenantApi';
import {
  CheckCircle, Clock, AlertTriangle, XCircle,
  Globe, ExternalLink, User, LogOut
} from 'lucide-react';
import './DashboardPage.css';

const STATUS_CONFIG = {
  trialing:   { label: 'Пробный период',    icon: Clock,          color: 'blue'   },
  active:     { label: 'Активна',           icon: CheckCircle,    color: 'green'  },
  past_due:   { label: 'Просрочен платёж',  icon: AlertTriangle,  color: 'orange' },
  canceled:   { label: 'Отменена',          icon: XCircle,        color: 'red'    },
  none:       { label: 'Нет подписки',      icon: XCircle,        color: 'gray'   },
  incomplete: { label: 'Не завершена',      icon: AlertTriangle,  color: 'orange' },
};

export default function DashboardPage() {
  const navigate                     = useNavigate();
  const [params]                     = useSearchParams();
  const { user, logout, updateUser } = useTenantAuthStore();
  const [loading, setLoading]        = useState(true);

  const successFromStripe = params.get('success') === 'true';

  useEffect(() => {
    tenantApi.getMe()
      .then((fresh) => updateUser(fresh))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout    = () => { logout(); navigate('/'); };
  const handleSubscribe = () => navigate('/pricing');

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-spinner" />
      </div>
    );
  }

  const status     = user?.subscriptionStatus ?? 'none';
  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.none;
  const StatusIcon = statusConf.icon;

  const periodEnd = user?.currentPeriodEnd
    ? new Date(user.currentPeriodEnd).toLocaleDateString('ru-RU', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <div className="dashboard-page">

      <header className="dashboard-header">
        <div>
          <h1>Личный кабинет</h1>
          <p className="dashboard-welcome">Привет, {user?.name} 👋</p>
        </div>
        <button className="dashboard-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          Выйти
        </button>
      </header>

      {successFromStripe && (
        <div className="dashboard-banner dashboard-banner--success">
          <CheckCircle size={20} />
          Подписка успешно оформлена! Добро пожаловать в Gopublica.
        </div>
      )}

      <div className="dashboard-grid">

        {/* Карточка подписки */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Подписка</h2>

          <div className={`dashboard-status dashboard-status--${statusConf.color}`}>
            <StatusIcon size={18} />
            <span>{statusConf.label}</span>
          </div>

          {user?.subscriptionPlan && user.subscriptionPlan !== 'none' && (
            <p className="dashboard-plan">
              План: <strong>{user.subscriptionPlan === 'basic' ? 'Basic' : 'Pro'}</strong>
            </p>
          )}

          {periodEnd && (
            <p className="dashboard-period">
              {status === 'trialing' ? 'Пробный период до:' : 'Следующий платёж:'}{' '}
              <strong>{periodEnd}</strong>
            </p>
          )}

          {(status === 'none' || status === 'canceled') && (
            <button className="dashboard-cta-btn" onClick={handleSubscribe}>
              Оформить подписку
            </button>
          )}
        </div>

        {/* Карточка сайта */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Ваш сайт</h2>

          {user?.tenantId ? (
            <div className="dashboard-site-ready">
              <Globe size={32} className="dashboard-site-icon" />
              <p>Ваш сайт готов!</p>
              <div className="dashboard-site-links">
                
                <a
                  href={`https://${user.tenantId}.gopublica.com`}
                  target="_blank"
                  rel="noreferrer"
                  className="dashboard-link-btn"
                >
                  <ExternalLink size={14} />
                  Открыть сайт
                </a>
                
                <a
                  href={`https://${user.tenantId}.gopublica.com/admin`}
                  target="_blank"
                  rel="noreferrer"
                  className="dashboard-link-btn dashboard-link-btn--secondary"
                >
                  Управление сайтом
                </a>
              </div>
            </div>
          ) : (
            <div className="dashboard-site-pending">
              <Clock size={32} className="dashboard-site-icon dashboard-site-icon--pending" />
              <p className="dashboard-site-pending-title">Сайт в разработке</p>
              <p className="dashboard-site-pending-desc">
                Мы уже работаем над вашим сайтом. Свяжемся в течение 1–2 рабочих дней.
              </p>
            </div>
          )}
        </div>

        {/* Карточка профиля */}
        <div className="dashboard-card">
          <h2 className="dashboard-card-title">Профиль</h2>
          <div className="dashboard-profile-info">
            <div className="dashboard-profile-row">
              <User size={16} />
              <span>{user?.name}</span>
            </div>
            <div className="dashboard-profile-row">
              <span className="dashboard-profile-label">Email:</span>
              <span>{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="dashboard-profile-row">
                <span className="dashboard-profile-label">Телефон:</span>
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}