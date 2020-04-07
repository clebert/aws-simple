export function logInfo(message: string): void {
  console.info(`[${new Date().toLocaleTimeString()}] ${message}`);
}
