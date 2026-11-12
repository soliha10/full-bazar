export function Cb({ on }: { on: boolean }) {
  return (
    <span className={`inline-flex w-[15px] h-[15px] shrink-0 rounded-sm border transition-colors ${
      on ? 'bg-violet-600 border-violet-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
    }`}>
      {on && (
        <svg viewBox="0 0 10 10" className="m-auto w-2 h-2 text-white" fill="none">
          <path d="M1.5 5l2.5 2.5L8.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function SLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">
      {children}
    </p>
  );
}
