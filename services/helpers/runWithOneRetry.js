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

/**
 * Si el ResponseModel no es success, reintenta `retryFn`. Devuelve el último resultado.
 */
export async function ensureSuccessWithRetry(firstResult, retryFn, context) {
  if (firstResult?.success) {
    return firstResult;
  }

  console.error(chalk.yellow(`${context}: reintento`), firstResult?.message);

  const retryResult = await retryFn();
  if (!retryResult?.success) {
    console.error(chalk.red(`${context}: falló tras reintento`), retryResult?.message);
  }
  return retryResult;
}
