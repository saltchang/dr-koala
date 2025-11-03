import { MessageCirclePlusIcon, MessageSquareTextIcon, Trash2Icon } from 'lucide-react';
import { useRouter } from 'next/router';
import { memo, type ReactNode, useState } from 'react';
import svgDrKoalaLogo from '@/assets/dr-koala.svg';
import SimpleConfirmDialog from '@/components/SimpleConfirmDialog';
import SVG from '@/components/SVG';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { useDeleteSession } from '@/hooks/useDeleteSession';
import { useTopicSessions } from '@/hooks/useTopicSessions';

function MainSidebar() {
  const router = useRouter();
  const { data: topicSessions, isLoading } = useTopicSessions();
  const { isMobile, setOpenMobile, setOpen } = useSidebar();
  const deleteSessionMutation = useDeleteSession();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleNewTopicSession = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    setOpen(false);
    router.push('/');
  };

  const handleTopicSessionClick = (topicSessionId: string) => {
    if (isMobile) {
      setOpenMobile(false);
    }
    router.push(`/topic/${topicSessionId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, topicSessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(topicSessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteSessionMutation.mutate(
        { sessionId: sessionToDelete },
        {
          onSuccess: () => {
            setDeleteDialogOpen(false);
            setSessionToDelete(null);
            if (router.query.topicSessionId === sessionToDelete) {
              router.push('/');
            }
          },
        },
      );
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <SVG src={svgDrKoalaLogo.src} className="w-8 h-8" />
          <h2 className="text-lg font-semibold">Dr. Koala</h2>
        </div>
        <Button onClick={handleNewTopicSession} className="w-full gap-2" variant="outline">
          New Topic
          <MessageCirclePlusIcon className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">Loading...</div>
              ) : topicSessions.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">No sessions yet</div>
              ) : (
                topicSessions.map((topicSession) => (
                  <SidebarMenuItem key={topicSession.id} className="group/item">
                    <SidebarMenuButton asChild>
                      <button
                        type="button"
                        className="flex flex-col items-start w-full cursor-pointer h-fit py-2 px-3 pr-10 relative"
                        onClick={() => handleTopicSessionClick(topicSession.id)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <MessageSquareTextIcon className="h-4 w-4 shrink-0" />
                          <div className="truncate flex-1 text-left">{topicSession.query}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(topicSession.timestamp).toLocaleTimeString()}
                        </div>
                        <button
                          type="button"
                          className="opacity-0 group-hover/item:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-destructive/10 rounded-sm cursor-pointer"
                          onClick={(e) => handleDeleteClick(e, topicSession.id)}
                          aria-label="Delete session"
                        >
                          <Trash2Icon className="h-4 w-4 text-destructive" />
                        </button>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SimpleConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        isLoading={deleteSessionMutation.isPending}
      />
    </Sidebar>
  );
}

export default memo(MainSidebar);

export function MainSidebarProvider({ children }: { children: ReactNode }) {
  return <SidebarProvider defaultOpen={false}>{children}</SidebarProvider>;
}
