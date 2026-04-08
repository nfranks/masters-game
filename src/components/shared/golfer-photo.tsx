'use client';

import { useState } from 'react';

interface Props {
  name: string;
  mastersPlayerId?: string | null;
  size?: number;
  className?: string;
}

export function GolferPhoto({ name, mastersPlayerId, size = 64, className = '' }: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (mastersPlayerId && !imgError) {
    return (
      <img
        src={`https://images.masters.com/players/2026/240x240/${mastersPlayerId}.jpg`}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover bg-gray-100 ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-masters-green flex items-center justify-center text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}
