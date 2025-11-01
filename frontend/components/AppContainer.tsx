import type { ReactNode } from 'react';
import MainSidebar, { MainSidebarProvider } from '@/components/MainSidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import type { Conversation } from '@/types/conversation';

interface AppContainerProps {
  conversations: Conversation[];
  children: ReactNode;
}

export default function AppContainer({
  conversations,
  children,
}: AppContainerProps) {
  return (
    <MainSidebarProvider>
      <MainSidebar conversations={conversations} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="relative min-h-screen w-full flex-1">{children}</div>
      </SidebarInset>
    </MainSidebarProvider>
  );
}
