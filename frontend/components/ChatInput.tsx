import { ArrowUpIcon } from 'lucide-react';
import { type ComponentProps, memo } from 'react';

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group';

interface ChatInputProps extends ComponentProps<'textarea'> {
  onSend: () => void;
  ref?: React.Ref<HTMLTextAreaElement>;
}

function ChatInput({ className, onSend, disabled, ref, ...props }: ChatInputProps) {
  const handleAddonBlankAreaInteraction = (
    e: React.MouseEvent<HTMLFieldSetElement> | React.TouchEvent<HTMLFieldSetElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (ref && typeof ref === 'object' && 'current' in ref && ref.current && document.activeElement !== ref.current) {
      ref.current.focus();
    }
  };

  return (
    <InputGroup>
      <InputGroupTextarea ref={ref} placeholder="Ask, Search or Chat..." disabled={disabled} {...props} />
      <InputGroupAddon
        align="block-end"
        onMouseDown={handleAddonBlankAreaInteraction}
        onTouchStart={handleAddonBlankAreaInteraction}
      >
        <InputGroupButton
          variant="default"
          className="ml-auto rounded-full"
          size="icon-xs"
          onClick={onSend}
          disabled={disabled}
        >
          <ArrowUpIcon />
          <span className="sr-only">Send</span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

export default memo(ChatInput);
