"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { heroStats } from "@/content/site";

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 28,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.72,
      ease: smoothEase,
    },
  },
};

const lineVariants = {
  hidden: {
    opacity: 0,
    y: 68,
    rotateX: -16,
    filter: "blur(10px)",
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.78,
      delay: 0.16 + index * 0.1,
      ease: smoothEase,
    },
  }),
};

const statVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.97,
    filter: "blur(8px)",
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.64,
      delay: 0.42 + index * 0.08,
      ease: smoothEase,
    },
  }),
};

const reducedMotionVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: smoothEase,
    },
  },
};

const headlineLines = ["Authority", "Through", "Intelligence"];

export function HeroContent() {
  const prefersReducedMotion = useReducedMotion();
  const activeItemVariants = prefersReducedMotion ? reducedMotionVariants : itemVariants;

  return (
    <Container className="relative pb-20 pt-16 sm:pb-24 sm:pt-20 md:pb-28 md:pt-24 lg:pb-36 lg:pt-32">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-[10%] top-8 h-48 rounded-full bg-primary/10 blur-3xl sm:top-12 sm:h-56"
        animate={
          prefersReducedMotion
            ? undefined
            : {
                opacity: [0.22, 0.42, 0.24],
                scale: [0.96, 1.04, 0.98],
                y: [0, -12, 0],
              }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 9,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />

      <motion.div
        className="relative mx-auto max-w-5xl text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-flex max-w-full items-center gap-3 rounded-full bg-surface-container-high/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-fixed-dim ring-1 ring-white/6 sm:text-[11px] sm:tracking-[0.34em]"
          variants={activeItemVariants}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-65" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="min-w-0 truncate sm:whitespace-normal">
            Editorial intelligence for modern operators
          </span>
        </motion.div>

        <div className="mt-8 space-y-6 sm:space-y-8">
          <h1 className="font-heading text-[3.4rem] font-extrabold uppercase leading-[0.84] tracking-[-0.08em] sm:text-[4.75rem] md:text-[6rem] lg:text-[8rem]">
            {headlineLines.map((line, index) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="headline-gradient block [transform-origin:50%_100%]"
                  custom={index}
                  variants={prefersReducedMotion ? reducedMotionVariants : lineVariants}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="mx-auto max-w-2xl text-base leading-7 text-on-surface-variant sm:text-xl sm:leading-8"
            variants={activeItemVariants}
          >
            We engineer autonomous multi-agent systems, intelligence operations, and execution
            layers that move ambitious companies beyond chatbots and into governed, production-ready
            AI infrastructure.
          </motion.p>
        </div>

        <motion.div
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          variants={activeItemVariants}
        >
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
          >
            <ButtonLink href="/#book-call" className="w-full sm:min-w-52 sm:w-auto">
              Book a Strategy Call
            </ButtonLink>
          </motion.div>
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
          >
            <ButtonLink
              href="/#methodology"
              variant="secondary"
              className="w-full sm:min-w-52 sm:w-auto"
            >
              View methodology
            </ButtonLink>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-5 inline-flex items-center justify-center gap-2 text-center text-xs text-on-surface-variant sm:mt-6 sm:text-sm"
          variants={activeItemVariants}
        >
          <span className="leading-6">Designed for teams that need calm, high-signal systems.</span>
          <motion.span
            animate={prefersReducedMotion ? undefined : { x: [0, 4, 0] }}
            transition={
              prefersReducedMotion
                ? undefined
                : {
                    duration: 2.8,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }
            }
          >
            <ArrowRightIcon className="mt-px h-4 w-4 shrink-0 text-primary" />
          </motion.span>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {heroStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              custom={index}
              variants={prefersReducedMotion ? reducedMotionVariants : statVariants}
              className="rounded-[2rem] bg-surface-container/80 px-5 py-5 text-left ring-1 ring-white/5 backdrop-blur sm:px-6 sm:py-6"
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : {
                      y: -4,
                      scale: 1.01,
                      transition: { duration: 0.2, ease: "easeOut" },
                    }
              }
            >
              <p className="font-heading text-[1.75rem] font-black tracking-[-0.05em] text-white sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Container>
  );
}
