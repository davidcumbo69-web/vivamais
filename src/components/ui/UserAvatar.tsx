import React, { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-32 h-32',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  alt = 'Utilizador', 
  className,
  size = 'md'
}) => {
  const [error, setError] = useState(false);

  const showFallback = !src || error;

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-50",
      sizeClasses[size],
      className
    )}>
      {showFallback ? (
        <User className={cn(
          "text-gray-300",
          size === 'xs' || size === 'sm' ? 'w-1/2 h-1/2' : 'w-3/5 h-3/5'
        )} />
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};
