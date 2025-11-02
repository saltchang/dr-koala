import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import PageTopic from '@/modules/PageTopic';

interface TopicProps {
  topicSessionId: string;
}

export default function Topic({ topicSessionId }: TopicProps) {
  return <PageTopic topicSessionId={topicSessionId} />;
}

export async function getServerSideProps({
  params,
}: GetServerSidePropsContext): Promise<GetServerSidePropsResult<TopicProps>> {
  const topicSessionId = Array.isArray(params?.topicSessionId) ? params?.topicSessionId[0] : params?.topicSessionId;

  if (!topicSessionId) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      topicSessionId,
    },
  };
}
