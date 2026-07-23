export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-2 px-5 py-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="max-w-xl">
          <span className="font-medium text-ink-soft">Not investment advice.</span> Screen is a
          research and education tool for filtering listings — it does not recommend buying or
          selling anything. Verify data before acting on it.
        </p>
        <p>
          Data:{" "}
          <a
            href="https://financialmodelingprep.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:opacity-70"
          >
            Financial Modeling Prep
          </a>
        </p>
      </div>
    </footer>
  );
}
