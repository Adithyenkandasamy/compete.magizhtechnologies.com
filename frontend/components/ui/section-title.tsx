type SectionTitleProps = {
  label?: string;
  title: string;
  description?: string;
};

export function SectionTitle({
  label,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="mb-10">
      {label && (
        <p className="magizh-gold mb-3 text-xs font-semibold uppercase tracking-[0.25em]">
          {label}
        </p>
      )}

      <h2 className="magizh-heading text-3xl font-bold leading-tight md:text-4xl">
        {title}
      </h2>

      {description && (
        <p className="magizh-muted mt-3 max-w-2xl text-base leading-7">
          {description}
        </p>
      )}
    </div>
  );
}