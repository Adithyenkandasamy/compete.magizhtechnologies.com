"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FloatingDockItem = {
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
};

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("relative block lg:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-3 flex flex-col items-center gap-2.5 rounded-2xl border border-[#252525] bg-[#0A0A0C]/95 p-3 shadow-2xl backdrop-blur-xl"
          >
            {items.map((item, idx) => {
              const content = (
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl border transition-all",
                    item.active
                      ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                      : "border-[#252525] bg-[#121216] text-[#A1A1A1] hover:border-[#D4AF37]/50 hover:text-[#F5F3ED]"
                  )}
                >
                  <div className="h-5 w-5 flex items-center justify-center">{item.icon}</div>
                </div>
              );

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    transition: { delay: idx * 0.03 },
                  }}
                  transition={{ delay: (items.length - 1 - idx) * 0.03 }}
                >
                  {item.onClick ? (
                    <button
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        setOpen(false);
                      }}
                      title={item.title}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      onClick={() => setOpen(false)}
                      title={item.title}
                    >
                      {content}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Toggle Navigation Dock"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#0A0A0C]/95 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] backdrop-blur-xl transition hover:scale-105 hover:border-[#D4AF37]"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden h-16 items-center gap-3 rounded-2xl border border-[#252525] bg-[#0A0A0C]/90 px-4 shadow-[0_0_40px_rgba(0,0,0,0.85),0_0_20px_rgba(212,175,55,0.06)] backdrop-blur-xl lg:flex",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
  active,
}: FloatingDockItem & {
  mouseX: MotionValue;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [42, 70, 42]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [42, 70, 42]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 32, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 32, 20]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  const inner = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-xl border transition-colors",
        active
          ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.25)]"
          : "border-[#252525] bg-[#121216] text-[#A1A1A1] hover:border-[#D4AF37]/60 hover:text-[#F5F3ED]"
      )}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 4, x: "-50%" }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 w-fit rounded-md border border-[#D4AF37]/30 bg-[#000000]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] shadow-xl backdrop-blur-md whitespace-nowrap pointer-events-none"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center"
      >
        {icon}
      </motion.div>
    </motion.div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="outline-none">
        {inner}
      </button>
    );
  }

  return (
    <Link href={href || "#"} className="outline-none">
      {inner}
    </Link>
  );
}
