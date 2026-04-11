'use client';

import styled from '@emotion/styled';
import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const Page = styled.div`
  display: grid;
  gap: 1rem;
`;

const Header = styled.section`
  background: #ffffff;
  border: 1px solid #e4e8ed;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  display: grid;
  gap: 0.45rem;

  h1 {
    margin: 0;
    color: #212529;
    font-size: clamp(1.35rem, 2.6vw, 2rem);
  }

  p {
    margin: 0;
    color: #495057;
  }
`;

const BackLink = styled(Link)`
  width: fit-content;
  text-decoration: none;
  color: #f26419;
  font-weight: 600;
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const TabButton = styled.button<{ active: boolean }>`
  border-radius: 4px;
  border: 1px solid ${({ active }) => (active ? '#ff6b35' : '#d0d7df')};
  background: ${({ active }) => (active ? '#ff6b35' : '#ffffff')};
  color: ${({ active }) => (active ? '#ffffff' : '#212529')};
  font-weight: 600;
  padding: 0.45rem 0.8rem;
  cursor: pointer;
`;

const ViewerCard = styled.section`
  background: #ffffff;
  border: 1px solid #e4e8ed;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1rem;
  display: grid;
  gap: 0.75rem;

  h2 {
    margin: 0;
    color: #212529;
    font-size: 1.1rem;
  }

  p {
    margin: 0;
    color: #495057;
  }
`;

const VideoFrame = styled.video`
  width: 100%;
  border-radius: 10px;
  border: 1px solid #d9e0e8;
  background: #000;
`;

const PdfFrame = styled.embed`
  width: 100%;
  height: min(70vh, 700px);
  border: 1px solid #d9e0e8;
  border-radius: 10px;
  background: #f8f9fa;
`;

const sampleVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const samplePdf = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

function PlayerPageContent() {
  const params = useSearchParams();
  const [activeTab, setActiveTab] = useState<'video' | 'pdf'>('video');

  const videoSrc = useMemo(() => params.get('video') || sampleVideo, [params]);
  const pdfSrc = useMemo(() => params.get('pdf') || samplePdf, [params]);

  return (
    <Page>
      <Header>
        <BackLink href="/">← Wroc do strony glownej</BackLink>
        <h1>Odtwarzacz kursu</h1>
        <p>Przegladaj materialy bez pobierania: wideo oraz dokument PDF bezposrednio w interfejsie platformy.</p>
      </Header>

      <ViewerCard>
        <Tabs>
          <TabButton type="button" active={activeTab === 'video'} onClick={() => setActiveTab('video')}>
            Wideo
          </TabButton>
          <TabButton type="button" active={activeTab === 'pdf'} onClick={() => setActiveTab('pdf')}>
            Dokument PDF
          </TabButton>
        </Tabs>

        {activeTab === 'video' ? (
          <>
            <h2>Material wideo</h2>
            <VideoFrame controls preload="metadata" src={videoSrc} />
          </>
        ) : (
          <>
            <h2>Przegladarka PDF</h2>
            <PdfFrame src={pdfSrc} type="application/pdf" />
          </>
        )}
      </ViewerCard>
    </Page>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<Page />}>
      <PlayerPageContent />
    </Suspense>
  );
}
