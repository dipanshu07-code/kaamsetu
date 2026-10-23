'use client';

import ProsePage from '@/components/ProsePage';

export default function PrivacyPage() {
  return (
    <ProsePage
      title="privacy.title"
      intro={['privacy.updated']}
      sections={[
        { title: 'privacy.collectTitle', items: ['privacy.collect1', 'privacy.collect2', 'privacy.collect3', 'privacy.collect4', 'privacy.collect5'] },
        { title: 'privacy.locationTitle', items: ['privacy.location'] },
        { title: 'privacy.whoTitle', items: ['privacy.who1', 'privacy.who2', 'privacy.who3', 'privacy.who4'] },
        { title: 'privacy.rightsTitle', items: ['privacy.rights1', 'privacy.rights2'] },
        { title: 'privacy.retentionTitle', items: ['privacy.retention'] },
        { title: 'privacy.contactTitle', items: ['privacy.contact'] },
      ]}
    />
  );
}
