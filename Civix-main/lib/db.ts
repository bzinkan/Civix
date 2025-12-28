export type DatabaseStatus = {
  connected: boolean;
  message: string;
};

export function getDatabaseStatus(): DatabaseStatus {
  return {
    connected: false,
    message: "Database not connected in this placeholder environment."
  };
}
