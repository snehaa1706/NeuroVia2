import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

interface Props {
  variant?: 'light' | 'dark' | 'minimal';
}

export default function LanguageSwitcher({ variant = 'light' }: Props) {
  const { i18n } = useTranslation();

  const handleChange = (lang: string) => {
    console.log("DEBUG: Change language called with:", lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('neurovia_lang', lang);
  };

  if (variant === 'minimal') {
    return (
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-transparent text-sm font-bold outline-none cursor-pointer text-inherit border-none"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    );
  }

  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-2">
      <Globe className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`} />
      <select
        value={i18n.language}
        onChange={(e) => handleChange(e.target.value)}
        className={`text-sm font-semibold rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-all ${
          isDark
            ? 'bg-white/10 text-white/80 border border-white/10 hover:bg-white/15'
            : 'bg-white text-[#0D2B45] border border-[#E5E5E0] hover:border-[#8C9A86]'
        }`}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-[#0D2B45] bg-white">
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
