import type { GuildMemberProfile } from '../guildData';

type GuildMemberAvatarProps = {
  member: GuildMemberProfile;
};

function hashValue(input: string): number {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function shiftHex(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  const channel = (offset: number) => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16);
    const next = Math.max(0, Math.min(255, value + amount));
    return next.toString(16).padStart(2, '0');
  };

  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

function HairShape({ variant, color }: { variant: number; color: string }) {
  switch (variant) {
    case 0:
      return <path d="M12 22c1-7 5.8-12.2 12-12.2 6.3 0 11.2 5.2 12 12.2-2.2-1.8-5.1-2.8-8.2-2.8H20c-3.1 0-5.8 1-8 2.8Z" fill={color} />;
    case 1:
      return <path d="M13.6 21.8c1.2-7 5.9-11.8 12.2-11.8 4.7 0 8.7 2.5 10.8 8.4-2.8-1.3-6-2-9.4-2h-6.6c-2.8 0-5 .9-7 3.4Z" fill={color} />;
    case 2:
      return <path d="M11.9 22.4c1.8-8 7-12.4 12.7-12.4 5.4 0 9.6 3.2 11.5 10.2-1.9-1.1-4.1-1.9-6.6-1.9h-2.4l-1.7-3.4-1.8 3.4H19c-2.3 0-4.8.8-7.1 4.1Z" fill={color} />;
    default:
      return <path d="M12.4 22c.9-7.5 6.1-12 12-12 5.8 0 10.9 4.5 11.3 12-1.3-1.9-3.3-3.5-5.9-4.4-1.8-.6-3.8-.9-5.8-.9-4.5 0-8.8 1.7-12.6 5.3Z" fill={color} />;
  }
}

function BeardShape({ variant, color }: { variant: number; color: string }) {
  switch (variant) {
    case 0:
      return null;
    case 1:
      return <path d="M18.8 28.8c1 3.3 3.5 5.5 5.8 5.5 2.4 0 4.8-2.2 5.9-5.5-1.6.9-3.8 1.5-5.9 1.5-2.1 0-4.1-.6-5.8-1.5Z" fill={color} />;
    case 2:
      return (
        <>
          <path d="M18.3 26.8c1.7 1.4 3.9 2.1 6.1 2.1 2.4 0 4.5-.7 6.3-2.1-.6 4.8-2.9 7.5-6.3 7.5-3.3 0-5.6-2.7-6.1-7.5Z" fill={color} />
          <path d="M21.4 25.8c1 .4 2 .7 3 .7s2-.2 3-.7" stroke={shiftHex(color, 20)} strokeLinecap="round" strokeWidth="0.8" />
        </>
      );
    default:
      return (
        <>
          <path d="M18.4 27.3c1.5 1 3.7 1.7 5.9 1.7 2.2 0 4.3-.7 5.9-1.7" stroke={color} strokeLinecap="round" strokeWidth="1.5" />
          <path d="M21.7 30.4c.7.8 1.6 1.2 2.6 1.2 1 0 1.9-.4 2.7-1.2" stroke={color} strokeLinecap="round" strokeWidth="1.3" />
        </>
      );
  }
}

function AccessoryShape({ variant, color }: { variant: number; color: string }) {
  switch (variant) {
    case 0:
      return null;
    case 1:
      return (
        <>
          <circle cx="28.9" cy="24" r="2.1" fill="none" stroke={color} strokeWidth="1" />
          <path d="M31 25.6 33 28.7" stroke={color} strokeLinecap="round" strokeWidth="0.8" />
        </>
      );
    case 2:
      return <path d="M28.8 21.8 26.9 27.9" stroke={color} strokeLinecap="round" strokeWidth="1" />;
    default:
      return (
        <>
          <path d="M16.6 20.6c1 .7 2.1 1.1 3.4 1.1" stroke={color} strokeLinecap="round" strokeWidth="1" />
          <circle cx="18.6" cy="26.8" r="0.85" fill="none" stroke={color} strokeWidth="0.8" />
        </>
      );
  }
}

export function GuildMemberAvatar({ member }: GuildMemberAvatarProps) {
  const seed = hashValue(member.handle);
  const hairVariant = seed % 4;
  const beardVariant = Math.floor(seed / 7) % 4;
  const accessoryVariant = Math.floor(seed / 19) % 4;
  const eyeSpread = [3.2, 3.8, 4.4][Math.floor(seed / 31) % 3];
  const faceWidth = [7.9, 8.5, 9.1][Math.floor(seed / 43) % 3];
  const faceHeight = [8.6, 9.2, 9.8][Math.floor(seed / 59) % 3];
  const faceY = [23.2, 23.8, 24.3][Math.floor(seed / 71) % 3];
  const robeColor = shiftHex(member.robe, (seed % 9) - 4);
  const trimColor = shiftHex(member.trim, (Math.floor(seed / 3) % 7) - 3);
  const skinShade = shiftHex(member.skin, -18);

  return (
    <span className="guild-member-avatar" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="guild-member-avatar-art">
        <defs>
          <linearGradient id={`${member.id}-bg`} x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor={member.accent} />
            <stop offset="1" stopColor={member.shadow} />
          </linearGradient>
          <linearGradient id={`${member.id}-robe`} x1="24" y1="24" x2="24" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor={trimColor} />
            <stop offset="0.17" stopColor={robeColor} />
            <stop offset="1" stopColor={shiftHex(robeColor, -18)} />
          </linearGradient>
        </defs>

        <circle cx="24" cy="24" r="24" fill={`url(#${member.id}-bg)`} />
        <circle cx="24" cy="17" r="12.5" fill="rgb(249 247 231 / 0.05)" />
        <path d="M9 40c2.9-7.9 8.4-12.3 15-12.3 6.9 0 12.1 4.3 15 12.3-4.1 3.4-9.2 5.1-15 5.1S13.2 43.4 9 40Z" fill={`url(#${member.id}-robe)`} />
        <path d="M17.4 30.4c1.9 1.4 4.1 2.1 6.6 2.1 2.6 0 4.9-.7 6.7-2.1" stroke={trimColor} strokeLinecap="round" strokeWidth="1.2" />

        <ellipse cx="24" cy={faceY} rx={faceWidth} ry={faceHeight} fill={member.skin} />
        <ellipse cx="24" cy={faceY + 4.8} rx={faceWidth - 2.6} ry={1.9} fill="rgb(0 0 0 / 0.06)" />
        <HairShape variant={hairVariant} color={member.hair} />

        <path
          d={`M${24 - eyeSpread - 2} ${faceY - 2.8}c1-.8 2.2-1.2 3.4-1.2M${24 + eyeSpread - 1.4} ${faceY - 2.8}c1.1-.8 2.3-1.2 3.4-1.2`}
          stroke={shiftHex(member.hair, 16)}
          strokeLinecap="round"
          strokeWidth="0.95"
        />
        <circle cx={24 - eyeSpread} cy={faceY - 0.8} r="0.78" fill="#2C1812" />
        <circle cx={24 + eyeSpread} cy={faceY - 0.8} r="0.78" fill="#2C1812" />
        <path d={`M24 ${faceY + 0.2}c-.6 1.4-.7 2.2-.2 3`} stroke={skinShade} strokeLinecap="round" strokeWidth="0.85" />
        <path d={`M20.9 ${faceY + 4.2}c1 .7 2 .9 3.1.9 1.2 0 2.2-.3 3.2-.9`} stroke={skinShade} strokeLinecap="round" strokeWidth="0.9" />

        <BeardShape variant={beardVariant} color={shiftHex(member.hair, -4)} />
        <AccessoryShape variant={accessoryVariant} color={trimColor} />

        <circle cx="24" cy="33.9" r="1.45" fill={trimColor} />
      </svg>
    </span>
  );
}
