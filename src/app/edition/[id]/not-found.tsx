export default function EditionNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">Paper not found</h1>
      <p className="mt-3 text-sm">This edition does not exist or belongs to another reader.</p>
      <a href="/archive" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
        Go to your archive
      </a>
    </main>
  );
}
