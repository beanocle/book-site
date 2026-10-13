---
title: "Book Introduction"
lang: en
slug: preface
status: draft
excerpt: false
imported: 2026-10-13
---

APIs, MCP, Skills, and Browser Agents — with SAP S/4HANA as the Worked Example

## Book Introduction

### Why This Book Exists

For most of the history of enterprise software, there were two ways into a
core system such as SAP: a person working through its screens, or a program
working through its interfaces. Every integration project was a choice
between those two, and a career could be built on knowing the second one well.

That is no longer true. In the last few years, the number of ways to reach
the core has multiplied:

- A large language model can call a released API through a tool that someone
  wrapped for it, and the Model Context Protocol (MCP) has made that wrapping
  a standard instead of a one-off.
- An agent can load a Skill — a packaged set of instructions, scripts, and
  reference material — and learn how *your* organization expects a cost
  center to be created before it tries to create one.
- An agent can open a browser, log on to the Fiori launchpad, and work the
  same screens a person would, including the ones for which no API exists.
- The vendor itself now ships agents into the core, so some of the "external"
  automation you were planning to build may already be running inside it.

None of these replaces the others. A real landscape ends up using several of
them at once, often against the same business object. This book is about that
situation: one core system, many ways in, and the engineering and governance
needed to keep the result trustworthy.

### Core Thesis

The core holds the truth. AI multiplies the ways in. Every way in must end in
the same validation.

The original idea behind this book still stands, and it now applies to every
channel rather than to one:

> Intent → Validation → Core Truth

Intent may come from a person filling in a form, a batch file, an application,
or an agent that was asked a question in plain language. It does not matter.
A business record becomes real only when the core system has validated it and
recorded it. Systems are defined not by where the logic is written, or by who
— or what — typed the request, but by where truth is validated and recorded.

Three consequences follow, and the rest of the book is built on them:

1. **Choose the channel by its contract, not by its novelty.** A released API
   has a typed, versioned contract. A screen has none. An agent driving a
   screen inherits the screen's lack of a contract, however clever the agent is.
2. **Most AI channels are not new roads into the core.** MCP tools and Skills
   sit *on top of* released interfaces. They change who calls the interface and
   how the call is decided on. They do not change what the core will accept.
   Browser and GUI agents are the exception: they reach the core through its
   screens, which makes them the most direct way to use what is already there
   and the riskiest way to write.
3. **Governance belongs to the object, not to the channel.** Segregation of
   duties, approvals, and audit evidence for a cost center must hold whether
   the change arrived through a web form or through an agent. If each channel
   has its own rules, the weakest channel sets the real rule.

### Two Questions About a Product You Did Not Build

A packaged system such as S/4HANA was built by someone else. You adopt it,
configure it, and live with its releases. For a product like that, AI raises
two different questions, and this book answers both.

**How does AI change the way the product's existing functions are used?** The
functions stay what they are; who operates them changes. An AI can open the
product's web pages and work them the way a person does. The way experienced
staff actually use the system — the sequence of screens, the checks they make,
the exceptions they know — can be distilled into procedures an AI can follow. A
question in plain language can replace a path through five menus. Nothing in the
product changes, and yet the way it is used does.

**When the product falls short, how should the gap be filled?** Every packaged
system leaves gaps. They can be closed in several ways, from adopting the
standard process, through configuration and extensions inside the core, to an
application beside it, an integration, or automation of its screens. AI makes
the lower, more expensive rungs of that ladder cheap — a side-by-side
application that once took months can now be built in weeks. The question is
therefore no longer whether a gap can be filled, but whether it should be, and
on which rung.

The channels in the map below are the means for both. Each channel chapter says
which of the two questions it answers. The main case in Part Two answers the
second; most of Part Four answers the first.

### Why SAP, and One Case per Channel

SAP S/4HANA, and its Cloud Public Edition in particular, is the clearest
example of the situation this book describes. The core is standardized and
upgraded on SAP's schedule. Modifying it is restricted or impossible (clean
core). The vendor publishes released APIs, ships its own AI assistant (Joule),
and expects extensions to live outside the core. Every channel in this book
exists for SAP today, and each one has visible limits.

The patterns are not specific to SAP. Any core system of record — another ERP,
a core banking platform, a hospital information system — faces the same
choice of channels. SAP is the worked example because it makes the trade-offs
concrete.

Each channel is shown through a case of its own, chosen because that channel
is the natural fit for it. Forcing every channel onto the same task would
make the comparison look tidy and the examples look artificial.

The main case is the one this book was built on: cost center master data,
maintained through released interfaces by a side-by-side application. It is
the primary way of working with the core today, and it is the book's full
implementation, from interface discovery to audit evidence. Cost centers were
chosen because they are small enough to explain completely, they are governed
(they carry ownership, approvals, and validity periods), and errors in them
surface in every financial report downstream. The newer channels build on
what this case establishes, so it comes first and takes the most space.

### A Map of the Ways In

The book sorts the channels by two questions: *who acts* (a person, a program,
or an agent), and *what contract the core offers* to whoever acts.

| Channel | Who acts | Contract with the core | Maturity | Covered in |
| --- | --- | --- | --- | --- |
| Native UI (Fiori, SAP GUI) | Person | Screens and their checks | Baseline | Part One |
| Released interfaces (OData, SOAP, RFC/BAPI) | Program | Typed, versioned, supported | Primary | Part Two (main case) |
| Events, data replication, files, mail | Program | Asynchronous messages | Established | Part Four |
| Vendor agents (Joule, Generative AI Hub) | Vendor-hosted agent | Defined by the vendor | Emerging | Part Four |
| MCP tools | Agent | The interface the tool wraps | Emerging | Part Four |
| Skills | Agent | None of its own: it is know-how about other channels | Emerging | Part Four |
| Browser and GUI agents, RPA | Agent or robot | Screens, with no interface contract | RPA established, AI agents emerging | Part Four |

Read the table from top to bottom and the contract gets weaker while the
flexibility gets greater. Most of the engineering judgment in this book is
about where on that scale a given task belongs.

### How the Book Is Organized

The book moves from understanding, to building, to governing, to extending.
Each part assumes the one before it.

#### Part One — Foundations: Understanding the Core

- *The Core and the Ways In.* Enterprise systems, the finance focus, and why
  anyone building around the core — including an agent — has to understand
  the landscape first.
- *Living With the Core.* The Cloud Public Edition, its landscapes, roles and
  identity services, and the release cycle that every channel has to
  survive.
- *The Main Case: Cost Centers.* Cost centers and their groups, the master
  data lifecycle, where the standard frontend and Joule are enough, and how to
  investigate the attributes that matter.
- *Principles: Truth Lives in the Core.* Why to build beside the core, System
  Interface First, why released interfaces are the safe default, and how to
  choose between channels.

#### Part Two — The Main Channel, Step by Step

The main case, built out in full and backed by a working implementation.
Each chapter ends with something that runs.

- *Discovering the Interfaces.* Confirming the release and the connection
  type, finding and reading the BAPI, and what to do when the BAPI is not the
  path you ship.
- *Setting Up the Environment.* The NetWeaver RFC SDK, its runtime
  dependencies, PyRFC, and the first handshake.
- *First Read: From Smoke Test to Schema.* Reading one cost center, then
  designing the local schema around SAP's data model.
- *First Write: Intent, Check, Commit.* Recording a write intent, validating
  it through a dry run, and committing it explicitly.
- *The Application: Frontend, Backend, and Excel.* Keeping the user
  interface, the API, and spreadsheet imports aligned on one field definition.
- *Evidence, Audit, and Beyond Cost Centers.* The minimum evidence set, proving
  that a change landed, and applying the blueprint to other master data.

#### Part Three — Governance and Management

This part covers the governance that must hold for a business object whatever
channel a change arrives through, and what governance alone cannot provide:
how to run a project in which people and AI agents work together.

- *Ownership, Approvals, and Segregation of Duties.* Governance readiness,
  decision rights, and approval rules a system can enforce.
- *Scope, Rules, and Change Control.* What may live outside the core, how
  capabilities are admitted, how policy becomes enforceable rules, and how
  change classes link to evidence.
- *When the Actor Is an Agent.* Agent identity and authorization, whether an
  agent may approve, and how evidence records which agent acted for whom.
- *Managing Requirements for a Product You Did Not Build.* Why requirements
  for a packaged system are questions about gaps, how each one is decided onto
  a rung of the gap-filling ladder, how requests to the vendor are tracked and
  later retired, and where projects of this kind stumble.
- *Running a Project With People and AI.* What changes when AI does much of the
  implementation: where the bottleneck moves, how work is planned, decided, and
  verified, and which dependencies no AI can resolve.
- *Humans and AI on One Team.* What to delegate and what never to, how
  corrections become lasting rules, how several AI sessions work together, and
  how to review what they produce.
- *The Platform for Building and Running With AI.* The environment in which
  AI helps build the system — sessions, rules, checks, environments, and
  deployment — and the platform on which AI features themselves run: model
  providers and their data terms, gateways, keys, usage, and where MCP servers
  live.

#### Part Four — New Channels in the Age of AI

Each chapter takes one channel and a case chosen for it.

- *Before Agents Touch the Core.* What large language models can and cannot be
  trusted with, SAP's Generative AI Hub and Joule, and what happens when
  nobody decides how AI is connected.
- *MCP: Exposing the Core as Tools for Agents.* Wrapping released interfaces as
  tools, separating read tools from write tools, and vendor-provided versus
  self-built servers.
- *Skills: Packaging Core-System Know-How for Agents.* How a Skill differs from
  a tool, turning rules and procedures into Skills, and reviewing them like
  code.
- *Agents at the Screen: Browser and GUI Automation.* When no interface exists,
  why this channel has the weakest contract, and the exit plan back to a
  released interface.
- *Events, Data, and the Rest of the Network.* Business events, replication,
  files and mail, and a closing look at combining channels against one object
  without letting the weakest one set the rules.

### Who Should Read This Book?

This book is for people who build on, connect to, or automate a core system,
with SAP as the example.

**SAP consultants and developers** — functional and technical — who know the
core well and want to understand how AI changes the ways it is used, without
giving up what they know about master data, transactions, and controls.

**Integration and full-stack developers** who already build against SAP APIs
and want to decide when an MCP server, a Skill, or a browser agent is the
right addition, and when it is not.

**AI and agent developers** who are asked to "connect the agent to SAP" and
need to understand what the core will and will not accept, and why the answer
is not simply "give it the API."

**Architects and governance owners** who have to approve these channels and
answer for them in an audit.

The style guide assumes a reader who understands cost centers but has not
necessarily written integration code. A technical background helps but is
not required for Parts One and Three.

### What This Book Is Not

It is not an accounting textbook, a complete guide to SAP's product range,
or an introduction to machine learning. It does not try to keep up with every
new agent framework; tools in this area change quickly, and product names
are checked at the time of writing. What it offers is a way to judge any new
channel that appears after the book is printed: who acts, what contract the
core offers, and whether the governance of the object still holds.

### What You Will Build

From the main case, you will build a complete side-by-side application for
cost center master data that:

- Accepts requests via CSV, XLSX, or web forms
- Validates them against a rule catalog and a dry run in SAP
- Routes them through approvals that respect segregation of duties
- Posts through released interfaces with explicit commit and rollback
- Records evidence per row, per batch, and per object, so that every change
  can be answered for in an audit

This is not a prototype. It is a production-ready blueprint.

From each of the newer channels, you will work through a case chosen for that
channel, showing what it does well, where its contract with the core ends, and
what has to be added so that it can be governed to the same standard as the
main case.

### Final Note

New ways into the core will keep appearing. The test for each one stays the
same: does the intent still end in the core's validation, and does the
governance of the object still hold? This book does not offer shortcuts. It
offers a method for answering that question, practical enough for production.
