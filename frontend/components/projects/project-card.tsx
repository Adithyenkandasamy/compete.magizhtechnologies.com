import Link from "next/link";
import { FolderGit2 } from "lucide-react";
import type { Project } from "@/types/project";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="magizh-card group flex flex-col justify-between border-[#252525] p-6 transition-all hover:border-[#D4AF37]"
    >
      <div>
        <div className="flex items-center justify-between border-b border-[#252525] pb-3">
          <span className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#D4AF37]">
            <FolderGit2 size={11} />
            PROTOTYPE
          </span>

          <span className="text-xs text-[#A1A1A1] transition-transform group-hover:translate-x-1">
            →
          </span>
        </div>

        <h3 className="magizh-heading mt-4 text-xl font-bold text-[#F5F3ED] transition-colors group-hover:text-[#D4AF37]">
          {project.title}
        </h3>

        <p className="magizh-muted mt-3 line-clamp-3 text-xs leading-relaxed">
          {project.description ||
            "Innovative technical solution built during Magizh competition."}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#252525] pt-4 text-xs text-[#A1A1A1]">
        <span className="font-mono text-[11px] text-[#A1A1A1]">
          ID: {project.id.slice(0, 8)}
        </span>
        <span className="font-semibold text-[#D4AF37]">Case Study →</span>
      </div>
    </Link>
  );
}