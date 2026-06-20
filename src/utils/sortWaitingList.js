export function sortWaitingList(clients) {
  return clients
    .filter(c => c.status === 'waiting')
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.turn_number - b.turn_number;
    });
}
