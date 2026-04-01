---
title: DNS with Cloudflare
duration: 8 min
type: hands-on
---

# DNS with Cloudflare

Your app is live at `your-project.vercel.app`. Let's give it a real domain.

## Buy a Domain

If you don't have a domain yet, you can buy one from:

- **Cloudflare Registrar** — at-cost pricing, no markup
- **Namecheap** — affordable, good interface
- **Google Domains** (now Squarespace) — simple

Pick a `.com` if it's available. If not, `.co`, `.io`, or `.app` work fine. Keep it short, memorable, and easy to spell.

## Set Up Cloudflare

1. Sign up at [cloudflare.com](https://cloudflare.com) (free)
2. Click "Add a Site" and enter your domain
3. Select the free plan
4. Cloudflare will scan your existing DNS records
5. It'll give you two nameservers — update these at your domain registrar

Nameserver changes can take up to 24 hours to propagate, but usually it's much faster.

## Point Your Domain to Vercel

In Cloudflare's DNS settings, add:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | DNS Only (gray cloud) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS Only (gray cloud) |

**Important:** Set the proxy status to "DNS Only" (gray cloud, not orange) for Vercel domains. Vercel handles its own SSL and CDN, and Cloudflare's proxy can interfere.

## Add the Domain in Vercel

In your Vercel project:

1. Go to Settings → Domains
2. Add your domain (e.g., `yourapp.com`)
3. Add `www.yourapp.com` as well
4. Vercel will verify the DNS and provision an SSL certificate

Within a few minutes, your app will be live at `yourapp.com` with HTTPS.

## Update Your Configs

Now that you have a real domain, update:

- **Clerk** — add your production domain to the allowed origins
- **Stripe** (when you add it) — update webhook URLs
- **`APP_URL`** in Vercel's environment variables

## What Cloudflare Gives You

Even on the free plan:

- **DNS management** — fast, reliable DNS
- **DDoS protection** — automatically blocks malicious traffic
- **SSL** — though Vercel handles this too
- **Analytics** — basic traffic insights
- **Page rules** — redirect `www` to non-www (or vice versa)

## The Professional Touch

A custom domain makes your product real. `yoursaas.vercel.app` says "side project." `yourapp.com` says "product." First impressions matter, especially when you're asking people to trust you with their data and their money.

When Becca started marketing Dubsado, having a proper domain with professional branding made a huge difference. People take you more seriously when you look like you take yourself seriously.

```bash
git add .
git commit -m "Configure custom domain with Cloudflare DNS"
git push
```

Your product has a home, a name, and an address. Let's talk about where it goes from here.
