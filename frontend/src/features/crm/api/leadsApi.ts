import { useAuthStore } from '../../../store/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Актуальная типизация нашего лида (с ценой и услугами)
export interface Lead {
  _id?: string;
  name: string;
  phone: string;
  source: string;
  status: 'Новый' | 'В работе' | 'Закрыт' | 'Отказ';
  comment: string;
  price?: number;
  businessType?: string;
  servicesRequested?: string[];
  createdAt?: string; 
}

// Универсальная функция для получения заголовков с токеном
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token; // Достаем токен из нашего хранилища
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // Добавляем паспорт (токен)
  };
};

// Получить все лиды из БД
export const fetchLeads = async (): Promise<Lead[]> => {
  const response = await fetch(`${API_URL}/leads`, {
    headers: getAuthHeaders(), // <-- Передаем заголовки
  });
  if (!response.ok) throw new Error('Ошибка загрузки лидов');
  return response.json();
};

// Создать новый лид
export const createLead = async (leadData: Lead): Promise<Lead> => {
  const response = await fetch(`${API_URL}/leads`, {
    method: 'POST',
    headers: getAuthHeaders(), // <-- Передаем заголовки
    body: JSON.stringify(leadData),
  });
  if (!response.ok) throw new Error('Ошибка создания лида');
  return response.json();
};