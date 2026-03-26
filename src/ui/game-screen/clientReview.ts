import type { ArtifactBundle, ClientReview, RunResult } from '../../types';

const CLIENT_SENDER = 'Lina, Event Director';

export function buildClientReview({
  cycle,
  studioName,
  run,
  artifact
}: {
  cycle: 1 | 2;
  studioName: string;
  run: RunResult;
  artifact: ArtifactBundle;
}): ClientReview {
  const clientName = artifact.provenance.clientName;

  if (cycle === 1 || !run.passed) {
    return {
      cycle,
      outcome: 'rejected',
      tone: 'fail',
      sender: CLIENT_SENDER,
      subject: 'Re: URGENT rebrand',
      notificationTitle: 'Re: URGENT rebrand',
      notificationPreview: CLIENT_SENDER,
      inboxPreview: `I just reviewed the new ${clientName} site and it is not ready.`,
      body: [
        'I just opened this and my stomach dropped.',
        'I cannot put this in front of attendees like this, and we are running out of time.',
        'Please clean this up fast and send me something stronger before I completely lose my mind.'
      ]
    };
  }

  return {
    cycle,
    outcome: 'approved',
    tone: 'success',
    sender: CLIENT_SENDER,
    subject: 'Approved: Relaunch accepted',
    notificationTitle: 'Approved: Relaunch accepted',
    notificationPreview: CLIENT_SENDER,
    inboxPreview: `This is exactly what we needed for ${clientName}.`,
    body: [
      `This is exactly what we needed, ${studioName.trim() || 'team'}.`,
      'I can finally breathe again. The site looks polished, the experience feels intentional, and I am comfortable putting this in front of attendees.',
      'Thank you for pulling this off under pressure. I am wiring the $15,000 over ASAP.'
    ]
  };
}
