'use client';

import ProsePage from '@/components/ProsePage';

export default function AboutPage() {
  return (
    <ProsePage
      title="about.title"
      intro={['about.p1', 'about.p2']}
      sections={[
        { title: 'about.pilotTitle', items: ['about.pilot'] },
        { title: 'about.verifyTitle', items: ['about.verify'] },
        { title: 'about.childcareTitle', items: ['about.childcare'] },
      ]}
    />
  );
}
