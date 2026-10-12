import { MessageBar, MessageBarBody } from '@fluentui/react-components';

export default function Notice({ intent = 'error', children }) {
  if (!children) return null;
  return (
    <MessageBar intent={intent} role={intent === 'error' ? 'alert' : 'status'}>
      <MessageBarBody>{children}</MessageBarBody>
    </MessageBar>
  );
}
