export default function OrderTabButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'h-10 px-4 rounded-full text-sm font-semibold border',
        'transition-all',
        'active:scale-[0.99]',
        active
          ? 'bg-primary-600 text-white border-primary-600 shadow-sm hover:bg-primary-700 hover:border-primary-700'
          : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400',
      ].join(' ')}
    >
      {children}
    </button>
  );
}