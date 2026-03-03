export function WhiteboardEdgeCue({
  cueState
}: {
  cueState: { side: 'left' | 'right'; top: number; angle: number } | null;
}) {
  if (!cueState) {
    return null;
  }

  return (
    <span className={`whiteboard-edge-cue is-${cueState.side}`} style={{ top: `${cueState.top}px` }} aria-hidden="true">
      <span style={{ transform: `rotate(${cueState.angle}deg)` }}>→</span>
    </span>
  );
}

export function WhiteboardHud({ studioName }: { studioName: string }) {
  return (
    <div className="whiteboard-hud" aria-hidden="true">
      <span>Planning board</span>
      <span>{studioName || 'Unnamed studio'}</span>
    </div>
  );
}

export function WhiteboardIntegrateCard({ roleName }: { roleName?: string }) {
  return (
    <section className="whiteboard-integrate-card">
      <p>{roleName ? `Tap ${roleName} to choose who fills it.` : 'RaidGuild applicants are queued for your open branch.'}</p>
    </section>
  );
}
