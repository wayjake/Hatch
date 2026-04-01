---
title: The Marketing Site Shell
duration: 12 min
type: hands-on
---

# The Marketing Site Shell

Your SaaS has two faces: the marketing site (what visitors see) and the application (what logged-in users see). Let's build the shell that wraps both.

## The Structure

Most SaaS products follow this pattern:

| URL | What It Is | Auth Required |
|-----|-----------|---------------|
| `/` | Landing page | No |
| `/pricing` | Pricing page | No |
| `/login` | Sign in | No |
| `/signup` | Sign up | No |
| `/dashboard` | Main app | Yes |
| `/dashboard/...` | App pages | Yes |
| `/settings` | User settings | Yes |

Public pages and authenticated pages share the same codebase but have different layouts. The marketing site has a marketing header and footer. The app has a sidebar and app header.

## Layout Routes

React Router v7 handles this with layout routes. Ask your AI:

"Set up two layout routes:

1. **Marketing layout** — for public pages (/, /pricing). Include:
   - A header with the product name/logo, navigation links (Features, Pricing), and Login/Sign Up buttons
   - A footer with copyright and basic links
   - Clean, centered content area (max-width 1200px)

2. **App layout** — for authenticated pages (/dashboard, /settings). Include:
   - A sidebar with navigation (Dashboard, [your core feature], Settings)
   - A top bar with the Clerk user button
   - A main content area
   - Wrap everything in an auth check that redirects to /login if not authenticated

Update routes.ts to use these layouts."

## The Landing Page

Your landing page doesn't need to be perfect. It needs to exist. Ask the AI:

"Create a landing page for [your product name]. It should have:
- A hero section with a headline describing what the product does, a subtitle, and a 'Get Started' button
- A features section with 3 feature cards based on [your key features from user stories]
- A simple pricing section (just one plan for now, or free)
- A final CTA section

Use my moodboard direction: [describe the colors, style, and feel from your moodboard]."

Reference your moodboard when prompting. "Use neutral grays with an indigo accent color" is much better than "make it look nice."

## The Pricing Page

Even if your product is free to start, create a pricing page. It anchors the value of what you're building:

"Create a pricing page with one plan card. [Free / $X per month]. List what's included. Add a 'Get Started' button that links to /signup."

You can add more plans later. For now, one plan keeps things simple.

## Connect the Dots

Make sure:

- Clicking "Get Started" or "Sign Up" goes to `/signup`
- After signup, users land on `/dashboard`
- The dashboard shows the empty state we discussed
- The marketing header shows "Dashboard" instead of "Login" for authenticated users

## Test Both Flows

1. Visit `/` as a logged-out user → see the marketing site
2. Click Sign Up → create an account → land on dashboard
3. Visit `/` as a logged-in user → marketing site with "Dashboard" link
4. Click Dashboard → see the app with sidebar

## Commit

```bash
git add .
git commit -m "Add marketing site shell and app layout with routing"
git push
```

Your product now has a public face and an authenticated experience. It looks like a real SaaS product because it *is* a real SaaS product. The marketing site gives you something to share when people ask what you're working on.

Now let's connect it to the outside world.
