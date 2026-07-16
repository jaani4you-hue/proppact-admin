import { useState } from 'react';
import { User } from 'lucide-react';

function getInitials(name) {
  if (!name) return '';
  return name.split(' ').map((n) => n[0] ?? '').join('').slice(0, 2).toUpperCase();
}

/** size: 'sm' | 'md' | 'lg' | 'xl' */
export default function OwnerAvatar({ photo, name, size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  const sizeCls  = { sm: 'h-7 w-7 text-[9px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm', xl: 'h-20 w-20 text-xl' };
  const iconSize = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5', xl: 'h-8 w-8' };
  const base = `flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${sizeCls[size]}`;

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name ?? 'Owner'}
        onError={() => setImgError(true)}
        className={`${base} object-cover bg-gray-100`}
      />
    );
  }

  const initials = getInitials(name);
  if (initials) {
    return (
      <div className={`${base} bg-gradient-to-br from-teal-400 to-teal-600 text-white font-bold`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${base} bg-gray-100 text-gray-400`}>
      <User className={iconSize[size]} />
    </div>
  );
}
