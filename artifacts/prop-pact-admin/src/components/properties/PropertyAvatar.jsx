import { Building2 } from 'lucide-react';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-20 w-20 text-lg',
};

export default function PropertyAvatar({ image, title, size = 'md' }) {
  const sz = SIZES[size] ?? SIZES.md;
  if (image) {
    return (
      <img
        src={image}
        alt={title ?? 'Property'}
        className={`${sz} rounded-lg object-cover flex-shrink-0 bg-gray-100`}
      />
    );
  }
  return (
    <div
      className={`${sz} rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0`}
    >
      <Building2 className="h-4 w-4 text-orange-500" />
    </div>
  );
}
