import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
  collapsed?: boolean;
}

const LanguageSwitcher = ({ collapsed = false }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (collapsed) {
    // Compact vertical display for collapsed sidebar
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="mb-1 text-slate-400">
          <GlobeAltIcon className="w-5 h-5" />
        </div>
        <button
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            i18n.language === 'en'
              ? 'bg-indigo-500 text-white ring-2 ring-indigo-400 ring-opacity-50'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          onClick={() => changeLanguage('en')}
          type="button"
          title="English"
        >
          <span className="text-xs font-medium">EN</span>
        </button>
        <button
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            i18n.language === 'zh'
              ? 'bg-indigo-500 text-white ring-2 ring-indigo-400 ring-opacity-50'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
          onClick={() => changeLanguage('zh')}
          type="button"
          title="中文"
        >
          <span className="text-xs font-medium">中</span>
        </button>
      </div>
    );
  }

  // Regular horizontal display for expanded sidebar
  return (
    <div>
      <div className="flex items-center mb-3 text-slate-400">
        <GlobeAltIcon className="w-5 h-5 mr-2" />
        <span className="text-sm font-medium">Language</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className={`py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
            i18n.language === 'en'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/70 hover:text-white'
          }`}
          onClick={() => changeLanguage('en')}
          type="button"
        >
          <span className="text-sm font-medium">English</span>
        </button>
        <button
          className={`py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
            i18n.language === 'zh'
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/70 hover:text-white'
          }`}
          onClick={() => changeLanguage('zh')}
          type="button"
        >
          <span className="text-sm font-medium">中文</span>
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
