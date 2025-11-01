import { MessageCirclePlusIcon, MessageSquareIcon } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import svgDrKoalaLogo from '@/assets/dr-koala.svg';
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
} from '@/components/ui/sidebar';
import type { Conversation } from '@/types/conversation';

interface MainSidebarProps {
  conversations: Conversation[];
}

function MainSidebar({ conversations }: MainSidebarProps) {
  const handleNewConversation = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newConversation'));
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <SVG src={svgDrKoalaLogo.src} className="w-8 h-8" />
          <h2 className="text-lg font-semibold">Dr. Koala</h2>
        </div>
        <Button
          onClick={handleNewConversation}
          className="w-full gap-2"
          variant="outline"
        >
          New Topic
          <MessageCirclePlusIcon className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No conversations yet
                </div>
              ) : (
                conversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton asChild>
                      <button
                        type="button"
                        className="flex flex-col items-start gap-1 w-full"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <MessageSquareIcon className="h-4 w-4" />
                          <span className="truncate flex-1 text-left">
                            {conversation.query}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            conversation.timestamp,
                          ).toLocaleTimeString()}
                        </span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default memo(MainSidebar);

export function MainSidebarProvider({ children }: { children: ReactNode }) {
  return <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>;
}
