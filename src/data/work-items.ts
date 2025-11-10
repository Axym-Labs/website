export interface WorkItem {
  slug: string;
  title: string;
  category: "product" | "research" | "idea";
  summary: string;
  cover_image?: string;
  cover_animated?: boolean;
  cover_poster?: string;
  use_cover_as_card_bg?: boolean;
  external_url?: string;
  main_points?: [string, string][];
  draft: boolean;
  date: string;
  rank?: number;
  content: string;
  links?: { label: string; url: string }[];
}

export const workItems: WorkItem[] = [
  {
    slug: "real-time-inference",
    title: "Real-Time ML Inference Pipeline",
    category: "product",
    summary: "A low-latency inference system designed for production environments.",
    cover_image: "/work/real-time-inference.jpg",
    use_cover_as_card_bg: false,
    main_points: [
      ["bolt", "Sub-10ms latency"],
      ["shield", "Fault-tolerant"],
      ["cpu", "Auto-scaling"],
    ],
    draft: false,
    date: "2025-10-15",
    rank: 1,
    content: `
# Real-Time ML Inference Pipeline

A production-ready inference system built for speed and reliability.

## Overview

This project demonstrates a complete pipeline for deploying machine learning models with real-time constraints. The system handles model serving, load balancing, and monitoring.

## Key Features

- **Low Latency**: Optimized for sub-10ms response times
- **Scalability**: Horizontal scaling based on traffic patterns
- **Monitoring**: Built-in metrics and alerting

## Architecture

The system uses a microservices architecture with dedicated components for model serving, caching, and orchestration.

## Results

In production testing, the system maintained:
- 99.9% uptime
- Average latency of 8ms
- Successful handling of 10K+ requests/second
    `,
    links: [
      { label: "Repository", url: "https://github.com/axym-labs/inference" },
      { label: "Documentation", url: "https://docs.axym.org/inference" },
    ],
  },
  {
    slug: "attention-mechanisms",
    title: "Efficient Attention Mechanisms",
    category: "research",
    summary: "Exploring sparse attention patterns that reduce computational complexity.",
    cover_image: "/work/private-ml.jpg",
    main_points: [
      ["cpu", "50% faster training"],
      ["database", "Linear memory"],
    ],
    draft: false,
    date: "2025-09-20",
    rank: 2,
    content: `
# Efficient Attention Mechanisms

Research into sparse attention patterns for transformer models.

## Abstract

We investigate various sparse attention patterns that maintain model quality while significantly reducing computational requirements for long-context tasks.

## Methodology

Our approach introduces a learnable sparsity pattern that adapts during training, focusing computational resources on the most relevant token interactions.

## Results

- 50% reduction in training time
- Linear memory complexity with sequence length
- Minimal loss in benchmark performance (<2%)

## Future Work

We plan to extend this work to multimodal transformers and explore dynamic sparsity patterns.
    `,
    links: [
      { label: "Paper", url: "https://arxiv.org/example" },
      { label: "Code", url: "https://github.com/axym-labs/attention" },
    ],
  },
  {
    slug: "meta-learning-thoughts",
    title: "Thoughts on Meta-Learning Paradigms",
    category: "idea",
    summary: "An exploration of meta-learning approaches and their potential.",
    cover_image: "/work/neural-architecture.jpg",
    main_points: [
      ["eye", "Few-shot learning"],
      ["shield", "Robust adaptation"],
    ],
    draft: false,
    date: "2025-08-10",
    content: `
# Thoughts on Meta-Learning Paradigms

Reflections on the current state and future directions of meta-learning.

## Introduction

Meta-learning, or "learning to learn," offers a promising path toward more flexible and sample-efficient AI systems.

## Current Approaches

Most meta-learning work focuses on either:
- Optimization-based methods (MAML, Reptile)
- Metric learning approaches (Prototypical Networks, Matching Networks)
- Memory-augmented architectures

## Open Questions

1. How can we scale meta-learning to complex, real-world domains?
2. What inductive biases are most useful for rapid adaptation?
3. Can meta-learning reduce reliance on large datasets?

## Conclusion

Meta-learning remains an underexplored area with significant potential for impact.
    `,
    links: [
      { label: "Discussion", url: "https://axym.org/discussions/meta-learning" },
    ],
  },
];
