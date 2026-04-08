'use client';

import { useState } from 'react';

interface Props {
  name: string;
  espnAthleteId?: string | null;
  size?: number;
  className?: string;
}

// Try multiple ESPN CDN URL formats
function getPhotoUrls(id: string): string[] {
  return [
    `https://a.espn.com/i/headshots/golf/players/full/${id}.png`,
    `https://a.espn.com/combiner/i?img=/i/headshots/golf/players/full/${id}.png`,
    `https://secure.espncdn.com/combiner/i?img=/i/headshots/golf/players/full/${id}.png`,
  ];
}

export function GolferPhoto({ name, espnAthleteId, size = 64, className = '' }: Props) {
  const [urlIndex, setUrlIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const urls = espnAthleteId ? getPhotoUrls(espnAthleteId) : [];

  if (espnAthleteId && !allFailed && urlIndex < urls.length) {
    return (
      <img
        src={urls[urlIndex]}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover bg-gray-100 ${className}`}
        onError={() => {
          if (urlIndex + 1 < urls.length) {
            setUrlIndex(urlIndex + 1);
          } else {
            setAllFailed(true);
          }
        }}
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
