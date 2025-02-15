export const handle = async ({ event, resolve }) => {
  if (!isRagRunning()) { // Check if service is alive
    startRagService() // Launch via child_process
  }
  return resolve(event)
} 