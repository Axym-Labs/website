const e=`---
slug: trl
title: Temporal Regularized Learning
category: research
summary: A novel learning algorithm at the intersection of self-supervised and local learning
cover_image: /work/neural-architecture.jpg
use_cover_as_card_bg: true
show_cover_in_detail: false
external_url: https://axym.org/files/TRL.pdf
# main_points:
#   - [atom, local Learning Rule]
#   - [microchip, Online-Compatible]
#   - [brain, Self-Supervised Learning]
draft: false
date: 2025-11-13
rank: 1
links:
  - label: Repository
    url: https://github.com/axym-labs/trl
---

Temporal Regularized Learning (TRL) is a compact, highly local and self-supervised prodecure
that optimizes each neuron individually. We adapt the self-supervised loss formulation of VICReg,
consisting of variance, invariance and covariance to input streams with sequential coherence and for
online-compatibility. It removes the need for biphasic updates, negatives or inner-loop convergence,
given three scalar leaky-integrators per neuron and an auxiliary lateral network. Knowledge about
downstream tasks can be injected through the sequence ordering, allowing for supervised training. We
present TRL and its simplified variant, TRL-S. Experiments on MNIST show TRL is competetive with
backpropagation, Forward-Forward and Equilibrium Propagation, while TRL-S achieves adequate
performace despite its simplified setup. We show TRL creates neurons with specialized receptive
fields at the first layer. In later layers, some neurons specialize in firing only for some types of input.

Read the paper [here](https://axym.org/files/TRL.pdf)`;export{e as default};
