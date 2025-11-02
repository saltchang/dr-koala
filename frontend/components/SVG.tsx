import type { Ref } from 'react';
import { memo } from 'react';
import type { Props as SVGProps } from 'react-inlinesvg';
import InlineSVG from 'react-inlinesvg';

interface Props extends SVGProps {
  ref?: Ref<SVGElement>;
}

function SVG({ src, ref, cacheRequests = true, ...props }: Props) {
  if (!src) {
    return null;
  }

  return <InlineSVG innerRef={ref} src={src} cacheRequests={cacheRequests} {...props} />;
}

SVG.displayName = 'SVG';

export default memo(SVG);
