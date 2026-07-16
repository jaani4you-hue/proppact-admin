import { useState } from 'react';
import { User } from 'lucide-react';

function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Displays a dealer's photo or a fallback avatar with initials.
 * size: 'sm' | 'md' | 'lg' | 'xl'
 */
export default function DealerAvatar({ photo, name, size = 'md' }) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'h-7 w-7 text-[9px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-20 w-20 text-xl',
  };

  const iconSizes = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5', xl: 'h-8 w-8' };

  const base = `flex-shrink-0 rounded-full flex items-center justify-center overflow-hidden ${sizeClasses[size]}`;

  if (photo && !imgError) {
    return (
      <img
        src={photo}
        alt={name ?? 'Dealer'}
        onError={() => setImgError(true)}
        className={`${base} object-cover bg-gray-100`}
      />
    );
  }

  const initials = getInitials(name);
  if (initials) {
    return (
      <div className={`${base} bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${base} bg-gray-100 text-gray-400`}>
      <User className={iconSizes[size]} />
    </div>
  );
}
