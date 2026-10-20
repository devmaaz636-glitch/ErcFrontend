import { useEffect, useState } from 'react';
import { Image } from 'expo-image';

const FALLBACK = require('../../assets/userprofile.png');

export default function UserAvatar({ uri, size = 40, style }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const source = uri && !failed ? { uri } : FALLBACK;

  return (
    <Image
      source={source}
      placeholder={FALLBACK}
      recyclingKey={uri}
      contentFit="cover"
      transition={150}
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: '#F4EEE8' },
        style,
      ]}
    />
  );
}