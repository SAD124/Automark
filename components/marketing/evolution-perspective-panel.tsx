"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

const phaseChips = [
  { label: "Then", value: "Prompting", emphasis: "default" },
  { label: "Now", value: "Orchestration", emphasis: "default" },
  { label: "Edge", value: "Evaluation", emphasis: "highlight" },
] as const;

const panelVariants = {
  hidden: {
    opacity: 0,
    y: 56,
    rotateX: -12,
    scale: 0.97,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const reducedMotionPanelVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.24,
      ease: "easeOut",
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const reducedMotionItemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

type PhaseChip = (typeof phaseChips)[number];

type EvolutionPhaseChipProps = {
  chip: PhaseChip;
  index: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
};

function EvolutionPhaseChip({
  chip,
  index,
  scrollYProgress,
}: EvolutionPhaseChipProps) {
  const prefersReducedMotion = useReducedMotion();
  const chipY = useSpring(
    useTransform(scrollYProgress, [0, 0.45, 1], [index * 4 + 10, 0, -6 - index * 2]),
    {
      stiffness: 160,
      damping: 30,
      mass: 0.45,
    },
  );

  return (
    <motion.div
      className={`rounded-[1.5rem] px-4 py-4 ${
        chip.emphasis === "highlight"
          ? "bg-primary-container text-on-primary shadow-[0_20px_50px_rgba(20,184,166,0.18)]"
          : "bg-surface-container"
      }`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 18, rotateX: -10, scale: 0.96 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={
        prefersReducedMotion
          ? undefined
          : {
              duration: 0.42,
              delay: 0.12 + index * 0.06,
              ease: [0.22, 1, 0.36, 1],
            }
      }
      style={prefersReducedMotion ? undefined : { y: chipY }}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
          chip.emphasis === "highlight" ? "text-on-primary/80" : "text-primary/80"
        }`}
      >
        {chip.label}
      </p>
      <p
        className={`mt-2 font-heading text-lg font-bold tracking-[-0.05em] ${
          chip.emphasis === "highlight" ? "text-on-primary" : "text-white"
        }`}
      >
        {chip.value}
      </p>
    </motion.div>
  );
}

export function EvolutionPerspectivePanel() {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "end 10%"],
  });

  const panelY = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [34, 0, -12]), {
    stiffness: 165,
    damping: 30,
    mass: 0.48,
  });
  const panelRotateX = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [2.6, 0, -1]), {
    stiffness: 150,
    damping: 26,
    mass: 0.48,
  });
  const panelScale = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0.985, 1, 0.995]), {
    stiffness: 165,
    damping: 30,
    mass: 0.48,
  });
  const glowOpacity = useSpring(
    useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [0.1, 0.2, 0.16, 0.08]),
    {
      stiffness: 150,
      damping: 26,
      mass: 0.48,
    },
  );

  const activePanelVariants = prefersReducedMotion ? reducedMotionPanelVariants : panelVariants;
  const activeItemVariants = prefersReducedMotion ? reducedMotionItemVariants : itemVariants;

  return (
    <motion.article
      ref={ref}
      className="relative overflow-hidden rounded-[2rem] bg-surface-container-high p-6 [transform-style:preserve-3d] sm:p-8 xl:sticky xl:top-24 xl:p-10"
      variants={activePanelVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      style={
        prefersReducedMotion
          ? undefined
          : {
              y: panelY,
              rotateX: panelRotateX,
              scale: panelScale,
            }
      }
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-radial-[circle_at_top_left] from-primary/18 via-transparent to-transparent"
        style={prefersReducedMotion ? undefined : { opacity: glowOpacity }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-primary/35 to-transparent"
        variants={activeItemVariants}
      />

      <motion.p
        className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80"
        variants={activeItemVariants}
      >
        Why this matters now
      </motion.p>
      <motion.h3
        className="mt-5 max-w-xl font-heading text-[2rem] font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-[2.4rem]"
        variants={activeItemVariants}
      >
        The winning layer is no longer the model. It is the operating system around it.
      </motion.h3>
      <motion.p
        className="mt-5 max-w-xl text-[15px] leading-8 text-on-surface-variant sm:text-base"
        variants={activeItemVariants}
      >
        Teams that stay in the copilot era will keep collecting fragmented wins. Teams that build
        orchestration, evaluation, and clear human control will compound speed and signal across
        the business.
      </motion.p>

      <motion.div className="mt-8 grid gap-3 sm:grid-cols-3" variants={activeItemVariants}>
        {phaseChips.map((chip, index) => (
          <EvolutionPhaseChip
            key={chip.label}
            chip={chip}
            index={index}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </motion.div>
    </motion.article>
  );
}
