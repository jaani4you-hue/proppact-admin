import { useState } from 'react';
import { User } from 'lucide-react';

function initials(name) {
  if (!name) return '';
  return name.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
}

const SIZE = {
  sm: 'h-7 w-7 text-[9px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-20 w-20 text-xl',
};
const ICON = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5', xl: 'h-8 w-8' };

export default function TenantAvatar({ photo, name, size = 'md' }) {
  const [err, setErr] = useState(false);
  const base = `flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${SIZE[size]}`;

  if (photo && !err) {
    return <img src={photo} alt={name ?? 'Tenant'} onError={() => setErr(true)} className={`${base} object-cover bg-gray-100`} />;
  }

  const ini = initials(name);
  if (ini) return <div className={`${base} bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold`}>{ini}</div>;
  return <div className={`${base} bg-gray-100 text-gray-400`}><User className={ICON[size]} /></div>;
}
