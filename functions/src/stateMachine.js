const VALID_TRANSITIONS = {
  waiting:  ['called'],
  called:   ['attending', 'absent'],
  attending: ['finished'],
  absent:   ['waiting'],
  finished: [],
};

function validateTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed) {
    throw new Error(`Unknown status: ${currentStatus}`);
  }
  if (!allowed.includes(nextStatus)) {
    throw new Error(
      `Invalid transition: ${currentStatus} -> ${nextStatus}. Allowed from ${currentStatus}: [${allowed.join(', ')}]`
    );
  }
}

const VALID_EVENT_TRANSITIONS = {
  inactive: ['active'],
  active:   ['closed'],
  closed:   [],
};

function validateEventTransition(current, next) {
  const allowed = VALID_EVENT_TRANSITIONS[current];
  if (!allowed) {
    throw new Error(`Unknown event status: ${current}`);
  }
  if (!allowed.includes(next)) {
    throw new Error(`Cannot transition event from ${current} to ${next}`);
  }
}

module.exports = { VALID_TRANSITIONS, validateTransition, validateEventTransition };
