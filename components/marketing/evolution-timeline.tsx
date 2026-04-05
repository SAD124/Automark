"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { evolutionTimeline } from "@/content/site";

const timelineContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.24,
    },
  },
};

const timelineCardVariants = {
  hidden: (direction: number) => ({
    opacity: 0,
    y: 72,
    rotateX: -20,
    x: direction * 22,
    scale: 0.95,
    filter: "blur(12px)",
  }),
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const reducedMotionCardVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.24,
      ease: "easeOut",
    },
  },
};

type EvolutionTimelineCardProps = {
  index: number;
  item: (typeof evolutionTimeline)[number];
};

function EvolutionTimelineCard({
  index,
  item,
}: EvolutionTimelineCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const isCurrentEdge = index === evolutionTimeline.length - 1;
  const phaseLabel = index === 0 ? "Then" : index === 1 ? "Now" : "Next";
  const isEven = index % 2 === 0;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 95%", "end 5%"],
  });

  const parallaxY = useSpring(
    useTransform(scrollYProgress, [0, 0.55, 1], [30 - index * 4, 0, -12]),
    { stiffness: 175, damping: 30, mass: 0.44 },
  );
  const parallaxX = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [isEven ? -10 : 10, 0, isEven ? 4 : -4]),
    { stiffness: 165, damping: 30, mass: 0.46 },
  );
  const parallaxRotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [1.6, 0, -0.7]),
    { stiffness: 160, damping: 28, mass: 0.46 },
  );
  const parallaxRotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [isEven ? -0.45 : 0.45, 0, isEven ? 0.18 : -0.18]),
    { stiffness: 165, damping: 30, mass: 0.48 },
  );
  const parallaxScale = useSpring(
    useTransform(scrollYProgress, [0, 0.5, 1], [0.985, 1, 0.996]),
    { stiffness: 175, damping: 30, mass: 0.46 },
  );
  const glowOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.4, 0.75, 1], [0.08, 0.18, 0.13, 0.06]),
    { stiffness: 155, damping: 28, mass: 0.46 },
  );

  return (
    <motion.article
      ref={ref}
      className="relative ml-10 [transform-style:preserve-3d] sm:ml-16"
      style={
        prefersReducedMotion
          ? undefined
          : {
              y: parallaxY,
              x: parallaxX,
              rotateX: parallaxRotateX,
              rotateZ: parallaxRotateZ,
              scale: parallaxScale,
            }
      }
    >
      <motion.div
        className={`absolute left-[-2.55rem] top-8 h-5 w-5 rounded-full border-4 sm:left-[-3.35rem] ${
          isCurrentEdge
            ? "border-surface-container-low bg-primary shadow-[0_0_20px_rgba(79,219,200,0.45)]"
            : "border-surface-container-low bg-primary-fixed-dim/90"
        }`}
        initial={prefersReducedMotion ? false : { scale: 0.55, opacity: 0 }}
        whileInView={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 0.36,
                delay: 0.3 + index * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }
        }
      />

      <motion.div
        variants={prefersReducedMotion ? reducedMotionCardVariants : timelineCardVariants}
        custom={isEven ? -1 : 1}
        className={`relative overflow-hidden rounded-[2rem] p-6 [transform-origin:top_center] sm:p-8 ${
          isCurrentEdge
            ? "bg-surface-container-highest ring-1 ring-primary/25 shadow-[0_20px_80px_rgba(20,184,166,0.08)]"
            : "bg-surface-container-high"
        }`}
      >
        <motion.div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${
            isCurrentEdge
              ? "bg-linear-to-br from-primary/18 via-transparent to-transparent"
              : "bg-linear-to-br from-white/6 via-transparent to-transparent"
          }`}
          style={prefersReducedMotion ? undefined : { opacity: glowOpacity }}
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80 sm:text-xs">
              {phaseLabel}
            </p>
            <h3 className="mt-3 font-heading text-2xl font-black tracking-[-0.05em] text-primary sm:text-3xl">
              {item.year}
            </h3>
          </div>
          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              isCurrentEdge
                ? "bg-primary/15 text-primary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {item.title}
          </span>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-[15px] sm:leading-8">
          {item.description}
        </p>
      </motion.div>
    </motion.article>
  );
}

export function EvolutionTimeline() {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80%", "end 24%"],
  });
  const lineScaleY = useSpring(
    useTransform(scrollYProgress, [0, 1], [0.08, 1]),
    { stiffness: 190, damping: 32, mass: 0.44 },
  );
  const lineGlowOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.3, 1], [0.12, 0.45, 0.24]),
    { stiffness: 165, damping: 30, mass: 0.46 },
  );

  return (
    <div ref={ref} className="relative [perspective:1200px]">
      <div className="absolute bottom-8 left-[1.05rem] top-8 w-px bg-linear-to-b from-primary/10 via-primary/35 to-primary/10 sm:left-6" />
      <motion.div
        aria-hidden
        className="absolute bottom-8 left-[1.05rem] top-8 w-px origin-top bg-linear-to-b from-primary via-primary/80 to-primary/10 shadow-[0_0_24px_rgba(79,219,200,0.35)] sm:left-6"
        style={
          prefersReducedMotion
            ? undefined
            : {
                scaleY: lineScaleY,
                opacity: lineGlowOpacity,
              }
        }
      />
      <motion.div
        className="space-y-5 sm:space-y-6"
        variants={timelineContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {evolutionTimeline.map((item, index) => (
          <EvolutionTimelineCard key={item.year} index={index} item={item} />
        ))}
      </motion.div>
    </div>
  );
}
