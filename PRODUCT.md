# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Prospective clients** (primary): owners of independent businesses who want a new website or a redesign. They usually arrive with a loose idea, a few images and some sites they admire, not a finished spec. Their job is to explain their business and wish list well enough to get a tailored proposal, without needing an account or making a commitment.

**Active clients**: people who have already sent a brief and come back to check where their project stands. They use a project code or emailed link and need reassurance and next steps more than detail.

**The studio owner** (admin): the one designer who reads incoming briefs, triages them by status, downloads uploaded files, takes notes and moves each project through its stages.

*Open decision:* the target client segment is not settled. The landing copy says "independent businesses" in general, while the brief's options (bookings, rooms, local guide, Stay page) lean towards hospitality and stays. Future work should not narrow or broaden the audience without asking.

## Product Purpose

Goodform is a **fictional portfolio piece**: a complete, working concept for a one-person web studio that turns a hesitant enquiry into a structured project brief. It shows the whole client journey end to end: a persuasive landing page, a guided brief, a client-facing status page and a studio-side inbox.

Success means the experience is credible enough to stand in for a real studio: a visitor would feel able to start the brief, the brief collects everything a proposal needs, and the admin side would really work for running a small practice.

## Positioning

A single designer, start to finish, with no handoffs or agency layers. The difference is in the mechanism, not just the claim: a **guided brief that accepts uncertainty**. Every major choice offers "I'm not sure—help me decide", inspiration can be skipped and added later, and sending the brief is framed as a conversation starter, not a commitment. It is followed by a visible, plain-language project timeline.

## Operating Context

- **Landing page** (`#/`): marketing for the studio, leading to "Start your brief".
- **Guided brief** (`#/brief`): four steps (Your business → Your website → Your inspiration → Review & send). It takes about 8–10 minutes, needs no account, and saves a draft automatically in the browser. Uploaded files are dropped from the draft on refresh.
- **Project page** (`#/project`): reached by a project code (`GF-` + 6 characters) or an emailed sign-in link. It shows a four-stage timeline: received → in review → proposal → in progress.
- **Studio admin** (`#/admin`): sign-in with email and password, or Microsoft (PKCE). It lists briefs with search, a status filter and metrics. It also covers brief detail, notes, file download (one at a time or as a ZIP) and a print-friendly view. Statuses: New, In review, Awaiting reply, Proposal sent, In progress, Delivered, Archived.
- Promised rhythm: a reply within 2 working days, a tailored proposal with a fixed project price, and builds that usually take 4–8 weeks.

## Capabilities and Constraints

- React 18 + Vite single-page app with hash routing. Icons come from lucide-react. Fonts load from Google Fonts.
- Supabase backend: the `briefs` table, the `brief-files` storage bucket, and auth. The publishable key lives in the browser, with RLS governing access. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Deployed to GitHub Pages via GitHub Actions on push to `main`, under a repository subpath (`VITE_BASE`).
- Currency is GBP and the copy is British English (colour, enquiry, organise).
- Stated pricing: new websites from £3,500 and redesigns from £2,500. The budget bands in the brief run £3,500–£12,000+. These are part of the fiction and are not real offers.

## Brand Commitments

- Name: **Goodform** (Goodform Studio). Sign-off line: "Small by design."
- Voice: first person singular ("I", "me"), warm, plain and reassuring. Short declarative pairs ("Good questions. Straight answers.", "No handoffs. No agency layers."). Low pressure throughout: "No account. No pressure. A real conversation."
- The persona **Alex Morgan, Bristol, UK** and **hello@goodform.studio** are fictional stand-ins within the concept.

## Evidence on Hand

- Images in `public/images/` (countryside, courtyard, forma, common-ground, modern-house, kip, portrait) are illustrative stock for the concept.
- **Everything shown as proof is placeholder**: the case studies (Forma Architecture, Common Ground, Fieldwork Stays), the testimonials (Sarah Ellis, Jamie Chen), the result figures (+42% orders, +38% direct enquiries) and the "Booking for January 2027" availability. Future work may keep or restyle these as clearly fictional portfolio content. It must not add new clients, metrics, reviews or press, or present any of it as verified real-world results.

## Product Principles

1. **Uncertainty is welcome.** Never make a client feel they need a finished plan; every hard choice has a "help me decide" exit.
2. **Low commitment, high clarity.** No accounts, no pressure, and a clear statement of what happens next and when.
3. **One person, start to finish.** The product should feel like dealing with a single thoughtful human, not a system or an agency.
4. **Real workflow, not a mock.** The brief, project page and admin must actually work end to end. Portfolio polish never replaces function.
5. **Honest proof.** Placeholder evidence stays recognisably illustrative; no fabricated claims are added.

## Accessibility & Inclusion

No product-specific standard was set. The current code uses `aria-pressed` on choice chips, `aria-expanded` on the FAQ and labels on icon-only buttons, which gives a baseline to keep.
