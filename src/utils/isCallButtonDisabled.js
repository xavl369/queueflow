export function isCallButtonDisabled(chairData, waitingClients, eventStatus) {
  if (eventStatus !== 'active') return true;
  if (!chairData || chairData.status === 'occupied') return true;
  if (waitingClients.length === 0) return true;
  return false;
}
