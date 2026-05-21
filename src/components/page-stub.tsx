type Props = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
};

export function PageStub({ title, description, icon }: Props) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-stone-500">
      {icon && <div className="text-5xl text-stone-300">{icon}</div>}
      <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h2>
      {description && <p className="max-w-xs text-sm">{description}</p>}
      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
        Coming soon — phase next
      </span>
    </div>
  );
}
