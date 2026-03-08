import type { CSSProperties } from 'react';

import type { GuildMemberProfile } from '../guildData';

type GuildMemberAvatarProps = {
  member: GuildMemberProfile;
};

type PortraitCrop = {
  objectPosition?: string;
  scale?: number;
};

const PORTRAIT_SOURCES: Record<GuildMemberProfile['handle'], string> = {
  'quartermaster-nyx': '/raidguild-avatars/quartermaster-nyx.png',
  'glint-archive': '/raidguild-avatars/glint-archive.png',
  'moss-scrip': '/raidguild-avatars/moss-scrip.png',
  'rune-mercer': '/raidguild-avatars/rune-mercer.png',
  'kestrel-vale': '/raidguild-avatars/kestrel-vale.png',
  'hexa-thorn': '/raidguild-avatars/hexa-thorn.png',
  'sable-quill': '/raidguild-avatars/sable-quill.png',
  'mint-halberd': '/raidguild-avatars/mint-halberd.png',
  'dorian-ash': '/raidguild-avatars/dorian-ash.png'
};

const DEFAULT_CROP: PortraitCrop = {
  objectPosition: '50% 32%',
  scale: 1.14
};

const PORTRAIT_CROPS: Partial<Record<GuildMemberProfile['handle'], PortraitCrop>> = {
  'quartermaster-nyx': {
    objectPosition: '52% 34%',
    scale: 1.18
  }
};

function getAvatarStyle(member: GuildMemberProfile): CSSProperties {
  const crop = PORTRAIT_CROPS[member.handle] ?? DEFAULT_CROP;

  return {
    objectPosition: crop.objectPosition,
    transform: `scale(${crop.scale ?? 1})`
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function GuildMemberAvatar({ member }: GuildMemberAvatarProps) {
  const src = PORTRAIT_SOURCES[member.handle];

  return (
    <span className="guild-member-avatar" aria-hidden="true">
      {src ? (
        <img
          className="guild-member-avatar-photo"
          src={src}
          alt=""
          style={getAvatarStyle(member)}
        />
      ) : (
        <span
          className="guild-member-avatar-fallback"
          style={{
            background: `linear-gradient(180deg, ${member.accent}, ${member.shadow})`
          }}
        >
          {getInitials(member.name)}
        </span>
      )}
    </span>
  );
}
