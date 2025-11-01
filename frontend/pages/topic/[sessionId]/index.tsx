import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import PageTopic from '@/modules/PageTopic';

interface TopicProps {
  sessionId: string;
}

export default function Topic({ sessionId }: TopicProps) {
  return <PageTopic sessionId={sessionId} />;
}

export async function getServerSideProps({
  params,
}: GetServerSidePropsContext): Promise<GetServerSidePropsResult<TopicProps>> {
  if (!params?.sessionId) {
    return {
      notFound: true,
    };
  }

  const sessionId = Array.isArray(params?.sessionId)
    ? params?.sessionId[0]
    : params?.sessionId;

  return {
    props: {
      sessionId,
    },
  };
}
