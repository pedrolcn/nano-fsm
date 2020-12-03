import FSM, { Action, TransitionData } from "../lib";

/** A gate which may or may not let travelers pass */
export interface Gate {
  /** The password used to unlock the gate */
  password: string;
}

export enum GateState {
  /** Gate is open for travelers */
  OPEN = "open",

  /** Gate is closed but unlocked. It may be opened by travelers */
  CLOSED = "closed",

  /** Gate is closed and locked, cannot be unlocked without a password */
  LOCKED = "locked",

  /** Gate is destroyed and cannot be acted upon anymore */
  DESTROYED = "destroyed",
}

export class OpenGateAction extends Action<Gate, GateState> {
  from = GateState.CLOSED;

  to = GateState.OPEN;
}

export class CloseGateAction extends Action<Gate, GateState> {
  from = GateState.OPEN;

  to = GateState.CLOSED;
}

export class LockGateAction extends Action<Gate, GateState> {
  from = GateState.CLOSED;

  to = GateState.LOCKED;
}

export class UnlockGateAction extends Action<Gate, GateState, GatePayload> {
  from = GateState.LOCKED;

  to = GateState.CLOSED;

  /**
   * Ensures the gate password is checked when unlocking.
   */
  async onTransition(instance: Gate, data: TransitionData<GateState, GatePayload>) {
    if (data && instance.password === data.payload.password) {
      return true;
    }
    throw new Error("Invalid gate password, cannot unlock");
  }
}

export class LockedGateMessageAction extends Action<Gate, GateState, GatePayload> {
  from = '*' as const;

  to = GateState.OPEN;

  async onTransition(instance: Gate, data: TransitionData<GateState, GatePayload>) {
    if (data.from === GateState.LOCKED) {
      this.logger.warn('Gate is locked! We need a password');
      return false;
    }
    return true;
  }
}

export class ExplodeGateAction extends Action<Gate, GateState> {
  from = [GateState.CLOSED, GateState.LOCKED];

  to = [GateState.DESTROYED];
}

export class AlreadyExplodedGateAction extends Action<Gate, GateState> {
  from = GateState.DESTROYED;

  to = '*' as const;

  async onTransition(instance: Gate, data: TransitionData<GateState, GatePayload>): Promise<boolean> {
    throw new Error('Gate has been exploded, nothing left to do with it');
  }
}

export interface GatePayload {
  password?: string;
}

export default class GateStateMachine extends FSM<Gate, GateState, GatePayload> {
  /* Sets the machine initial state */
  initialState: GateState = GateState.CLOSED;

  /* The available states */
  states: GateState[] = [
    GateState.OPEN,
    GateState.CLOSED,
    GateState.LOCKED,
    GateState.DESTROYED,
  ];

  /* Sets the machine available actions */
  actions = [
    new OpenGateAction(),
    new CloseGateAction(),
    new LockGateAction(),
    new UnlockGateAction(),
    new LockedGateMessageAction(),
    new ExplodeGateAction(),
    new AlreadyExplodedGateAction(),
  ];
}
