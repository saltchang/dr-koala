import { ArrowUpIcon } from 'lucide-react';
import { type ComponentProps, memo, useRef } from 'react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';

interface ChatInputProps extends ComponentProps<'textarea'> {
  onSend: () => void;
}

function ChatInput({ className, onSend, disabled, ...props }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleAddonBlankAreaInteraction = (
    e:
      | React.MouseEvent<HTMLFieldSetElement>
      | React.TouchEvent<HTMLFieldSetElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <InputGroup>
      <InputGroupTextarea
        ref={inputRef}
        placeholder="Ask, Search or Chat..."
        disabled={disabled}
        {...props}
      />
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
