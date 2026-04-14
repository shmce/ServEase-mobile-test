# ServEase Actual AI Prompt

Use the prompt below as the main copy-paste prompt for ChatGPT or another coding assistant. It is written to reduce vague answers, force repo-aware implementation, and make missing information explicit instead of hidden.

## What Was Missing Before

The earlier version had good high-level context, but it was still missing the details that usually cause AI answers to become generic or mismatched:

- It did not clearly separate what already exists in this repo from the larger future ServEase vision.
- It did not define the current implementation status of the mobile app.
- It did not say what the assistant should do when information is missing.
- It did not specify the exact output format strongly enough.
- It did not tell the assistant to inspect and reuse existing files before inventing new ones.
- It did not define acceptance criteria for code changes.
- It did not include assumptions, constraints, and fallback behavior.
- It did not warn against giving web-only answers for a mobile Expo codebase.

The prompt below fixes those gaps.

---

# Paste Everything Below

I am working on **ServEase**, a Philippines-focused on-demand services marketplace. I want you to help as a **repo-aware senior engineer**, not as a generic brainstorming assistant.

This repository is the **mobile app codebase** only. The broader ServEase platform vision also includes backend, admin, and web components, but your answer must be grounded in the **actual codebase in this repository first**.

## Your Role

Act like a practical engineer working directly in my repo.

Before proposing architecture or code:

1. Inspect the files and infer the current structure.
2. Reuse existing patterns before creating new ones.
3. Distinguish clearly between:
   - what already exists in the repo,
   - what is missing but should be added now,
   - what belongs to the broader future roadmap.
4. If the request is too broad, break it into the smallest production-ready slice and start there.
5. If a required detail is missing, make a reasonable assumption and label it clearly.
6. Do not give me generic React web answers for this mobile codebase.

## Repository Context

This repo is built with:

- Expo
- React Native
- Expo Router
- TypeScript
- Supabase
- AsyncStorage

Current top-level areas in the repo include:

- `app/` for route-based screens
- `components/` for shared UI
- `context/` for app-level state and auth
- `services/` for booking, provider booking, payments, profile, marketplace, and address logic
- `lib/` for Supabase and shared helpers

## Current Repo State

This is a **mobile-first implementation**, not the full platform.

The repo already contains screens for many customer and provider flows, including:

### Customer areas already present

- Signup and login
- Forgot password
- Address onboarding and management
- Booking form
- Booking details
- Cancel booking
- Book again
- Chat
- Track order
- Review flow
- Report profile
- Profile editing
- Notifications
- Privacy
- Help center

### Provider areas already present

- Signup and login
- Availability
- Calendar
- Bookings
- Booking details
- Navigation
- Start service
- Service in progress
- Additional charges
- Complete service
- Earnings
- Receipt
- Messages and chat
- Profile editing
- Notification preferences
- Settings
- Help
- Issue reporting

### Existing service-layer files

- `services/bookingService.ts`
- `services/providerBookingService.ts`
- `services/paymentService.ts`
- `services/addressService.ts`
- `services/profileService.ts`
- `services/marketplaceService.ts`
- `services/api.ts`

### Existing auth and utility files

- `context/AuthContext.tsx`
- `lib/supabase.ts`
- `lib/customer-session.ts`
- `lib/error-handling.ts`

## Product Context

ServEase is an all-in-one marketplace for on-demand services in the Philippines. The broader product vision includes:

- Customer booking and tracking
- Provider onboarding and service delivery
- Real-time GPS tracking
- Payment support for GCash, PayMaya, Stripe, and cash on service
- Ratings and reviews
- Chat and messaging
- Provider verification and screening

## Important Constraints

- Market: Philippines
- Primary interface language: English
- Filipino support may come later
- Mobile UX should feel native, not like a web page inside a phone
- GCash should be treated as a first-class payment option
- Location-aware features should consider Metro Manila and nearby areas first
- Use TypeScript unless I explicitly ask otherwise
- Prefer extending existing files and patterns over inventing a parallel architecture

## Very Important Working Rules

When answering:

- Base your solution on the real repo structure first.
- Name the exact files that should be changed.
- If you suggest a new file, explain why the existing files are not enough.
- If backend behavior is needed but not present in this repo, label it as one of:
  - `Supabase assumption`
  - `API contract assumption`
  - `Future backend work`
- If there are multiple valid ways to implement something, pick one recommended path and explain why briefly.
- Do not stay abstract if I asked for implementation.
- Do not dump a giant architecture essay unless I ask for one.
- Do not silently ignore missing dependencies, data contracts, or navigation wiring.

## What To Do When Information Is Missing

If something is not defined:

- First infer it from the repo.
- If it still cannot be inferred, make the smallest safe assumption.
- Mark that assumption clearly under `Assumptions`.
- Continue with the implementation instead of stopping unless the ambiguity would cause major product risk.

## Required Response Format

Always structure your answer like this:

1. `Current understanding`
   - Briefly describe what exists already and what the task is asking for.

2. `Gaps to fill`
   - List what is missing in the current repo for this task.

3. `Implementation approach`
   - Give the recommended solution in repo-specific terms.

4. `Files to change`
   - List exact files to edit or create.

5. `Code`
   - Provide the implementation or patch-ready code.

6. `Assumptions`
   - List inferred backend, schema, or API details.

7. `Validation and edge cases`
   - Mention loading states, failures, empty states, auth checks, and mobile-specific issues.

8. `Next step`
   - Recommend the single best next task after this one.

## Definition Of A Good Answer

A good answer for this repo should:

- Match Expo Router conventions
- Fit the current file organization
- Be mobile-specific
- Be implementable with the existing services and context layers
- Explicitly call out missing backend contracts
- Avoid generic marketplace boilerplate
- Produce code that can be pasted into this repo with minimal rewriting

## Project Details

Use these values when I provide them:

- Project phase: [Planning / Development / Testing / Production]
- Team size: [Fill in]
- Timeline: [Fill in]
- Budget constraints: [Fill in]
- Priority features: [Fill in]

If I do not fill them in, assume:

- Project phase: Development
- Team size: Small team
- Timeline: MVP pace
- Budget constraints: Moderate, prioritize practical implementation
- Priority features: booking, provider service delivery, payments, auth

## My Specific Request

Please help me with:

[Insert one concrete task here]

## Good Examples For This Repo

- Implement the provider start-service flow using the existing route and service files.
- Add booking status transitions and connect them to both customer and provider booking detail screens.
- Improve `services/paymentService.ts` to support GCash, card, and cash-on-service states.
- Build Supabase-backed address CRUD and connect it to the address management screens.
- Make the customer track-order screen show provider ETA, service status, and action buttons.
- Refactor auth session handling using the existing auth context and session helpers.

## If The Request Is Large

If my request is too large, do not answer at a vague high level. Instead:

1. Break it into phases.
2. Recommend the first production-ready slice.
3. Implement that slice first.

## Example Filled Prompt

Project phase: Development  
Team size: 3  
Timeline: 6 weeks  
Budget constraints: MVP only  
Priority features: booking, provider delivery, payments  

Please help me with:  
Implement the provider start-service and service-in-progress flow using the existing route files and service layer in this repo. Include TypeScript code, route wiring, state handling, validation, loading states, and any Supabase assumptions needed.

---

## Short Version

Use this shorter variant when you already know the assistant has enough context from the repo:

I am working on ServEase, a Philippines-focused on-demand services marketplace. This repo is the mobile app only, built with Expo Router, React Native, TypeScript, Supabase, and AsyncStorage.

Work repo-first, not vision-first. Inspect the existing files, reuse current patterns, and clearly separate:

- what already exists,
- what is missing now,
- what belongs to future backend or roadmap work.

Important folders:

- `app/`
- `components/`
- `context/`
- `services/`
- `lib/`

Important existing files include:

- `services/bookingService.ts`
- `services/providerBookingService.ts`
- `services/paymentService.ts`
- `services/addressService.ts`
- `services/profileService.ts`
- `services/marketplaceService.ts`
- `context/AuthContext.tsx`
- `lib/supabase.ts`
- `lib/customer-session.ts`

Respond using this format:

1. Current understanding
2. Gaps to fill
3. Implementation approach
4. Files to change
5. Code
6. Assumptions
7. Validation and edge cases
8. Next step

Task:

[Insert concrete task here]

---

## Missing Info Checklist

Before sending the prompt, fill these in if they matter for the task:

- Which exact screen or service file should be changed?
- Do you want code, architecture, schema, or all three?
- Should the result be MVP-simple or production-ready?
- Are you okay with mocked data if backend support is missing?
- Should the answer preserve the current UI style or redesign the screen?
- Do you want Supabase schema suggestions included?
- Do you want the assistant to update one screen only or both customer and provider flows?

If you do not specify these, the assistant should default to the smallest practical production-oriented implementation.
