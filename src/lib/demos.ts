export interface DemoExample {
  id: string;
  label: string;
  blurb: string;
  expectedRisk: "low" | "medium" | "high" | "critical";
  text: string;
}

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: "paypal-lookalike",
    label: "PayPal lookalike",
    blurb: "Brand mismatch + typosquat domain",
    expectedRisk: "critical",
    text: `Subject: Action Required: Your PayPal account has been limited!

Dear Customer,

We detected unusual activity on your PayPal account. To avoid permanent suspension, you must verify your identity within 24 hours.

Confirm your account here:
https://paypa1-secure-login.com/verify?user=alert

Thank you,
PayPal Security Team`,
  },
  {
    id: "urgent-sms",
    label: "Urgent bank SMS",
    blurb: "Pressure tactics + shortener",
    expectedRisk: "high",
    text: `ALERT from Chase: Your debit card was locked due to suspicious charges. Unlock immediately or your account will be closed: https://bit.ly/chase-unlock-now

Reply STOP to opt out.`,
  },
  {
    id: "redirect-chain",
    label: "Package scam",
    blurb: "Delivery bait + odd TLD",
    expectedRisk: "high",
    text: `USPS: Your package is held at the depot. Pay a $1.99 redelivery fee today or it will be returned.

Track & pay: http://usps-fee-payment.xyz/track/991283

— Automated Shipping Notice`,
  },
  {
    id: "clean-newsletter",
    label: "Clean newsletter",
    blurb: "Legitimate-looking, low risk",
    expectedRisk: "low",
    text: `Hi Alex,

Thanks for subscribing to the weekly engineering digest from Stripe.

Read this week's issue:
https://stripe.com/blog

Prefer fewer emails? Update preferences in your dashboard.

— The Stripe team`,
  },
  {
    id: "microsoft-impersonation",
    label: "Microsoft password reset",
    blurb: "Impersonation + credential ask",
    expectedRisk: "critical",
    text: `Microsoft Account

We received a request to reset your password. If you did not request this, your account may be compromised.

Enter your password and one-time code here to cancel the reset:
https://microsft-account-support.top/security/reset

This link expires in 15 minutes. Act now!!!

Microsoft Security`,
  },
];
