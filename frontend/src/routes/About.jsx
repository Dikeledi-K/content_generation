import { Title2, Text } from '@fluentui/react-components';

export default function About() {
  return (
    <div className="panel card">
      <Title2 as="h2">About CreateAI</Title2>
      <Text style={{ display: 'block', marginTop: '1rem', lineHeight: 1.8, color: '#cbd5e1' }}>
        CreateAI helps teams generate polished content, code snippets, and prompts with a repeatable workflow. It is designed for fast iteration, structured prompt design, and easy review of outputs across projects.
      </Text>
      <ul style={{ color: '#cbd5e1', lineHeight: 1.8, marginTop: '1rem' }}>
        <li>Build prompts with clarity and context.</li>
        <li>Optimize phrasing for tone and audience.</li>
        <li>Track generations and compare history.</li>
      </ul>
    </div>
  );
}
