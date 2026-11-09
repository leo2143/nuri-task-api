import chalk from 'chalk';

/**
 * Corre la operación; si tira, un reintento. El segundo fallo se re-lanza.
 */
export async function runWithOneRetry(operation, context) {
  try {
    return await operation();
  } catch (firstError) {
    console.error(chalk.yellow(`${context}: reintento`), firstError);
    try {
      return await operation();
    } catch (retryError) {
      console.error(chalk.red(`${context}: falló tras reintento`), retryError);
      throw retryError;
    }
  }
}
