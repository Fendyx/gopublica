import { useAuthStore } from '@/store/store';
import { Navigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuthStore();

  // Если вдруг юзер не авторизован - выкидываем на логин
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Личный кабинет</h1>
      
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #eee', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 'bold' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>{user.name}</h2>
            <p style={{ margin: 0, color: 'gray' }}>{user.email}</p>
          </div>
        </div>

        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: 'gray' }}>Ваша роль в системе:</p>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{user.role.toUpperCase()}</p>
        </div>

        {user.role === 'user' && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '8px', fontSize: '14px' }}>
            <strong>Ожидание прав:</strong> Ваш аккаунт успешно создан, но у вас пока нет доступа к панели управления проектами. 
            Пожалуйста, свяжитесь с суперадмином, чтобы он выдал вам права доступа.
          </div>
        )}
      </div>
    </div>
  );
}