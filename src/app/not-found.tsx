import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start px-5 py-24">
      <p className="font-mono text-sm text-indigo-400">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-100">
        That page doesn&apos;t exist
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-400">
        The lesson or course you were looking for isn&apos;t here. It may have
        been renamed.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
      >
        Back to courses
      </Link>
    </div>
  );
}
