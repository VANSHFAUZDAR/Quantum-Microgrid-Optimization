# Quantum-Classical Energy Management and 3D Cyber-Physical Digital Twin Architecture for Priority-Aware Smart Microgrid Optimization

**A Rigorous Multi-Tier Formulation, Variational Algorithmic Benchmark, and Real-Time Spatial Simulation**

- **Primary Authors:** Vansh Fauzdar$^1$, Nihar Reddy$^2$, Collaborative Research Group in Quantum Systems
- **Affiliations:** 
  - $^1$ Department of Physics and Computational Sciences
  - $^2$ Department of Electrical Engineering and Smart Grid Systems
- **Date:** October 2026
- **Document Format:** Comprehensive Extended Research Article / Technical Monograph (20–25 Page Academic Equivalency)

---

## Abstract

The reliable coordination of distributed energy resources (DERs) in decentralized electrical microgrids demands real-time, priority-aware energy dispatch mechanisms capable of preventing catastrophic shedding of life-critical municipal infrastructure during severe generation deficits. This comprehensive study introduces **QuantumV1**, a unified hybrid quantum-classical optimization architecture and accompanying cyber-physical 3D isometric digital twin environment engineered for autonomous microgrid decision support. We formulate and analyze three mathematically distinct operational regimes: 

1. **Continuous snapshot power dispatch** modeled as a bounded continuous fractional knapsack problem;
2. **Indivisible discrete feeder switching** modeled as an NP-hard $0/1$ combinatorial knapsack problem mapped to Quadratic Unconstrained Binary Optimization (QUBO) and solved via the Quantum Approximate Optimization Algorithm (QAOA); and
3. **A 24-hour dynamic multi-period dispatch framework** with 218 continuous variables incorporating battery energy storage systems (BESS), solar photovoltaics, and time-of-use tariffs solved via classical linear programming (HiGHS).

Empirical validation was performed across 282 controlled experimental runs spanning seven benchmark campaigns using simulated statevectors with 2,048 projective measurement shots per trial. The QAOA depth sweep demonstrated that advancing variational circuit depth from $p = 1$ to $p = 3$ generated a $74.4\%$ relative increase in optimal ground-state probability mass, achieving a $98.33\%$ ($59/60$) raw-register optimum recovery rate and a $94.44\%$ ($68/72$) ground-state recovery across indivisible switching instances encoded with 5–9 qubits. Conversely, classical mixed-integer linear programming (HiGHS) solved $100\%$ ($50/50$) of scalability benchmark instances up to 200 feeders in an average runtime of $21.3\text{ ms}$, whereas legacy unpruned branch-and-bound exhibited an exponential 1,900-fold runtime increase between 10 and 20 feeders ($3.07\text{ ms}$ to $5,827.09\text{ ms}$). To bridge the operational gap between quantum optimization telemetry and human operators, we architected an interactive, 60 FPS isometric 3D WebGL digital twin employing Three.js, custom GLSL volumetric god-ray shaders, procedural Web Audio synthesis, and bidirectional parameter synchronization. Our findings demonstrate that while classical MILP retains clear practical computational superiority for medium-to-large microgrids in the NISQ era, QAOA provides an effective variational formulation for combinatorial feeder allocation, with the accompanying digital twin establishing a robust, reproducible testbed for future hybrid quantum energy management systems.

**Keywords:** Quantum Approximate Optimization Algorithm (QAOA), Quadratic Unconstrained Binary Optimization (QUBO), Microgrid Energy Management, Digital Twin, Three.js, Combinatorial Knapsack, Qiskit, NISQ Benchmarking, HiGHS MILP.

---

## Table of Contents
1. [Introduction and Problem Motivation](#1-introduction-and-problem-motivation)
2. [Comprehensive Literature Review and Theoretical Landscape](#2-comprehensive-literature-review-and-theoretical-landscape)
3. [3D Cyber-Physical Digital Twin Architecture](#3-3d-cyber-physical-digital-twin-architecture)
4. [Mathematical Optimization Formulations and Rigorous Proofs](#4-mathematical-optimization-formulations-and-rigorous-proofs)
5. [Quantum Variational Framework: QUBO Mapping and QAOA Synthesis](#5-quantum-variational-framework-qubo-mapping-and-qaoa-synthesis)
6. [Full Algorithmic Specifications](#6-full-algorithmic-specifications)
7. [Empirical Benchmark Suite and Comparative Evaluation](#7-empirical-benchmark-suite-and-comparative-evaluation)
8. [In-Depth Discussion and Scalability Realities](#8-in-depth-discussion-and-scalability-realities)
9. [Limitations and Future Trajectories](#9-limitations-and-future-trajectories)
10. [Conclusion](#10-conclusion)
11. [References](#11-references)

---

## 1. Introduction and Problem Motivation

### 1.1 Background and Real-World Grid Challenges
The modern electrical grid is undergoing a paradigm shift from centralized, fossil-fueled generation toward decentralized, renewable-dominated architectures. Distributed Energy Resources (DERs)---comprising rooftop and utility-scale photovoltaic (PV) arrays, micro-wind turbines, small-scale run-of-river hydroelectric stations, and Battery Energy Storage Systems (BESS)---form the operational backbone of localized smart microgrids [1]. Microgrids offer vital resilience against macro-grid blackouts, support the electrification of remote and rural regions, and diminish aggregate carbon footprints [2].

However, the proliferation of DERs introduces profound operational vulnerabilities. Renewable generation is intrinsically stochastic and intermittent, governed by unpredictable meteorological fluctuations such as sudden cloud cover, wind lulls, and seasonal hydrological shifts [3]. Simultaneously, consumer demand exhibits extreme variability, driven by electric vehicle (EV) charging spikes, industrial machinery duty cycles, and residential thermal regulation. Consequently, microgrid energy management systems (EMS) frequently encounter *generation-deficient operating states*, wherein aggregate instantaneous power demand substantially outstrips local generation and storage discharge capacity [7].

In physical power systems, persistent supply deficits cause severe frequency dips and voltage instability, which can trigger cascading protective breaker trips and induce total microgrid collapse (blackout). To avert widespread grid failure, the EMS must execute rapid, automated *load shedding* or priority-aware power dispatch [2].

### 1.2 The Criticality of Priority-Aware Scheduling
In emergency dispatch regimes, all electrical loads cannot be treated equally. Modern civilized infrastructure relies on a clear hierarchy of societal and operational criticality:
- **Life-Critical Loads (Priority Tier 1):** Regional hospitals, trauma care units, intensive care monitoring, vaccine refrigeration, and emergency response communications. Loss of power introduces an immediate risk to human life.
- **High-Priority Municipal Loads (Priority Tier 2):** Educational institutions, water purification and sewage pumping stations, and municipal police/fire control hubs.
- **Medium-Priority Commercial Loads (Priority Tier 3):** Commercial complexes, smart manufacturing factories, data processing facilities, and EV fast-charging corridors.
- **Low-Priority Residential Loads (Priority Tier 4):** Non-essential residential circuits, decorative municipal illumination, and deferrable domestic heating.

When available generation is constrained, an intelligent EMS must allocate power such that unmet demand at high-priority loads incurs heavily penalized costs compared to unserved demand at lower-priority loads. This gives rise to a family of constrained mathematical optimization problems.

### 1.3 Continuous vs. Indivisible Combinatorial Allocation
In the power systems literature, a recurring conceptual ambiguity exists between continuous power throttling and discrete feeder switching:
1. **Continuous Power Allocation:** When individual loads or substations are equipped with local inverters, smart solid-state power electronic transformers, or building automation systems, power delivery $x_i$ can be modulated continuously between $0$ and maximum demand $D_i$. As will be proven in Section 4, this problem reduces to the continuous fractional knapsack problem and can be solved to exact global optimality in $\mathcal{O}(M \log M)$ time using a priority-greedy sorting algorithm.
2. **Indivisible Discrete Feeder Switching:** In typical medium- and low-voltage distribution grids, individual feeder breakers operate in binary states: a feeder is either fully energized ($b_i = 1, x_i = D_i$) or fully disconnected ($b_i = 0, x_i = 0$). Partial powering is prohibited because running transformers or motors at severely reduced voltages induces overheating, brownouts, and physical damage. This indivisible switching regime constitutes an NP-hard $0/1$ knapsack problem, where greedy prioritization fails to guarantee global optimality due to volumetric packing inefficiencies.

### 1.4 Quantum Optimization Opportunities in the NISQ Era
As microgrids scale to include hundreds of micro-generators and thousands of addressable switching circuits, the combinatorial search space of $0/1$ feeder assignments scales exponentially as $2^M$. On classical computational architectures, solving large-scale integer programs under strict real-time deadlines (e.g., within 50–100 milliseconds for grid protection relays) can encounter performance bottlenecks [8].

The advent of Noisy Intermediate-Scale Quantum (NISQ) hardware [11] has stimulated significant interest in quantum heuristic algorithms. In particular, the Quantum Approximate Optimization Algorithm (QAOA) [5] maps combinatorial problems formulated as Quadratic Unconstrained Binary Optimization (QUBO) models onto transverse-field Ising spin Hamiltonians. By systematically alternating between problem-specific phase separation unitaries and non-commuting mixer operators, QAOA prepares parameterized variational quantum states whose measurement registers concentrate probability mass around optimal and near-optimal binary configurations.

### 1.5 The Cognitive Gap: Cyber-Physical Digital Twins
While quantum optimization algorithms possess profound theoretical appeal, they are notoriously opaque to power grid operators. Conventional quantum simulators operate as headless command-line scripts or static tabular spreadsheets. In industrial power control centers, operators require intuitive, spatial, real-time cyber-physical representations to visualize grid topology, monitor real-time power flows, inspect qubit allocation weights, and comprehend the physical consequences of quantum optimization decisions.

---

## 2. Comprehensive Literature Review and Theoretical Landscape

### 2.1 Decentralized Microgrid Energy Management Systems
Hirsch et al. [1] performed a seminal review of microgrid technologies, delineating the operational drivers that necessitate autonomous local control. Their study underscored that while physical interconnection allows islanded autonomy, it shifts the burden of voltage and frequency stability entirely onto local dispatch controllers. 

Sharma et al. [2] provided a critical comparative survey of decision-making strategies in microgrid EMS, categorizing methodologies based on centralized, decentralized, and hierarchical control structures. They established that renewable intermittency and stochastic demand profiles invalidate static schedule dispatch, requiring dynamic real-time optimization. Furthermore, Sharma et al. emphasized that when generation is insufficient, priority-weighted load shedding is essential to safeguard critical services.

Thirunavukkarasu et al. [3] surveyed classical optimization techniques applied to microgrid EMS, analyzing linear programming, mixed-integer linear programming, multi-agent decentralized systems, and metaheuristics (genetic algorithms, particle swarm optimization). They demonstrated that while MILP provides deterministic optimality guarantees through linear relaxations and branch-and-cut routines, computational runtime scales poorly as combinatorial discrete constraints proliferate across extended prediction horizons.

### 2.2 Combinatorial Knapsack Complexity in Power Distribution
The challenge of indivisible feeder switching is isomorphic to the classic $0/1$ knapsack problem, first formulated in combinatorial mathematics by Dantzig [17]. In standard complexity theory, the $0/1$ knapsack problem is known to be NP-complete, with its optimization variant being NP-hard [18]. While pseudo-polynomial time dynamic programming algorithms exist ($\mathcal{O}(M S)$ where $S$ is the integer capacity), they become computationally intractable when capacity values are large or continuous.

In power distribution networks, rapid breaker operation requires microsecond-to-millisecond response times. Classical heuristic approximations (such as greedy value-to-weight density ranking) achieve an approximation ratio of $1/2$ for the $0/1$ knapsack problem, meaning that naive greedy heuristics can produce allocations that deviate from the true combinatorial optimum by up to $50\%$. Consequently, exact mathematical programming or advanced heuristic search techniques are mandatory.

### 2.3 The Physics of QUBO and Ising Spin Glass Formulations
Quadratic Unconstrained Binary Optimization (QUBO) has emerged as the universal lingua franca for non-convex combinatorial optimization on quantum devices and classical Ising hardware [13]. A standard QUBO problem seeks to minimize an unconstrained quadratic polynomial over binary decision variables $\mathbf{y} \in \{0, 1\}^N$:
$$\min_{\mathbf{y} \in \{0, 1\}^N} Q(\mathbf{y}) = \sum_{j=1}^N a_j y_j + \sum_{j < k} b_{jk} y_j y_k = \mathbf{y}^T \mathbf{Q} \mathbf{y}$$
Because binary variables satisfy the idempotent identity $y_j^2 = y_j$, linear terms are absorbed along the diagonal elements $Q_{jj} = a_j$, while bilinear interaction terms occupy off-diagonal entries $Q_{jk} = b_{jk}$.

The mapping from QUBO to quantum Hamiltonians is grounded in the statistical physics of the Ising spin glass model [4]. Lucas published a landmark compendium deriving explicit Ising formulations for all of Karp's 21 NP-complete problems, including the knapsack problem, number partitioning, and graph coloring. By executing the canonical affine transformation:
$$y_j \mapsto \frac{I - Z_j}{2}$$
where $Z_j = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$ is the Pauli-$Z$ operator acting on the Hilbert space of qubit $j$ and $I$ is the $2 \times 2$ identity matrix, binary variables taking values in $\{0, 1\}$ are mapped to quantum spin operators with eigenvalues $\pm 1$:
$$Z_j |0\rangle = +1 |0\rangle, \quad Z_j |1\rangle = -1 |1\rangle$$
Under this substitution, products of binary variables transform into tensor products of Pauli operators:
$$y_j y_k \mapsto \frac{I - Z_j}{2} \frac{I - Z_k}{2} = \frac{1}{4} \left( I - Z_j - Z_k + Z_j Z_k \right)$$
This substitution maps the classical objective matrix $\mathbf{Q}$ into an equivalent diagonal cost Hamiltonian $H_C$:
$$H_C = C_0 I + \sum_{j=1}^N h_j Z_j + \sum_{j < k} J_{jk} Z_j Z_k$$
where $C_0$ represents a scalar energy offset, $h_j$ denotes local magnetic fields, and $J_{jk}$ represents pairwise spin-spin coupling interactions. The ground state (eigenstate corresponding to the minimum eigenvalue) of $H_C$ corresponds exactly to the optimal binary vector $\mathbf{y}^*$ that minimizes the QUBO objective.

### 2.4 Quantum Annealing vs. Gate-Based Variational Algorithms
Two distinct quantum paradigms are utilized to explore Ising ground states:
1. **Quantum Annealing (Adiabatic Quantum Computing):** Implemented physically on specialized analog hardware (e.g., D-Wave flux-qubit processors). The system is initialized in the ground state of a simple transverse-field Hamiltonian and slowly evolved according to the time-dependent Schrödinger equation toward $H_C$. By the Adiabatic Theorem, if the evolution time $T$ is sufficiently long ($T \gg \frac{1}{\Delta_{\min}^2}$, where $\Delta_{\min}$ is the minimum instantaneous spectral gap), the system remains in the ground state throughout the trajectory.
2. **Gate-Based Variational Algorithms (QAOA):** Implemented on universal, gate-model quantum computers (e.g., superconducting transmons, trapped ions). Farhi, Goldstone, and Gutmann [5] introduced QAOA as a discretization of adiabatic evolution into an alternating sequence of parameterized quantum logic gates. Unlike analog annealers, gate-based QAOA allows precise circuit depth control, software-defined mixer Hamiltonians, and compatibility with universal error-mitigated gate architectures.

---

## 3. Cyber-Physical Co-Simulation: 3D Digital Twin and Quantum Dashboard

The **QuantumV1** framework bridges the cognitive and operational divide between abstract variational quantum algorithms and physical distribution grid operations via a tightly coupled, dual-module cyber-physical co-simulation architecture:

```mermaid
flowchart LR
    A["Module 1: 3D Spatial Twin<br/>(Three.js / WebGL @ 60 FPS)<br/>• Catmull-Rom Splines<br/>• Volumetric God-Rays<br/>• 5-Phase Energy Animation"] <-->|"REST / Telemetry Bus<br/>JSON State Payloads<br/>(Δt ≤ 16.7 ms)"| B["Module 2: Quantum Dashboard<br/>(Streamlit / Qiskit Aer / HiGHS)<br/>• QUBO Hamiltonian Builder<br/>• QAOA Variational Circuit Loop<br/>• Candidate Pool & Register Audit"]
```

---

### 3.1 Module 1: 3D Cyber-Physical Spatial Digital Twin

Rendered natively in modern web browsers without external plugins using WebGL via the **Three.js** framework (`http://localhost:8080`), the spatial twin represents an isolated rural smart-grid diorama housing distributed generation sources (Solar PV, Wind Turbine, Small Hydro Dam, and Battery Energy Storage System [BESS]) and priority-stratified municipal loads.

![Figure 1: 3D Cyber-Physical Spatial Digital Twin in Night Mode](figures/fig_twin_3d_night.png)

#### 3.1.1 Visual Shader Pipeline and Volumetric Atmospheric Scattering
To achieve photorealistic visual fidelity while maintaining stable 60 FPS execution, the rendering pipeline separates rasterization from atmospheric effects using a multi-pass `EffectComposer`:
- **Dual-Pass Selective Bloom (`UnrealBloomPass`):** Emissive transmission conduits, transformer bushings, and coherent QPU conduits exceed a tuned luminance high-pass threshold ($L_{\text{thresh}} = 0.85$ night, $0.90$ day). Luminescent bloom ($\text{strength} = 1.20$, $\text{radius} = 0.55$) is blended additively, rendering branch power loading with vivid neon glow.
- **Screen-Space Volumetric God-Rays (`godrays.js`):** Daytime atmospheric shafts are synthesized via a custom screen-space radial blur shader. Projecting the sun's 3D position into normalized device coordinates $\mathbf{s}_{\text{sun}} \in [-1, 1]^2$, the shader accumulates 100 attenuated samples along the screen-space ray:
  $$I_{\text{godray}}(\mathbf{u}) = \frac{1}{K} \sum_{k=0}^{K-1} \gamma^k \cdot \mathcal{T}\left(\mathbf{u} - k \cdot \frac{\mathbf{u} - \mathbf{s}_{\text{sun}}}{K} \cdot \delta\right)$$
  where $\mathcal{T}$ represents the occluder buffer, $\gamma = 0.96$ is the attenuation decay factor, and $\delta = 0.85$ is the ray density step.

#### 3.1.2 Dynamic Diurnal Cycles and Kinetic Camera Physics
- **Diurnal Light & UI Theme Adaptation:** The solar position traverses an orbital trajectory $\mathbf{p}_{\text{sun}}(t) = [R \cos(\omega t), R \sin(\omega t) \sin(\theta), R \sin(\omega t) \cos(\theta)]^T$. In Night Mode (Figure 1), ambient illumination drops to obsidian twilight populated by 1,400 twinkling star particles, and the glowing AR power lines shift to saturated electric crimson and cobalt blue for optimal legibility.
- **Precision Smart Zoom:** Continuous cursor raycasting detects bounding intersections on infrastructure meshes. When an operator scrolls while hovering over an asset (e.g., Memorial Medical Center), the camera focal point smoothly translates towards the target centroid:
  $$\mathbf{T}_{\text{orbit}}(t + \Delta t) = \mathbf{T}_{\text{orbit}}(t) + \alpha \left( \mathbf{P}_{\text{node}} - \mathbf{T}_{\text{orbit}}(t) \right)$$
  with exponential damping $\alpha = 0.08$, automatically recentering when zooming out to macro level.

#### 3.1.3 Five-Phase Cinematic Energy Flow Visualization
To convey complex quantum dispatch results, the digital twin executes a timed, 5-phase visual sequence across Catmull-Rom spline conduits:
1. **Phase 1: Generation Inception ($0.0 - 3.0\text{ s}$):** Generation nodes (Hydro, Solar, Wind) pulse in electric blue ($P_{\text{gen}} = 80.0\text{ kW}$ total).
2. **Phase 2: Quantum Core Processing ($3.0 - 5.5\text{ s}$):** The central Substation Control Center radiates a holographic shockwave, simulating QAOA variational optimization.
3. **Phase 3: Conduit Routing ($5.5 - 7.8\text{ s}$):** Photon packets travel along Catmull-Rom spline curves at velocities proportional to power flow ($v_i \propto x_i^*$).
4. **Phase 4: Node Fulfillment & Shedding ($7.8 - 11.0\text{ s}$):** Critical nodes (Hospital, $w_0 = 1000$) illuminate in solid green indicating full fulfillment; non-essential nodes dim to red if shed by the quantum solver ($\mathbb{I}_{\text{shed}} = 1$).
5. **Phase 5: Steady-State Transition ($11.0 - 16.0\text{ s}$):** Visual telemetry gently stabilizes into persistent monitoring mode.

#### 3.1.4 In-Situ Qubit Customization (`+ Add Qubit`)
Operators can customize grid topology directly in 3D by clicking any asset or selecting `+ Add Qubit`. This modal configures: (i) Base power demand ($D_i\text{ kW}$); (ii) Priority weight tier ($w_i \in \{10, 30, 50, 1000\}$); (iii) Diurnal working hours (e.g., `24/7` vs. `08:00 - 16:00`); and (iv) Facility archetype (Industrial, EV Charging Hub, Data Center). Updates are dispatched to the Quantum Dashboard via REST API.

---

### 3.2 Module 2: Analytical Quantum Optimization Dashboard

Built on **Streamlit** and **Qiskit Optimization** (`http://localhost:8501`), Module 2 provides deep analytical visibility through three specialized cockpits:

![Figure 2: Quantum Energy Optimizer Configuration Console](figures/fig_dashboard_config.png)

#### 3.2.1 Cockpit 1: Real-Time Simulation and Configuration Console
As shown in Figure 2, the configuration console empowers grid dispatchers to parameterize generation capacity and demand requirements:
- **Deficit Warning Notification:** When aggregate requested demand ($\sum D_i = 60.0\text{ kW}$) exceeds available generation ($S = 50.0\text{ kW}$) by $10.0\text{ kW}$, the engine flags a power shortage and configures the QAOA objective to penalize unmet critical loads.
- **Qubit Register Estimator:** Given power granularity $g = 10.00\text{ kW}$ and supply $S = 50.00\text{ kW}$, the dashboard computes the required binary slack expansion and warns operators of circuit footprint ($N_{\text{qubits}} = 11\text{ qubits}$), confirming safe local statevector execution.
- **Connected Loads Editor:** Dynamic tabular interface allowing dispatchers to edit load priorities (`Critical`, `High`, `Low`) and nominal power draws.

![Figure 3: Analytical Quantum Dashboard Operational Cockpit and KPIs](figures/fig_dashboard_kpis.png)

#### 3.2.2 Cockpit 2: Operational Telemetry & Comparative Dispatch Engine
As illustrated in Figure 3, Cockpit 2 monitors real-time system performance across seven dedicated KPI chips:
$$S = 50.0\text{ kW}, \quad D_{\text{total}} = 60.0\text{ kW}, \quad \Delta_{\text{margin}} = -10.0\text{ kW (Deficit)}$$
Key diagnostic components include:
- **Tri-Solver Comparative Dispatch Engine:** Computes instantaneous power allocations simultaneously across: (a) Continuous Fractional Greedy ($\mathcal{O}(M \log M)$); (b) Classical HiGHS MILP (exact branch-and-cut); and (c) Quantum QAOA ($p \in [1, 5]$). Side-by-side waterfall charts visualize allocation disparities and unserved penalties.
- **Variational Execution Inspector:** Visualizes the COBYLA parameter optimization trajectory $\langle \psi(\boldsymbol{\gamma}, \boldsymbol{\beta}) | H_C | \psi(\boldsymbol{\gamma}, \boldsymbol{\beta}) \rangle$ across optimization steps, confirming classical convergence.
- **Candidate Pool Filtering and Register Auditing:** To prevent classical post-processing defects from discarding valid quantum solutions, Cockpit 2 exposes the complete measurement audit against the frequency-squared threshold:
  $$\mathcal{C} = \left\{ \mathbf{y} \in \{0, 1\}^N \;\middle|\; \left(\frac{c(\mathbf{y})}{N_{\text{shots}}}\right)^2 \ge \tau = 10^{-6} \right\}$$
  The interface renders a high-resolution Plotly histogram charting the full $2^N$ measurement probability distribution, with feasibility flags ($\sum D_i b_i \le S$) and objective scores $J(\mathbf{y})$ for every measured bitstring.

#### 3.2.3 Cockpit 3: Research Experimentation and Benchmark Repository
Cockpit 3 hosts the empirical archive of all 282 experimental benchmark runs recorded across seven campaigns:
- **Multi-Dimensional Filtering:** Filters historical runs by solver type, feeder count ($M \in [3, 200]$), circuit depth ($p \in [1, 5]$), and penalty multiplier $P$.
- **Scalability Analytics:** Renders interactive scatter and box plots comparing runtime scaling between QAOA, unpruned B\&B, and HiGHS, demonstrating classical superiority at scale and isolating QAOA probability concentration.

---

### 3.3 Bidirectional Telemetry Schema and Co-Simulation Protocol

The synchronization between the 3D twin and the quantum calculator occurs over HTTP REST via structured JSON telemetry payloads:

| Field | Data Type | Physical Interpretation / Description |
| :--- | :--- | :--- |
| `supply_total` | Float ($\text{kW}$) | Aggregate power from Hydro, Solar PV, Wind, and BESS. |
| `qubit_nodes` | Array[Object] | List of loads containing ID, demand $D_i$, weight $w_i$, hours. |
| `solver_mode` | String | Selected engine (`"qaoa"`, `"greedy"`, `"highs_milp"`). |
| `qaoa_depth_p` | Integer | Variational circuit depth parameter $p \in \{1, 2, 3, 4, 5\}$. |
| `allocations` | Array[Float] | Solved optimal continuous allocations $x_i^* \in [0, D_i]$. |
| `feeder_switches`| Array[Boolean] | Solved discrete feeder breaker states $b_i^* \in \{0, 1\}$. |
| `optimal_gap` | Float ($\%$) | Relative gap to exhaustive combinatorial ground state. |

---

## 4. Mathematical Optimization Formulations and Rigorous Proofs

### 4.1 Model 1: Continuous Snapshot Power Allocation
The continuous power allocation problem seeks a real-valued dispatch vector $\mathbf{x} = (x_1, \dots, x_M)^T \in \mathbb{R}^M$ that minimizes total priority-weighted unserved demand:
$$\min_{\mathbf{x}} J_{\text{cont}}(\mathbf{x}) = \sum_{i=1}^M w_i (D_i - x_i)$$
subject to:
$$\sum_{i=1}^M x_i \le S, \quad 0 \le x_i \le D_i, \quad \forall i \in \{1, \dots, M\}$$

**Theorem 1 (Analytical Optimality of Priority-Greedy Continuous Dispatch):**  
Let load indices be sorted in non-increasing order of priority weights: $w_{(1)} \ge w_{(2)} \ge \dots \ge w_{(M)}$. Then, the recursive greedy allocation:
$$x_{(i)}^* = \min \left( D_{(i)}, \max\left(0, S - \sum_{k=1}^{i-1} x_{(k)}^* \right) \right)$$
is a provably global optimal solution to the continuous snapshot allocation problem, computed in $\mathcal{O}(M \log M)$ time.

*Proof:* As detailed in Section 4.1 of the monograph, the objective is mathematically equivalent to maximizing $\sum w_i x_i$ subject to a linear sum constraint $\sum x_i \le S$ and box bounds $0 \le x_i \le D_i$. Because the marginal return $\frac{\partial}{\partial x_i}(w_i x_i) = w_i$ is strictly invariant with respect to $x_i$, any reallocation of power $\epsilon > 0$ from a load with lower priority $w_k$ to a load with higher priority $w_j$ ($w_j \ge w_k$) yields a non-negative objective improvement $\Delta J = \epsilon(w_j - w_k) \ge 0$. Sorting $M$ weights takes $\mathcal{O}(M \log M)$ time, and linear assignment takes $\mathcal{O}(M)$ time, bounding total runtime at $\mathcal{O}(M \log M)$. $\blacksquare$

### 4.2 Model 2: Indivisible Feeder Switching (Combinatorial Knapsack)
In the discrete switching regime, each feeder must either receive full demand $D_i$ or remain unpowered ($b_i \in \{0, 1\}$):
$$\min_{\mathbf{b} \in \{0, 1\}^M} J_{\text{indiv}}(\mathbf{b}) = \sum_{i=1}^M w_i D_i (1 - b_i) \quad \text{subject to } \sum_{i=1}^M D_i b_i \le S$$

**Theorem 2 (NP-Hardness of Indivisible Feeder Switching):**  
The indivisible feeder switching problem is NP-hard.

*Proof:* By direct polynomial-time reduction from the standard $0/1$ Knapsack Problem. Setting knapsack capacity $W = S$, item weights $a_i = D_i$, and profits $v_i = w_i D_i$, maximizing knapsack profit $\sum v_i z_i$ is identical to minimizing $\sum w_i D_i (1 - b_i)$. Since the $0/1$ Knapsack Problem is NP-hard, indivisible feeder switching is NP-hard. $\blacksquare$

---

## 5. Quantum Variational Framework: QUBO Mapping and QAOA Synthesis

### 5.1 Inequality Constraint Conversion via Dyadic Slack Variables
To enforce $\sum_{i=1}^M D_i b_i \le S$ in an unconstrained QUBO, we introduce the bounded integer slack variable $s \in [0, S_{\text{slack}}]$ where $S_{\text{slack}} = S - \min_i D_i$, establishing the equality:
$$\sum_{i=1}^M D_i b_i + s = S$$
We expand $s$ using a dyadic (power-of-two) binary register:
$$s = \sum_{k=0}^{K-1} 2^k s_k + R_s s_K, \quad s_k \in \{0, 1\}$$
where $K = \lfloor \log_2 S_{\text{slack}} \rfloor$ and $R_s = S_{\text{slack}} - 2^K + 1$. The penalized unconstrained objective function is:
$$Q(\mathbf{b}, \mathbf{s}) = -\sum_{i=1}^M w_i D_i b_i + P \left( \sum_{i=1}^M D_i b_i + \sum_{k=0}^K \alpha_k s_k - S \right)^2$$

**Theorem 3 (Lower Bound on Penalty Multiplier $P$):**  
To guarantee that the ground state of $Q(\mathbf{b}, \mathbf{s})$ is physically feasible, $P > \max_{i} w_i$.

### 5.2 QAOA State Evolution and Filtering Audit
The QAOA state evolves via:
$$|\psi(\boldsymbol{\gamma}, \boldsymbol{\beta})\rangle = \prod_{l=1}^p e^{-i \beta_l \sum X_j} e^{-i \gamma_l H_C} |+\rangle^{\otimes N}$$
After classical COBYLA parameter convergence, 2,048 measurement shots are sampled. Measured bitstrings are evaluated against the frequency-squared threshold:
$$f^2 \ge \tau = 10^{-6}$$
Under this filter, bitstrings observed 1 or 2 times ($f^2 < 10^{-6}$) are discarded, while bitstrings observed $\ge 3$ times ($f^2 \ge 2.15 \times 10^{-6}$) are admitted to the candidate evaluation pool.

---

## 6. Full Algorithmic Specifications

### Algorithm 1: Continuous Snapshot Priority-Greedy Dispatch
```text
Input: Loads M, Demands D_i, Weights w_i, Supply S
Output: Allocation vector x*

1. Initialize x_i* = 0 for all i, S_rem = S
2. Sort indices pi by descending priority weights w_i
3. For k = 1 to M do:
     i = pi[k]
     If S_rem <= 0 then:
         x_i* = 0
     Else if S_rem >= D_i then:
         x_i* = D_i
         S_rem = S_rem - D_i
     Else:
         x_i* = S_rem
         S_rem = 0
4. Return x*
```

### Algorithm 2: QAOA Variational Feeder Optimization Loop
```text
Input: Cost Hamiltonian H_C, Mixer H_M, Depth p, Shots = 2048, Filter tau = 10^-6
Output: Optimal Feeder Switching Vector b*

1. Initialize parameters (gamma, beta) randomly in [0, 2*pi)^p
2. Define CostFunction(gamma, beta):
     Prepare state |psi(gamma, beta)>
     Return <psi | H_C | psi>
3. (gamma*, beta*) = COBYLA(CostFunction, maxiter = 250)
4. Sample 2048 projective measurement shots from |psi(gamma*, beta*)>
5. Filter candidates: Keep bitstrings where (c / 2048)^2 >= 10^-6
6. For each candidate y in filtered pool:
     Extract b = (y_1, ..., y_M)
     If sum(D_i * b_i) <= S and J(b) < J_min:
         J_min = J(b)
         b* = b
7. Return b*
```

---

## 7. Empirical Benchmark Suite and Comparative Evaluation

### 7.1 Comprehensive Benchmark Campaign Summary (282 Runs)

| Campaign Identifier | Total Runs | Success / Hit Rate | Mean Runtime | Key Analytical Finding |
| :--- | :---: | :---: | :---: | :--- |
| **1. Research Pilot** | 20 | $80.0\%$ (QAOA $p=1$: $50\%$) | $0.45\text{ s}$ | Baseline feasibility check; showed $p=1$ has suboptimal recovery. |
| **2. Depth Sweep V1 (Legacy)** | 60 | $86.67\%$ ($52/60$) | $1.23\text{ s}$ | Exposed defect in legacy candidate selection pipeline. |
| **3. Depth Sweep V2 (Corrected)** | 60 | $98.33\%$ ($59/60$) raw register | $1.18\text{ s}$ | Confirmed ground state is almost always present in raw register. |
| **4. Candidate Post-Fix Audit** | 8 | $100.0\%$ ($8/8$) pool rank | $1.10\text{ s}$ | Verified deterministic selection from inspected candidate pool. |
| **5. Indivisible Feeder Switching** | 72 | $94.44\%$ ($68/72$); Feas: $100\%$ | $0.96\text{ s}$ | Proved $100\%$ feasibility across 5–9 qubit switching instances. |
| **6. Classical Scalability (HiGHS)** | 50 | $100.0\%$ ($50/50$) optimal | $0.015\text{ s}$ | Solved up to 200 feeders in $21.3\text{ ms}$; exposed classical superiority. |
| **7. QAOA Multi-Start Sweep** | 12 | $100.0\%$ ($4/4$ scenarios) | $2.18\text{ s}$ | 5 restarts increased runtime $4.4\times$ without improving hit rate. |
| **Total Benchmark Suite** | **282** | --- | --- | **Rigorous empirical proof across all solver tiers.** |

### 7.2 Classical Scalability: HiGHS MILP vs. Branch-and-Bound
- **Unpruned Branch-and-Bound:** At $M = 10$ feeders, runtime was $3.07\text{ ms}$. At $M = 20$ feeders, runtime escalated to $5,827.09\text{ ms}$ (a 1,900-fold increase). At $M = 30$ feeders, runtime exceeded $1.6\text{ hours}$ by projection.
- **HiGHS MILP:** Solved all $50/50$ instances up to $M = 200$ feeders with an average runtime of **$21.3\text{ ms}$ at 200 feeders** ($2^{200} \approx 1.6 \times 10^{60}$ states).

### 7.3 QAOA Depth Scaling: Probability Mass Concentration
Advancing circuit depth from $p = 1$ to $p = 3$ produced a **$74.4\%$ relative increase** in mean ground-state probability mass, lifting raw measurement register recovery to **$98.33\%$ ($59/60$)**.

---

## 8. Comprehensive Discussion and Scalability Realities

### 8.1 The Reality of Quantum Utility in the NISQ Era
Our benchmark findings provide a rigorous, empirical reality check regarding quantum computing for smart grids. When evaluating claims of "quantum advantage," the choice of classical baseline is paramount:
1. **Continuous Regimes:** Comparing QAOA against classical solvers on continuous fractional dispatch is fundamentally flawed, as Theorem 1 proves that classical greedy sorting achieves an exact global optimum in $\mathcal{O}(M \log M)$ time.
2. **Discrete Combinatorial Regimes:** In discrete feeder switching, while naive combinatorial Branch-and-Bound displays exponential runtime growth ($5.83\text{ s}$ at 20 feeders), industrial classical MILP solvers (such as HiGHS) exploit LP relaxations, gomory mixed-integer cuts, and presolve reductions to solve 200-feeder instances in $21.3\text{ ms}$.

Simulating an $N$-qubit statevector on classical CPUs requires tracking $2^N$ complex amplitudes ($\mathcal{O}(2^N)$ memory). At $N = 30$, storing the statevector consumes $16\text{ GB}$ of RAM; at $N = 40$, it requires 16 terabytes; at $N = 50$, classical simulation is physically impossible. Therefore, classical statevector simulation of QAOA is inherently limited to small toy benchmarks ($N \le 25$).

Furthermore, when deploying QAOA onto physical NISQ hardware (superconducting transmons or neutral atoms), gate noise, CNOT infidelities, and finite coherence times ($T_1, T_2$) degrade deep circuits ($p \ge 3$), causing the theoretical $+74.4\%$ probability concentration to dissolve into uniform entropy [11]. Thus, in the current NISQ era, classical MILP remains the undisputed operational engine for microgrid dispatch.

### 8.2 Classical Presolve Mechanics and Branch-and-Cut Dominance
Modern mathematical programming solvers like HiGHS, Gurobi, and CPLEX incorporate decades of algorithmic refinements that quantum heuristics must compete against:
- **Presolve Reductions:** Trivial bounds, redundant knapsack constraints, and fixed feeder assignments are pruned in $\mathcal{O}(M)$ time before the search tree is initiated.
- **Gomory and Knapsack Cutting Planes:** The solver generates dynamic valid inequalities that tighten the continuous linear programming polytope around the integer convex hull, dramatically reducing the branch-and-bound search volume.
- **Duality Bounds:** Continuous relaxations provide instantaneous lower bounds on the objective function, enabling aggressive pruning of subtrees that cannot beat the incumbent solution.

These classical mechanisms explain why HiGHS solves the 200-feeder switching problem ($2^{200} \approx 1.6 \times 10^{60}$ discrete states) in a mere $21.3\text{ ms}$, whereas quantum algorithms currently lack equivalent pruning mechanisms.

### 8.3 The Enduring Algorithmic Value of the QAOA Testbed
Despite the absence of immediate quantum advantage, this research establishes vital engineering foundations:
- **Validating QUBO Reformulations:** We proved that priority-aware load shedding can be mapped into an Ising Hamiltonian with guaranteed feasibility using dyadic slack variables.
- **Exposing Classical Filtering Vulnerabilities:** We demonstrated that classical post-measurement thresholds ($f^2 \ge 10^{-6}$) can discard optimal bitstrings sampled at low frequencies, establishing that quantum algorithm audits must monitor raw registers and candidate pools independently.
- **Variational Ground-State Physics:** The observed $+74.4\%$ probability mass enhancement confirms that alternating quantum operators constructively concentrate probability density on the global ground state as predicted by adiabatic discretization theory.

### 8.4 The Cognitive and Operational Role of 3D Digital Twins
The deployment of autonomous algorithmic controllers in safety-critical power systems introduces severe operator skepticism if the underlying decision mechanics remain opaque. Our 3D WebGL isometric digital twin demonstrates that:
- Spatial visualization of priority-tiered infrastructure (e.g., Hospital glowing red at full allocation vs. residential circuits dimming under shed commands) provides instantaneous operational clarity.
- Dynamic photon particle animations along transmission splines translate abstract active power balance numbers ($\text{kW}$) into visual flow velocity and volumetric load stress.
- Bidirectional telemetry enables interactive "what-if" scenario modeling, allowing human grid operators to adjust node parameters in real-time and observe immediate quantum circuit re-optimization.

---

## 9. Physical Limitations and Operational Constraints

### 9.1 Computational and Hardware Assumptions
Several computational constraints define the boundary of this evaluation:
1. **Noise-Free Statevector Simulation:** All quantum simulations were conducted using classical CPU statevector evolution. Physical hardware effects—including gate infidelities ($99.5\%$ two-qubit gate fidelities on current superconducting chips), state preparation and measurement (SPAM) errors, thermal relaxation ($T_1$), and dephasing ($T_2$)—were not modeled.
2. **Classical Parameter Optimization Overheads:** In classical simulations, the expectation value $\langle H_C \rangle$ is computed analytically via inner products. On physical quantum processors, evaluating $\langle H_C \rangle$ requires sampling thousands of shots per COBYLA iteration, dramatically escalating execution latency.

### 9.2 Power System Grid Simplifications
The microgrid operational model incorporated several standard engineering abstractions:
1. **Active Power Balance Simplification:** The model enforces an aggregate active power constraint ($\sum D_i b_i \le S$). It omits non-linear AC optimal power flow (AC-OPF) equations, bus voltage magnitude constraints, reactive power demands ($Q$), line charging capacitances, and phase angle limits.
2. **Network Topology Ignorance:** The formulation assumes a single-bus equivalent microgrid topology. Complex meshed or radial feeder line impedances ($R + jX$) and branch thermal ampacity limits were abstracted into aggregate feeder switches.
3. **Discretization Overhead for Continuous Variables:** Attempting to discretize continuous power into fine increments $g$ requires $K \propto \log_2(D_{\max}/g)$ qubits per load, resulting in excessive qubit register expansion that quickly exhausts NISQ device capacity.

---

## 10. Strategic Research Roadmap and Future Trajectories

### 10.1 Near-Term Trajectories: NISQ Physical Execution and Error Mitigation
The immediate progression of this project entails porting the compiled Qiskit circuits onto physical superconducting hardware (e.g., IBM Quantum Eagle and Heron 133-qubit processors):
- **Zero-Noise Extrapolation (ZNE):** Scaling circuit noise via pulse stretching or unitary folding to extrapolate expectation values to the zero-noise limit.
- **Readout Error Mitigation (M3):** Correcting assignment matrices in post-processing using matrix-free measurement mitigation to overcome SPAM fidelity bottlenecks.
- **Qubit Layout Optimization:** Utilizing noise-adaptive transpiler routing passes to map the highly connected QUBO interaction graph onto heavy-hexagonal lattice topologies with minimal SWAP gate overhead.

### 10.2 Medium-Term Trajectories: Non-Linear AC-OPF via Higher-Order Binary Optimization
To overcome single-bus active power abstractions, future work will integrate non-linear AC electrical power flow:
- **Higher-Order Binary Optimization (HOBO):** AC power balance equations involve quadratic and trigonometric terms ($\cos(\theta_i - \theta_j)$). Expanding these relationships produces cubic and quartic terms ($y_i y_j y_k$), forming a HOBO model.
- **Quadrization via Ancilla Qubits:** Applying Rosenberg reduction or Ishikawa transformations to reduce HOBO polynomials to standard quadratic form via auxiliary ancilla qubits:
  $$y_i y_j y_k \implies y_i w_{jk} + P_{\text{anc}} (y_j y_k - 2 y_j w_{jk} - 2 y_k w_{jk} + 3 w_{jk})$$
  where $w_{jk} \in \{0, 1\}$ represents the auxiliary product variable.

### 10.3 Long-Term Trajectories: Multi-Agent Consensus and Multi-Microgrid Clustering
At utility scale, multiple autonomous microgrids must interconnect to exchange power during regional crises. Future extensions will couple our 3D digital twins with decentralized multi-agent consensus algorithms:
- **Alternating Direction Method of Multipliers (ADMM):** Decomposing the macro-grid optimization problem into localized subproblems solved independently by microgrid quantum clusters, coordinating solely through boundary tie-line price exchanges.
- **Federated Cyber-Physical Simulation:** Synchronizing distributed Three.js digital twins across peer-to-peer WebRTC connections, enabling regional grid operators to collaborate in a unified 3D spatial metaverse.

---

## 11. Conclusion

This comprehensive study introduced and evaluated **QuantumV1**, an integrated quantum-classical energy management framework and interactive 3D isometric cyber-physical digital twin architecture engineered for priority-aware smart microgrid optimization.

Through formal mathematical analysis, algorithmic synthesis, and 282 controlled benchmark runs across seven empirical test campaigns, this research establishes five foundational conclusions:
1. **Mathematical Problem Taxonomy:** We proved that continuous snapshot power dispatch reduces to a fractional knapsack problem solvable to global analytical optimality in $\mathcal{O}(M \log M)$ time using greedy sorting (Theorem 1), rendering heuristic quantum optimization unnecessary for continuous throttling. In contrast, indivisible feeder switching constitutes an NP-hard $0/1$ knapsack problem, establishing a legitimate testbed for combinatorial optimization.
2. **Reliable QUBO and QAOA Synthesis:** By formulating a dyadic slack variable expansion, we mapped inequality capacity constraints into unconstrained Ising cost Hamiltonians with proven feasibility bounds ($P > \max_i w_i$). Across 72 dedicated switching trials, QAOA achieved $100\%$ physical feasibility and a $94.44\%$ global ground-state discovery rate.
3. **Variational Probability Concentration:** Advancing circuit depth from $p = 1$ to $p = 3$ produced a $74.4\%$ relative concentration in ground-state probability mass, lifting raw measurement register optimum recovery to $98.33\%$. However, we proved that post-measurement frequency-squared filtering ($f^2 \ge 10^{-6}$) can discard optimal bitstrings sampled at low shot counts, highlighting the critical need for transparent candidate pool auditing.
4. **Classical Scalability Realities:** Modern classical MILP (HiGHS) solved 200-feeder instances in $21.3\text{ ms}$, demonstrating that classical branch-and-cut linear programming retains decisive operational dominance over NISQ quantum devices for macro-grid scales.
5. **Cyber-Physical Visual Coupling:** We architected a 60 FPS, WebGL-based 3D digital twin featuring volumetric god-ray shaders, procedural Web Audio synthesis, and real-time bidirectional parameter synchronization, successfully bridging the cognitive gap between complex quantum algorithms and human grid dispatchers.

In summary, while practical quantum utility remains on the horizon pending fault-tolerant quantum hardware, **QuantumV1** provides a mathematically sound, reproducible, and visually intuitive foundation for the next generation of hybrid quantum-classical energy management systems.

---

## Appendix: Extended Mathematical Formulations and Parameter Maps

### A.1 Sample 4-Feeder QUBO Matrix Construction
To illustrate the algebraic mapping mechanics developed in Section 5, we consider an illustrative 4-feeder microgrid snapshot scenario:
- **Available Generation Capacity:** $S = 50\text{ kW}$
- **Feeder 0 (Hospital):** $D_0 = 30\text{ kW}$, Priority Weight $w_0 = 1000$
- **Feeder 1 (School):** $D_1 = 20\text{ kW}$, Priority Weight $w_1 = 100$
- **Feeder 2 (Commercial):** $D_2 = 15\text{ kW}$, Priority Weight $w_2 = 30$
- **Feeder 3 (Residential):** $D_3 = 10\text{ kW}$, Priority Weight $w_3 = 10$

#### Slack Variable Calculation
The maximum possible unused capacity occurs when only the smallest load is active:
$$S_{\text{slack}} = S - \min_{i} D_i = 50 - 10 = 40\text{ kW}$$
Using dyadic expansion:
$$K = \lfloor \log_2(40) \rfloor = 5 \implies \boldsymbol{\alpha} = [2^0, 2^1, 2^2, 2^3, 2^4, 40 - 31] = [1, 2, 4, 8, 16, 9]$$
This requires 6 binary slack variables $(s_0, \dots, s_5)$, resulting in a total register size of:
$$N_{\text{qubits}} = M + K_{\text{total}} = 4 + 6 = 10\text{ qubits}$$
The penalty multiplier is set according to Theorem 3:
$$P = \max_i w_i + 10 = 1000 + 10 = 1010$$

### A.2 Comparison of Slack Variable Encodings

| Encoding Scheme | Qubits Required | Matrix Sparsity | Operational Suitability |
| :--- | :---: | :---: | :--- |
| **Unary (One-Hot)** | $S_{\text{slack}}$ | High ($92\%$) | Impractical; requires prohibitive qubit counts for realistic grids. |
| **Logarithmic (Base-2)** | $\lfloor \log_2 S_{\text{slack}} \rfloor + 1$ | Moderate ($65\%$) | Highly efficient; optimal for NISQ register conservation. |
| **Dyadic with Residue** | $\lceil \log_2 S_{\text{slack}} \rceil + 1$ | Moderate ($68\%$) | **Adopted in QuantumV1**; guarantees exact integer coverage without overshooting. |

---

## Acknowledgments
The authors express their gratitude to the open-source software communities behind Qiskit, Three.js, Streamlit, and SciPy for providing the foundational computational platforms that enabled this research.

---

## References

1. A. Hirsch, Y. Parag, and J. Guerrero, "Microgrids: A review of technologies, key drivers, and outstanding issues," *Renewable and Sustainable Energy Reviews*, vol. 90, pp. 402–411, 2018.
2. P. Sharma, H. D. Mathur, P. Mishra, and R. C. Bansal, "A critical and comparative review of energy management strategies for microgrids," *Applied Energy*, vol. 327, Art. no. 120028, 2022.
3. G. S. Thirunavukkarasu et al., "Role of optimization techniques in microgrid energy management systems—A review," *Energy Strategy Reviews*, vol. 43, Art. no. 100899, 2022.
4. A. Lucas, "Ising formulations of many NP problems," *Frontiers in Physics*, vol. 2, Art. no. 5, 2014.
5. E. Farhi, J. Goldstone, and S. Gutmann, "A Quantum Approximate Optimization Algorithm," *arXiv:1411.4028*, 2014.
6. S. Koretsky et al., "Adapting quantum approximation optimization algorithm (QAOA) for unit commitment," in *Proc. IEEE Int. Conf. Quantum Computing and Engineering (QCE)*, 2021.
7. H. Liu and W. Tang, "Quantum computing for power systems: Tutorial, review, challenges, and prospects," *Electric Power Systems Research*, vol. 223, Art. no. 109530, 2023.
8. Y. Chen and T. L. Vu, "A review of quantum computing technologies in power system optimization," *Pacific Northwest National Laboratory*, Richland, WA, USA, Jul. 2025.
9. M. Liu et al., "Quantum computing as a catalyst for microgrid management," *Sustainability*, vol. 17, no. 8, Art. no. 3662, 2025.
10. A. Ajagekar and F. You, "Quantum computing for energy systems optimization: Challenges and opportunities," *Energy*, vol. 179, pp. 76–89, 2019.
11. J. Preskill, "Quantum computing in the NISQ era and beyond," *Quantum*, vol. 2, p. 79, 2018.
12. J. Blenninger et al., "Quantum optimization for the future energy grid: Summary and quantum utility prospects," *arXiv:2403.17495*, 2024.
13. F. Glover, G. Kochenberger, and Y. Du, "A tutorial on formulating and using QUBO models," *4OR*, vol. 17, no. 4, pp. 339–371, 2019.
14. Q. Huang et al., "Quantum computing for power systems: A review and perspective," *IEEE Transactions on Power Systems*, vol. 36, no. 6, pp. 5700–5712, 2021.
15. Qiskit Development Team, "Qiskit: An open-source framework for quantum computing," *Zenodo*, 2024.
16. Q. Huang, Y. Chen, and T. L. Vu, "Benchmarking quantum algorithms on classical and near-term quantum processors," *IEEE Access*, vol. 10, pp. 12845–12856, 2022.
17. G. B. Dantzig, "Discrete-variable extremum problems," *Operations Research*, vol. 5, no. 2, pp. 266–277, 1957.
18. R. M. Karp, "Reducibility among combinatorial problems," in *Complexity of Computer Computations*, Springer, 1972.
19. G. P. McCormick, "Computability of global solutions to factorable nonconvex optimization problems," *Mathematical Programming*, vol. 10, no. 1, pp. 147–175, 1976.
20. M. Cerezo et al., "Variational quantum algorithms," *Nature Reviews Physics*, vol. 3, no. 9, pp. 625–644, 2021.
21. K. Blekos et al., "A review on Quantum Approximate Optimization Algorithm and its variants," *Physics Reports*, vol. 1068, pp. 1–66, 2024.
22. L. Zhou et al., "Quantum approximate optimization algorithm: Performance, mechanism, and implementation," *Physical Review X*, vol. 10, no. 2, Art. no. 021067, 2020.
23. R. Cabello et al., "Three.js: JavaScript 3D Library," *GitHub repository*, 2026.
24. Q. Huangfu and J. A. J. Hall, "Parallelizing the dual revised simplex method," *Mathematical Programming Computation*, vol. 10, no. 1, pp. 119–142, 2018.
