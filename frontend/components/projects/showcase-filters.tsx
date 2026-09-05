"use client";

type ProjectShowcaseFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function ProjectShowcaseFilters({
  search,
  onSearchChange,
}: ProjectShowcaseFiltersProps) {
  return (
    <div className="magizh-card mt-10 p-4 md:p-5">
      <label
        htmlFor="project-search"
        className="magizh-muted mb-2 block text-xs font-semibold uppercase tracking-[0.2em]"
      >
        Search Projects
      </label>

      <input
        id="project-search"
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by project title or description..."
        className="w-full rounded border border-[#252525] bg-[#0A0A0A] px-4 py-3 text-sm text-[#F5F3ED] outline-none transition-colors placeholder:text-[#666] focus:border-[#D4AF37]"
      />
    </div>
  );
}