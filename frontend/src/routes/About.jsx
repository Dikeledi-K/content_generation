const steps = [
  ['Write a brief', 'Open the Generator, choose Content or Code, and describe what you need. Attach files for extra context.'],
  ['Refine your prompt', 'Use the Prompt Optimizer or start from a Prompt Library template for clearer, more specific results.'],
  ['Keep what works', 'Copy or save any output. Everything you generate is also listed in History.'],
];

export default function About() {
  return (
    <div className="split">
      <section className="card stack" aria-labelledby="about-heading">
        <h2 id="about-heading" className="section-title">About CreateAI</h2>
        <p style={{ margin: 0, fontSize: '1.02rem', lineHeight: 1.7 }}>
          CreateAI helps teams generate polished content, code snippets and prompts with a repeatable workflow.
          It is designed for fast iteration, structured prompt design and easy review of outputs across projects.
        </p>
      </section>
      <section className="card" aria-labelledby="how-heading">
        <h2 id="how-heading" className="section-title" style={{ marginBottom: '1rem' }}>How it works</h2>
        <ol className="list">
          {steps.map(([title, text], index) => (
            <li key={title} className="list-item" style={{ justifyContent: 'flex-start', alignItems: 'flex-start' }}>
              <span className="brand-mark" style={{ width: 28, height: 28, fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>{index + 1}</span>
              <div>
                <span className="list-item-title">{title}</span>
                <span className="muted">{text}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
