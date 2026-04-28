import { Muninn } from "@/components/Muninn";

export default function Page() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Muninn</p>
        <h1>Memory-backed answers, with citations.</h1>
        <p className="lede">
          A standalone RAG assistant built for portfolio sites. It embeds a small corpus at build time,
          searches bundled vectors at runtime, and streams concise answers from Groq.
        </p>
      </section>
      <Muninn />
    </main>
  );
}
