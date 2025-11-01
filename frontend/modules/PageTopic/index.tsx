import { memo } from 'react';

interface PageTopicProps {
  sessionId: string;
}

function PageTopic({ sessionId }: PageTopicProps) {
  return <div>Session: {sessionId}</div>;
}

export default memo(PageTopic);
