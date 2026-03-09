# Billing & Plans

## Plans

| | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Projects | 1 | 5 | Unlimited | Unlimited |
| RAM per service | 512 MB | 2 GB | 16 GB | Custom |
| Instances (autoscaling) | 1 | 1–5 | 1–50 | Custom |
| Outbound transfer | 5 GB/mo | 50 GB/mo | 500 GB/mo | Custom |
| Log retention | 3 days | 14 days | 90 days | Custom |
| Support | Community | Email (48h) | Email (8h) | Dedicated SLA |
| Price | Free | €29/mo | €149/mo | Quote |

All paid plans are billed monthly. Annual billing is available at a 20% discount.

## Usage-Based Charges

In addition to the base plan fee, the following are billed per usage:

- **Compute:** €0.000016 per vCPU-second above the plan's included compute hours
- **Memory:** €0.000002 per GB-second above included memory
- **Outbound transfer:** €0.08 per GB above the plan allowance
- **Build minutes:** First 500 build-minutes/month are free; €0.005 per build-minute after that

Usage is calculated hourly and invoiced at the end of the billing cycle.

## Viewing Current Usage

In the Console, go to **Billing → Usage** to see a real-time breakdown of compute, memory, transfer, and build minutes for the current billing period.

Via the API:
```
GET /billing/usage?period=current
```

## Invoices

Invoices are generated on the 1st of each month and sent to the billing email address on file. Invoices are also available in **Billing → Invoices** in the Console and via:

```
GET /billing/invoices
```

Each invoice lists line items per project and per service, so you can attribute costs to individual workloads.

## Payment Methods

TDP accepts credit cards (Visa, Mastercard, Amex) and SEPA direct debit (EU customers only). Bank transfer / purchase order is available for Enterprise plans.

## Upgrading or Downgrading

Upgrades take effect immediately. When upgrading mid-cycle, you are charged a prorated amount for the remainder of the billing period.

Downgrades take effect at the start of the next billing cycle. If your current usage exceeds the limits of the lower plan, the downgrade is blocked — you must scale down your services first.

## Free Tier Limits and Overage

The free tier does not allow overages. If you exceed the free tier's daily API call limit (10,000 calls/day) or monthly transfer (5 GB), further requests are rejected with `HTTP 429`. There are no surprise charges — you must explicitly upgrade to continue.

## Cost Alerts

Set a monthly spend alert in **Billing → Alerts**. TDP will email you when your projected spend reaches 80% and 100% of the alert threshold. You can also set a hard cap that automatically scales down services if the cap is reached.

## Cancellation

You can cancel your plan at any time from **Billing → Plan**. Cancellation takes effect at the end of the current billing period. Data (projects, services, deployments) is retained for 30 days after cancellation, after which it is permanently deleted.

## Taxes

Prices are shown excluding VAT. VAT is added at checkout based on your billing country. EU business customers can enter a VAT number to receive invoices with reverse charge applied.
