import { useEffect, useState } from 'react';
import { Button } from '@fluentui/react-components';
import { Checkmark20Regular, Copy20Regular } from '@fluentui/react-icons';

export default function CopyButton({ text, label = 'Copy' }) {
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (status === 'idle') return undefined;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <Button
      appearance="secondary"
      icon={status === 'copied' ? <Checkmark20Regular /> : <Copy20Regular />}
      onClick={handleCopy}
      disabled={!text}
    >
      {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label}
    </Button>
  );
}
