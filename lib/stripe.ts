export type StripeStatus = {
  enabled: boolean;
  message: string;
};

export function getStripeStatus(): StripeStatus {
  return {
    enabled: false,
    message: "Stripe integration is not configured in this scaffold."
  };
}
