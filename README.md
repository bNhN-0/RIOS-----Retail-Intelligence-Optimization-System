<div align="center">

# RIOS

<strong>Retail Intelligence Optimization System</strong>

<p>A system that translates in-store customer behavior into operational and commercial decisions.</p>

<sub>From shelf interaction to business decision pipeline</sub>

<br /><br />

<img alt="Next.js" src="https://img.shields.io/badge/Next.js_16-App_Router-111111?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-Service_Layer-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Analytics_Data-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
<img alt="YOLO" src="https://img.shields.io/badge/YOLO-Behavior_Detection-111827?style=for-the-badge" />
<img alt="OpenCV" src="https://img.shields.io/badge/OpenCV-Vision_Pipeline-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" />
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-Strictly_Typed-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img alt="React Query" src="https://img.shields.io/badge/TanStack_Query-Server_State-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" />
<img alt="AI Reporting" src="https://img.shields.io/badge/AI-Reporting_+_Recommendations-0F766E?style=for-the-badge" />
<img alt="Computer Vision" src="https://img.shields.io/badge/Computer_Vision-Behavior_Detection-1D4ED8?style=for-the-badge" />

<br /><br />

<a href="https://github.com/bNhN-0/RIOS-----Retail-Intelligence-Optimization-System">Repository</a>
&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="#4-system-flow">Architecture</a>
&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="#11-run-locally">Run Locally</a>

</div>

<br />

<table align="center">
  <tr>
    <td align="center" width="33%">
      <strong>Observe</strong><br />
      <sub>Capture shelf-level customer behavior before checkout</sub>
    </td>
    <td align="center" width="33%">
      <strong>Connect</strong><br />
      <sub>Link CV events to retail analytics, inventory, and sales intelligence</sub>
    </td>
    <td align="center" width="33%">
      <strong>Decide</strong><br />
      <sub>Surface KPIs, reports, and actions inside one operator-facing interface</sub>
    </td>
  </tr>
</table>

---

## 1. System Overview

<table>
  <tr>
    <td valign="top" width="58%">
      RIOS is an end-to-end retail intelligence system built around a simple gap in most store analytics: retailers usually know <strong>what sold</strong>, but they do not know <strong>what customers considered, touched, held, removed, or ignored before purchase</strong>.
      <br /><br />
      The platform closes that gap by combining computer vision signals, application services, retail data workflows, analytics dashboards, and AI-assisted reporting into one operating layer.
    </td>
    <td valign="top" width="42%">
      <strong>System Outcome</strong>
      <br /><br />
      RIOS helps teams move from <strong>transactional reporting</strong> to <strong>behavior-aware retail decision-making</strong>.
    </td>
  </tr>
</table>

---

## 2. Why RIOS Exists

Traditional POS systems and dashboards are effective at recording completed transactions: what was sold, when, and how much.

What they usually fail to explain is lost intent before checkout.

<table>
  <tr>
    <th align="left">Blind Spot</th>
    <th align="left">Operational Consequence</th>
  </tr>
  <tr>
    <td>attention without purchase</td>
    <td>conversion opportunities remain hidden</td>
  </tr>
  <tr>
    <td>strong shelf interaction</td>
    <td>stock, pricing, or placement issues may go unnoticed</td>
  </tr>
  <tr>
    <td>weak connection between demand and behavior</td>
    <td>inventory decisions lose context</td>
  </tr>
  <tr>
    <td>slow response timing</td>
    <td>teams react after revenue has already been lost</td>
  </tr>
</table>

<br />

RIOS was designed to make pre-purchase behavior measurable and useful. It turns raw shelf activity into signals that support replenishment, assortment review, placement changes, pricing investigation, and performance monitoring.

---

## 3. Key Capabilities

<table>
  <tr>
    <td valign="top" width="50%">
      <strong>1. Behavior-Aware Shelf Intelligence</strong>
      <br /><br />
      - detects <strong>touch</strong>, <strong>hold</strong>, <strong>item removed</strong>, and <strong>no interaction</strong><br />
      - tracks shelf-level activity and interaction intensity<br />
      - supports live-feed and heatmap-style monitoring<br />
      - highlights where intent is building and where it is being lost
    </td>
    <td valign="top" width="50%">
      <strong>2. Connected Sales Analytics</strong>
      <br /><br />
      - revenue trends and product performance analysis<br />
      - category and product contribution views<br />
      - conversion-oriented comparisons between demand and purchase outcomes<br />
      - anomaly and pattern detection across time windows
    </td>
  </tr>
  <tr>
    <td valign="top" width="50%">
      <strong>3. Inventory and Replenishment Visibility</strong>
      <br /><br />
      - inventory value and assortment availability analysis<br />
      - shelf-vs-inventory ratio visibility<br />
      - product explorer and inventory snapshots<br />
      - replenishment planning and ordering workflows
    </td>
    <td valign="top" width="50%">
      <strong>4. AI Reporting Layer</strong>
      <br /><br />
      - context-aware summaries<br />
      - report generation from live dashboard state<br />
      - practical recommendations tied to observed metrics<br />
      - decision support without leaving the workspace
    </td>
  </tr>
</table>

<br />

<div>
  <strong>5. Deployment-Oriented Design</strong>
  <br /><br />
  - built around real application workflows rather than static presentation only<br />
  - structured for camera-driven retail environments<br />
  - compatible with future IoT or edge-camera deployment patterns<br />
  - designed with store operations in mind, not just model output demos
</div>

---

## 4. System Flow

<div align="center">

```mermaid
flowchart LR
    A[Camera / In-Store Feed] --> B[Computer Vision Layer]
    B --> C[Behavior Signals]
    C --> D[Application Services]
    D --> E[Retail Data Layer]
    E --> F[Operational Dashboards]
    F --> G[Insights and Recommendations]
```

</div>

RIOS is designed as an end-to-end retail intelligence system that converts physical in-store activity into decision-ready information.

### Architecture Workflow

1. Camera feeds capture shelf-facing customer activity.
2. The computer vision layer classifies behaviors such as touch, hold, item removed, and no interaction.
3. Those signals are processed through application services that normalize, aggregate, and align them with retail context.
4. The data layer connects behavior signals with inventory, performance, and business metrics.
5. Dashboard interfaces present the output in a form that supports monitoring, analysis, and action.
6. Insight workflows convert those signals into summaries, patterns, and business-facing recommendations.

### What The Architecture Enables

<table>
  <tr>
    <td valign="top" width="33%">
      <strong>Behavior to KPI Mapping</strong><br /><br />
      Interaction events can be interpreted against revenue, demand, and stock state.
    </td>
    <td valign="top" width="33%">
      <strong>Cross-Functional Visibility</strong><br /><br />
      Merchandising, operations, and inventory teams work from the same signal chain.
    </td>
    <td valign="top" width="33%">
      <strong>Faster Response Loops</strong><br /><br />
      Teams can identify missed conversion, stock pressure, or layout issues earlier.
    </td>
  </tr>
</table>

---

## 5. System Access

<div align="center">

<table>
  <tr>
    <td align="center"><strong>Frontend</strong><br /><sub>Public</sub></td>
    <td align="center"><strong>Backend API</strong><br /><sub>Private</sub></td>
    <td align="center"><strong>ML / CV Models</strong><br /><sub>Private</sub></td>
    <td align="center"><strong>Data Layer</strong><br /><sub>Private</sub></td>
  </tr>
</table>

<p>
Core backend services, model pipelines, and infrastructure are kept private to reflect real deployment constraints.<br />
System architecture and workflows are documented to provide a clear view of how RIOS operates end-to-end.
</p>

</div>

---

## 6. Tech Stack

<table>
  <tr>
    <td valign="top" width="25%">
      <strong>Frontend</strong><br /><br />
      Next.js 16<br />
      React 19<br />
      TypeScript<br />
      Tailwind CSS 4
    </td>
    <td valign="top" width="25%">
      <strong>Data UX</strong><br /><br />
      Recharts<br />
      TanStack Query<br />
      Interactive dashboards<br />
      State-driven analytics views
    </td>
    <td valign="top" width="25%">
      <strong>AI Layer</strong><br /><br />
      YOLO / Ultralytics<br />
      OpenCV<br />
      Context-based reporting<br />
      Recommendation workflows
    </td>
    <td valign="top" width="25%">
      <strong>Systems Architecture</strong><br /><br />
      Application service layer<br />
      Retail analytics workflows<br />
      Structured data handling<br />
      IoT-ready deployment path
    </td>
  </tr>
</table>

### Frontend Workspaces

<table>
  <tr>
    <th align="left">Workspace</th>
    <th align="left">Role</th>
  </tr>
  <tr>
    <td><strong>Customer Behavior Analysis</strong></td>
    <td>live vision, heatmaps, event summaries, conversion views</td>
  </tr>
  <tr>
    <td><strong>Sales</strong></td>
    <td>overview, products, trends, patterns, insights</td>
  </tr>
  <tr>
    <td><strong>Inventory</strong></td>
    <td>overview, explorer, interactive map, replenishment</td>
  </tr>
  <tr>
    <td><strong>AI Assistant</strong></td>
    <td>dashboard-aware summaries and reports</td>
  </tr>
</table>

---

## 7. Demo Surface

<div align="center">
  <p>
    Replace the preview slots below with at least one real dashboard screenshot or GIF.<br />
    A single strong visual, especially for CBA or the heatmap view, substantially improves how the system reads.
  </p>
</div>

<table>
  <tr>
    <td align="center" width="50%">
      <strong>Dashboard Preview</strong><br /><br />
      <sub>Add screenshot: <code>docs/screenshots/rios-dashboard-overview.png</code></sub>
    </td>
    <td align="center" width="50%">
      <strong>Vision / Heatmap Preview</strong><br /><br />
      <sub>Add GIF or screenshot: <code>docs/screenshots/rios-cba-vision.gif</code></sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <strong>Sales Analytics Preview</strong><br /><br />
      <sub>Add screenshot: <code>docs/screenshots/rios-sales-workspace.png</code></sub>
    </td>
    <td align="center" width="50%">
      <strong>Inventory / Replenishment Preview</strong><br /><br />
      <sub>Add screenshot: <code>docs/screenshots/rios-inventory-workspace.png</code></sub>
    </td>
  </tr>
</table>

If you want the README to render with real visuals, place assets in a `docs/screenshots/` directory and replace the placeholders above with standard Markdown image tags.

---

## 8. Data Collection

RIOS uses a **behavior-focused dataset built under real constraints**, designed to support the end-to-end decision pipeline rather than standalone object detection.

### Data Source

Due to limited access to large-scale retail datasets, the training data was **collected manually in real environments**, including Makro and similar retail store settings.

<table>
  <tr>
    <th align="left">Dataset Property</th>
    <th align="left">Detail</th>
  </tr>
  <tr>
    <td>Total source footage</td>
    <td><strong>11 videos</strong></td>
  </tr>
  <tr>
    <td>Capture setup</td>
    <td>shelf-facing perspective with real customer-like interactions</td>
  </tr>
  <tr>
    <td>Scene coverage</td>
    <td>browsing, touching, holding, product removal, and no-action intervals</td>
  </tr>
</table>

<br />

This approach prioritizes **realistic behavior patterns** over synthetic or overly controlled data.

---

### Annotation Pipeline

The dataset was annotated using **CVAT**, with a focus on behavior-level labeling.

- video footage was extracted into frame sequences
- annotation performed on **10 videos** (1 reserved for testing)
- labeling focused on meaningful interaction events rather than frame-perfect precision

The goal was to produce **stable and interpretable behavioral signals**, not just optimize benchmark performance.

---

### Behavior Classes

The dataset is structured around interaction types relevant to retail decision-making:

<table align="center">
  <tr>
    <td align="center"><strong>no interaction</strong></td>
    <td align="center"><strong>touching shelf</strong></td>
    <td align="center"><strong>holding product</strong></td>
    <td align="center"><strong>item removed</strong></td>
  </tr>
</table>

These classes were chosen to better reflect **customer intent**, rather than generic motion detection.

---

### Dataset Split

The dataset was split at the **video level** to reduce leakage across similar scenes:

<table>
  <tr>
    <th align="left">Split</th>
    <th align="left">Videos</th>
    <th align="left">Details</th>
  </tr>
  <tr>
    <td><strong>Training</strong></td>
    <td>7 videos</td>
    <td><code>banyar1-3</code>, <code>ksh1-2</code>, <code>tin1-2</code><br />9,554 images</td>
  </tr>
  <tr>
    <td><strong>Validation</strong></td>
    <td>3 videos</td>
    <td><code>banyar5</code>, <code>ksh3</code>, <code>tin3</code><br />3,024 images</td>
  </tr>
  <tr>
    <td><strong>Test</strong></td>
    <td>1 video</td>
    <td><code>banyar4</code><br />held out for final evaluation</td>
  </tr>
</table>

This split ensures the model is evaluated on **unseen sequences**, not near-duplicate frames.

---

### Why This Dataset Matters

In RIOS, the dataset is not just training input - it is the **first layer of the system**.

It enables:

- conversion of raw video into structured behavior events
- mapping of interaction signals to retail KPIs
- integration with dashboards, analytics, and decision workflows

Without this layer, the system cannot move from **observation -> interpretation -> action**.

---

## 9. Model Training and Results

The vision component was trained using a **YOLO-based pipeline (Ultralytics)**, designed to support the broader RIOS system rather than operate as an isolated model.

### Training Setup

<table>
  <tr>
    <th align="left">Training Element</th>
    <th align="left">Detail</th>
  </tr>
  <tr>
    <td>Framework</td>
    <td><strong>Ultralytics YOLO</strong></td>
  </tr>
  <tr>
    <td>Training data</td>
    <td>custom behavior dataset</td>
  </tr>
  <tr>
    <td>Epochs</td>
    <td><strong>50</strong></td>
  </tr>
  <tr>
    <td>Objective</td>
    <td>detect and classify shelf-level interaction behaviors</td>
  </tr>
</table>

<br />

The focus was on building a model that is **reliable enough for downstream analytics**, not just optimized for benchmark scores.

---

### Evaluation Results

Best performance was observed at **epoch 25**:

<table align="center">
  <tr>
    <th align="left">Metric</th>
    <th align="right">Value</th>
  </tr>
  <tr>
    <td>Precision</td>
    <td align="right">0.7269</td>
  </tr>
  <tr>
    <td>Recall</td>
    <td align="right">0.5895</td>
  </tr>
  <tr>
    <td>mAP@50</td>
    <td align="right">0.6091</td>
  </tr>
  <tr>
    <td>mAP@50-95</td>
    <td align="right">0.2525</td>
  </tr>
</table>

Validation losses at best epoch:

- `box_loss`: 2.4256
- `cls_loss`: 1.7254
- `dfl_loss`: 0.0194

---

### Observations

- visually distinct actions such as **item removed** tend to perform better
- subtle interactions such as brief touch vs hold are harder to separate
- performance is influenced by dataset size, class balance, and camera angle consistency

> **Most importantly, model quality is evaluated by how reliably it produces usable behavior signals for the system, not just raw accuracy.**

---

### Current Limitations

This model is a **functional system component**, but not production-grade.

<table>
  <tr>
    <td valign="top" width="50%">
      - limited dataset size and diversity<br />
      - class imbalance across interaction types<br />
      - sensitivity to occlusion and crowded scenes
    </td>
    <td valign="top" width="50%">
      - ambiguity between similar behaviors<br />
      - reduced generalization to new store layouts
    </td>
  </tr>
</table>

---

### Role Inside RIOS

The model is responsible for generating the **behavioral signal layer** that powers the platform.

It enables:

- shelf-level interaction analytics
- conversion-aware insights
- event-driven dashboard updates
- AI-assisted reporting and recommendations

In RIOS, model performance is meaningful only when it improves the **quality of decisions downstream**.

> The model is not the product - it is the signal generator for the system.

---

## 10. Project Structure

```text
RIOS
+-- app/
+-- features/
+-- components/
+-- lib/
+-- i18n/
+-- messages/
`-- README.md
```

### Directory Notes

<table>
  <tr>
    <th align="left">Area</th>
    <th align="left">Purpose</th>
  </tr>
  <tr>
    <td><code>app/</code></td>
    <td>defines product routes, application entry points, and user-facing flows</td>
  </tr>
  <tr>
    <td><code>features/</code></td>
    <td>groups the platform by domain areas such as behavior analysis, sales, inventory, and intelligence workflows</td>
  </tr>
  <tr>
    <td><code>components/</code></td>
    <td>contains reusable UI building blocks and dashboard composition layers</td>
  </tr>
  <tr>
    <td><code>lib/</code></td>
    <td>supports shared utilities, client-side data handling, and presentation logic</td>
  </tr>
  <tr>
    <td><code>i18n/</code> and <code>messages/</code></td>
    <td>support multilingual delivery across the interface</td>
  </tr>
</table>

---

## 11. Run Locally

### Prerequisites

- Node.js 20+
- npm

### Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

Create a `.env.local` file in the project root and provide the required project configuration for your environment.

```env
# application configuration
# add local runtime values as needed
```

3. Start the development server

```bash
npm run dev
```

4. Open the app

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

---

## 12. Challenges and Lessons Learned

### Working Across Heterogeneous Signals

RIOS brings together multiple data types with very different characteristics:

- near-real-time behavior events
- transactional sales records
- inventory state and replenishment logic
- AI-generated summaries derived from dashboard context

The challenge was not just integrating these layers, but making them coherent as a system.

This required:

- consistent naming across domains
- meaningful aggregation of events
- interfaces that preserve context from observation to analysis to action

> **The key lesson: integration is not about connectivity, it is about interpretability.**

---

### Translating Vision Output into Business Meaning

Computer vision outputs are not inherently useful to retail teams.

Labels such as *touch*, *hold*, or *item removed* only become valuable when they are tied to business outcomes.

This raised practical questions:

- what does high interaction but low conversion actually indicate?
- when does product removal signal demand vs. friction?
- how should uncertainty be expressed without confusing operators?

> **Model output is only the starting point. Value comes from how it is translated into decisions.**

---

### System Integration Under Constraints

RIOS spans multiple layers: vision, application services, analytics, and UI.

Under time constraints, the challenge was keeping these layers aligned while still delivering a usable system.

- prioritizing end-to-end flow over isolated features
- making tradeoffs on depth vs. completeness
- focusing on the parts that demonstrate real system value

---

### Product Thinking as a Constraint

Every technical component in RIOS had to justify its role in a real operational context.

> **What should a retailer do next, and why?**

This influenced:

- how data is structured
- how dashboards are designed
- how insights are surfaced
- how recommendations are framed

**The lesson: an intelligent system is defined not by its models, but by the decisions it enables.**

---

## 13. Future Directions

<table>
  <tr>
    <td valign="top" width="50%">
      <strong>Platform Evolution</strong>
      <br /><br />
      - connect live CV inference directly to streamed dashboard updates<br />
      - strengthen correlation between shelf behavior and downstream transactions<br />
      - expand alerting for low conversion, stock pressure, and placement anomalies<br />
      - support richer store maps and shelf-level digital twins<br />
      - strengthen edge-device and IoT deployment for in-store rollout
    </td>
    <td valign="top" width="50%">
      <strong>Operational Extensions</strong>
      <br /><br />
      - introduce smart alerting systems driven by sales velocity, interaction intensity, and real-time demand signals<br />
      - extend the platform to staff-facing operations, including restocking and shelf maintenance workflows<br />
      - develop a mobile interface for on-floor usage with alerts and lightweight dashboards<br />
      - introduce role-based views for store managers, merchandisers, and inventory teams<br />
      - package the reporting layer for scheduled summaries, automated reports, and executive snapshots
    </td>
  </tr>
</table>

<br />

<div>
  <strong>Model and Signal Quality</strong>
  <br /><br />
  - add benchmark datasets and evaluation metrics for behavior detection quality<br />
  - improve robustness and calibration of interaction signals
</div>

---

## 14. Project Context

RIOS reframes retail systems from **transaction tracking** to **behavior-driven intelligence**.

Most retail platforms are designed to record what happened after a purchase. That leaves a large gap before the transaction: what customers noticed, what they touched, what they held, what they removed, and what they left behind. That gap matters because many missed opportunities happen before checkout, not after it.

RIOS was built around that missing layer. By connecting computer vision outputs with dashboards, analytics, and business KPIs, the system helps retailers understand not only what sold, but also what customers considered and where intent failed to convert into action.

<table align="center">
  <tr>
    <th>This shift supports decisions around</th>
  </tr>
  <tr><td>shelf placement</td></tr>
  <tr><td>assortment planning</td></tr>
  <tr><td>replenishment timing</td></tr>
  <tr><td>demand interpretation</td></tr>
  <tr><td>conversion analysis</td></tr>
  <tr><td>store operations</td></tr>
</table>

---

## 15. Hackathon Experience

<div align="center">
  <strong>Applied Artificial Intelligence Innovation Challenge 2026 (AIIC 2026)</strong><br />
  <sub>February 2026 - March 31, 2026</sub>
</div>

<br />

<table align="center">
  <tr>
    <td align="center"><strong>Team</strong><br /><sub>Team Decipher</sub></td>
    <td align="center"><strong>Built</strong><br /><sub>Retail Intelligence Optimization System</sub></td>
    <td align="center"><strong>Focus</strong><br /><sub>Computer vision, analytics, and decision support for retail</sub></td>
  </tr>
</table>

<br />

**Contributors**

- Banyar Htet Naung (Horo)
- Tin Aung Yin (Tin)
- Pyae Sone Htut (Patrick)
- Kyaw Swar Hein

RIOS was developed during AIIC 2026 as a full-stack retail intelligence system that connects shelf-level customer behavior with analytics, inventory state, and dashboard-driven decision support. The goal was not only to detect activity in front of a product, but to make that activity useful in a business setting.

### Beyond Journey's End

The competition ended on March 31, 2026, but the project did not stop there in spirit. What remained valuable was not only the result, but the process: defining a real problem, turning incomplete ideas into a working system, and learning how to build across computer vision, application services, analytics, and product design under time pressure.

RIOS was never just a submission artifact. It became a starting point for thinking more seriously about how intelligent systems should behave in real operational environments.

---

## 16. Reflection

Building RIOS highlighted a key reality: detecting behavior is easier than making it meaningful.

Computer vision outputs like **touch**, **hold**, or **item removed** only become valuable when they are connected to business context. The real challenge was designing a system where those signals could be interpreted alongside sales, inventory, and operational KPIs in a way that supports decisions.

Another challenge was integration. RIOS spans multiple layers — vision, backend services, analytics, and UI — and aligning them under time constraints required clear tradeoffs and system-focused thinking rather than isolated feature development.

What worked well was treating the project as a **decision system**, not just a model or dashboard:
- structuring around behavior → insight → action  
- designing modules (CBA, sales, inventory) with a shared signal pipeline  
- prioritizing usability over isolated technical perfection  

The main lesson:

> Intelligent systems are not defined by model output, but by how well they support real decisions.

That direction is what makes RIOS meaningful beyond the hackathon.

---

## 17. Links

- Repository: https://github.com/bNhN-0/RIOS-----Retail-Intelligence-Optimization-System
- Frontend Demo: [Demo](https://rios-retail-intelligence-optimizati-one.vercel.app/)

---

<div align="center">
  <sub>RIOS is a systems project about making retail behavior visible, measurable, and actionable.</sub>
</div>
