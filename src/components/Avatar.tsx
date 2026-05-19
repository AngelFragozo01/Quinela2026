import { useMemo } from 'react';

interface AvatarProps {
  name: string;
  size?: number;
}

export default function Avatar({ name, size = 40 }: AvatarProps) {
  const seed = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }, [name]);

  const hue = seed % 360;
  
  return (
    <div 
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: `hsl(${hue}, 70%, 50%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        textTransform: 'uppercase',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      {name.substring(0, 2)}
    </div>
  );
}
