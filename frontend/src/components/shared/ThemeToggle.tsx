// frontend/src/components/shared/ThemeToggle.jsx
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title="Переключить тему"
    >
      <span className="theme-icon">
        {theme === 'light' 
          ? <Moon size={18} strokeWidth={2} /> 
          : <Sun size={18} strokeWidth={2} />
        }
      </span>
    </button>
  );
}