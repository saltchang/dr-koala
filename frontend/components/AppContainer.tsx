import type { ReactNode } from 'react';
import MainSidebar, { MainSidebarProvider } from '@/components/MainSidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

interface AppContainerProps {
  children: ReactNode;
}

export default function AppContainer({ children }: AppContainerProps) {
  return (
    <MainSidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
        </header>
        <div className="relative h-[calc(100vh-4rem)] w-full flex-1">{children}</div>
      </SidebarInset>
    </MainSidebarProvider>
  );
}
