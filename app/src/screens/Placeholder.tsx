export default function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <section className="pt-6">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-3 text-[var(--fg-soft)]">{text}</p>
    </section>
  );
}
