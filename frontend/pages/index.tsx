import type { ParsedUrlQuery } from 'node:querystring';
import type { GetStaticPropsContext, GetStaticPropsResult } from 'next';
import PageHome from '@/modules/PageHome';

export default function Home() {
  return <PageHome />;
}

type StaticParams = ParsedUrlQuery;

export async function getStaticProps({
  params,
}: GetStaticPropsContext): Promise<GetStaticPropsResult<StaticParams>> {
  return {
    props: params ?? {},
  };
}
