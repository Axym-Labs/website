const e=`---
slug: axo
title: AxoSim and AxoBench
category: product
eyebrow: NEURAL SIMULATION
summary: Detailed neuron simulators resolve morphology and ion-channel mechanisms, but their repeated numerical integration is costly at population scale. AxoSim approximates each detailed neuron with a learned model and connects the models through explicit synaptic contacts, so that one RTX 5090 simulates 65,536 neurons with 4,000 contacts each at 3.38× real-time speed. AxoBench provides the datasets and metrics for evaluating such models, and the evaluation separates fidelity to a single neuron from validity inside a recurrent circuit, where each prediction changes the model's own future input.
author: Davide Wiest
draft: false
date: 2026-10-12
rank: 0.5
external_url: https://axo.axym.org
---
`;export{e as default};
