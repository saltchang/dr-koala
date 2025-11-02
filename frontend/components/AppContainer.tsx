import type { ReactNode } from 'react';
import MainSidebar, { MainSidebarProvider } from '@/components/MainSidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import type { TopicSession } from '@/types/topicSession';

interface AppContainerProps {
  topicSessions: TopicSession[];
  children: ReactNode;
}

export default function AppContainer({ topicSessions, children }: AppContainerProps) {
  return (
    <MainSidebarProvider>
      <MainSidebar topicSessions={topicSessions} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="relative min-h-screen w-full flex-1">{children}</div>
      </SidebarInset>
    </MainSidebarProvider>
  );
}
