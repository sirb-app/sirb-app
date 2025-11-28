# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sirb is a peer-to-peer learning platform where senior university students teach junior students through collaborative content creation. Multiple students can contribute content (YouTube videos, files, text) to the same subject and chapter, creating a rich, diverse learning experience with a cohesive interface.

**Core Architecture**: Next.js 15 (App Router) + PostgreSQL (Prisma) + Better Auth + Tailwind CSS + shadcn/ui

## Development Commands

### Essential Commands
- **Development server**: `pnpm dev` (runs Prisma generate + Next.js dev with Turbopack)
- **Build**: `pnpm build` (runs Prisma generate + Next.js build)
- **Production server**: `pnpm start`
- **Linting**: `pnpm lint`
- **Code formatting**: `pnpm format`

### Database Commands
- **Seed database**: `pnpm db:seed`
- **Generate Prisma client**: `prisma generate`
- **Database migrations**: `prisma migrate dev`
- **View database**: `prisma studio`

## Code Architecture & Patterns

### Directory Organization

**Feature-based organization** (not type-based):
- `src/app/` - Next.js 15 App Router pages
- `src/actions/` - Server actions for all data mutations
- `src/components/ui/` - Reusable shadcn/ui components
- `src/lib/` - Business logic, utilities, configurations
- `src/generated/prisma/` - Generated Prisma client (custom output path)
- `prisma/` - Database schema and migrations

### File Naming Conventions

- **kebab-case** for file names: `pet-form.tsx`, `auth-form.tsx`, `canvas-manage.action.ts`
- **PascalCase** for component names: `PetForm`, `AuthForm`
- **camelCase** for utility functions and variables
- API routes prefixed with descriptive names

### TypeScript Standards

**Strict TypeScript** with the following patterns:
- Enable strict mode in `tsconfig.json`
- Use `noEmit: true` for Next.js projects
- Path aliases: `@/*` maps to `./src/*`
- **Prefer `type` over `interface`**
- Always define proper types
- Use Zod schemas for runtime validation and type inference
- Export types from dedicated `types.ts` files
- Use `z.infer<typeof schema>` for automatic type generation
- Prefer `Readonly<>` for props when possible

**Type definition pattern**:
```typescript
export type TFormData = z.infer<typeof formSchema>;

export interface ComponentProps {
  readonly children: React.ReactNode;
  className?: string;
}
```

### Component Structure

- **Server components by default** - Use `"use client"` directive only when necessary
- Functional components with hooks
- Implement `forwardRef` for components that need refs
- Always include `displayName` for forwardRef components
- Single responsibility principle
- Separate UI from business logic

### Import Organization

**Pattern** (enforced by Prettier plugins):
1. React/Next.js imports
2. External libraries
3. Internal modules (use `@/` alias)
4. Sort alphabetically within groups

Prettier automatically organizes imports via `prettier-plugin-organize-imports`.

### Styling Patterns

**Tailwind CSS v4** with component variants:

- Use `cn()` utility function for conditional classes (from `src/lib/utils.ts`)
- Implement component variants using `class-variance-authority` (cva)
- Use semantic color names (zinc, slate) for consistency
- Implement responsive design with Tailwind breakpoints
- CSS custom properties for theme values

**Component variants pattern**:
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "default-classes",
      destructive: "destructive-classes",
      outline: "outline-classes",
    },
    size: {
      default: "h-10 px-6 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-8",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});
```

### Form Handling

- **react-hook-form** with `zodResolver` for validation
- Controlled inputs with proper TypeScript types
- Implement proper error handling and display
- Handle form submission with async/await patterns
- User feedback via `sonner` toast notifications

### UI Component Guidelines

- shadcn/ui components in `src/components/ui/`
- Built on Radix UI primitives (accessibility by default)
- Implement proper ARIA labels and roles
- Use semantic HTML elements
- Ensure keyboard navigation support

## Database & Data Layer

### Prisma Patterns

- Use descriptive model names (User, Canvas, Subject)
- Implement proper relationships with foreign keys
- Include `createdAt` and `updatedAt` timestamps
- Use proper field types and constraints
- **Custom Prisma client output**: Generated to `src/generated/prisma` (not default location)

### Database Operations

- Implement proper error handling for database operations
- Use transactions when multiple operations need to be atomic
- Implement proper data validation before database writes (Zod schemas)
- Use Prisma's type-safe query builder

### Data Model Structure

**Academic hierarchy**:
- University → College → Subject → Chapter → Canvas

**Content system** (Canvas-based):
- `Canvas` - Primary content container with status workflow
- `ContentBlock` - Junction table for ordering content (enforces global sequence)
- `Video`, `File`, `TextContent` - Content types
- Content statuses: `PENDING`, `APPROVED`, `REJECTED`, `DRAFT`

**User roles**: `USER`, `ADMIN` (plus subject-specific moderators via `SubjectModerator` table)

**Progress tracking**: Enrollment → Canvas Progress → Chapter Completion

## Authentication & Security

### Better Auth Configuration

Located in `src/lib/auth.ts`:
- Email/password authentication with Argon2 hashing (`@node-rs/argon2`)
- OAuth providers: Google, GitHub
- Email verification required (via Resend)
- Password reset functionality
- Role-based access control via Better Auth admin plugin
- Session management: 30-day expiration, cookie caching enabled

### Route Protection

`src/middleware.ts` handles route protection:
- Public routes: `/`, `/subjects`, `/subjects/[subjectId]`
- Protected routes: `/dashboard`, `/profile`, `/admin/dashboard`, chapter content
- Redirects unauthenticated users to `/auth/login`
- Redirects authenticated users away from auth routes

### Security Practices

- Hash passwords using Argon2
- Implement server-side validation for all API endpoints
- Sanitize user inputs before processing
- Use environment variables for sensitive configuration
- Rate limiting for authentication endpoints (via `src/lib/rate-limit.ts`)
- Never commit sensitive information

## Server Actions Pattern

All data mutations go through server actions in `src/actions/`:
- `canvas-manage.action.ts` - Create/update/delete canvas content
- `canvas-vote.action.ts` - Upvote/downvote canvases
- `canvas-progress.action.ts` - Mark canvases as complete
- `comment.action.ts` - Create/update/delete comments
- `moderation.action.ts` - Approve/reject content submissions
- `report.action.ts` - Submit content/user reports
- `save-video-progress.action.ts` - Track video playback position

**Standard pattern**:
1. Zod schema validation
2. Authentication/authorization checks
3. Prisma database operations
4. Return typed results
5. Proper error handling with user-friendly messages

## File Storage

**Cloudflare R2** for file uploads:
- Configuration: `src/lib/r2-client.ts`
- Upload endpoint: `src/app/api/r2/`
- Max file size: `NEXT_PUBLIC_MAX_FILE_SIZE` (10MB default)

## Error Handling

- Use proper try-catch blocks for async operations
- Implement user-friendly error messages (don't expose system details)
- Log errors appropriately for debugging
- Handle edge cases gracefully
- Consistent error handling patterns across actions

## Performance & Optimization

- Use server components when possible (default in Next.js 15)
- Implement proper image optimization with Next.js Image component
- Use dynamic imports for code splitting when needed
- Use `useMemo` and `useCallback` appropriately
- Avoid unnecessary re-renders
- Denormalized vote counts on Canvas/Comment for performance

## Project-Specific Workflows

### Content Contribution Flow

1. User browses subject → chapter (public access)
2. Authentication required to view canvas content
3. "Contribute" button opens modal for content submission
4. Content enters `PENDING` status
5. Subject moderators review in-context
6. Approved content becomes visible to learners

### Moderation System

- Subject-specific moderators (separate from global admins)
- In-place moderation (moderators see pending content within actual chapters)
- Approve/reject workflow with optional moderator notes
- Email notifications for status changes (via Resend)

### Progress Tracking Levels

1. **Video progress** - Playback position (seconds)
2. **Canvas progress** - Completion per canvas
3. **Chapter completion** - Manual or auto (when all canvases complete)

## Git & Version Control

**Main branch**: `dev` (not `main`)
**Branch naming**: `username/TICKET-ID-description`

## Environment Variables

Required in `.env`:
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` - Authentication
- `DATABASE_URL` - PostgreSQL connection
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - OAuth
- `RESEND_API_KEY` - Email service
- `CLOUDFLARE_R2_*` - File storage

## Important Implementation Notes

- **Prisma client**: Custom output path `src/generated/prisma` (not default)
- **Content sequencing**: `ContentBlock.sequence` enforces global uniqueness within canvas
- **Soft deletes**: Canvas and Comment use `isDeleted` flag (not hard deletes)
- **Denormalized counts**: Vote/view counts stored directly on models (updated on mutations)
- **Email verification**: Required for registration, auto-signin after verification
- **Default server components**: Only use client components when interactivity/hooks required
