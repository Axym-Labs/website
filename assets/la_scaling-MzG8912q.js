const e=`---
slug: learning-algorithms-scalability-notes
title: Informal Notes on Investigation of Learning Algorithm Scalability
category: idea
summary: Informal findings and learnings
cover_image: /work/private-ml.jpg
use_cover_as_card_bg: true
show_cover_in_detail: false
draft: false
date: 2025-11-22
rank: 2
# links:
#   - label: Repository
#     url: https://github.com/axym-labs/trl
---

This post summarizes key findings made during the analysis of the scaiability of various learning algorithms, *including* the ones that are not specifically related or relevant.

### Generating Data from an MLP
- Data was generated from an untrained, frozen MLP with linear layers and ReLU activation function that receives a signal as input. This signal is a one-hot encoding or sample of a normal distribution. Its output is the input to a MLP that is trained with the different learning algorithms. 
- The trained MLP essentially has to reconstruct the input signal (analogous to a latent variable) that constructed its inputs. The setup can be described as an Autoencoder where only the decoder is trained. The encoder and decoder have the same depth and layer dimensions that are reversed to each other (they are mirror layouts of each other).
- We tested regression (reconstruction of the sampled signal) and classification (argmax signal = argmax output). Unsuprisingly, regression is much harder than classification.
- Noise in the training data actually improves performance for classification. Probably because it enlargenes the subspace that is mapped to one class.
- **The repeating pattern has been this**: Learning algorithms perform near equally for small encoder-MLPs. For larger/deeper ones, feedback alignment performs worst, backprop and direct feedback alignment (DFA) are in the middle and difference target propagation actually performs best. For a 4-layer MLP with layer output dimensions [512,512,512,1024], it achieves 19.4% accuracy while backprop achieves only 10.2%. This is likely because target-propagation trains the network to be a good reverse of the untrained encoder. It can better reverse the data-generating process by propagating *targets*, which correspond to the activations of an encoders previous layer, closer to the true input signal.
- This is **strong evidence that generating synthetic data with MLPs does not capture the effect we want** - which is that alternative algorithms are outperformed by backprop for large-scale real data.

`;export{e as default};
