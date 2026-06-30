export default function SideButton({
  label,
  active,
  onClick,
  badge,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-10 py-2.5 text-sm flex items-center justify-between gap-3',
        active
          ? 'text-emerald-700 font-semibold bg-emerald-50'
          : 'text-neutral-600 hover:text-emerald-700 hover:bg-neutral-50',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>

      {!!badge && badge > 0 && (
        <span className="min-w-6 h-6 px-2 rounded-full bg-amber-500 text-white text-xs font-semibold inline-flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}