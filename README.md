nano-fsm
========

A minimalistic finite state machine for typescript based applications, with async/await and decorators support.

## Getting started

```bash
# Add to your dependencies using yarn
yarn add "nxtep-io/nano-fsm#master";

# Or, using NPM
npm install "github:nxtep-io/nano-fsm#master";
```

## Lifecycle

To allow a higher degree of control over your state transitions, every action and state machine has a lifecycle you can use to meet your needs.  
The lifecycle is run as follows:
- `Action.beforeTransition` (In parallel)
- `FiniteStateMachine.beforeTransition`
- `Action.onTransition` (In parallel)
- `FiniteStateMachine.onTransition`
- `Action.afterTransition` (In parallel)
- `FiniteStateMachine.afterTransition`

You can access the instance in the state machine lifecycle in `this.instance`

## Example: A simple Gate fsm

Let's define a Gate, with a simple unlocking password and 3 states: `opened`, `closed` and `locked`.

```typescript
/**
 * The Gate interface, for mapping database models for example.
 */
export interface Gate {
  password: string;
}

/**
 * The available states for a Gate in the machine.
 */
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
```

Now, we can define the available transitions between these states.

```typescript
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
```

For the unlocking mechanism, we need a password validation inside the transition.

```typescript
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
```

An action can also support many `from` states as well as multiple `to` states:
```typescript
export class ExplodeGateAction extends Action<Gate, GateState> {
  from = [GateState.CLOSED, GateState.LOCKED];

  to = [GateState.DESTROYED];
}
```

Wildcard is supported
```typescript
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


export class AlreadyExplodedGateAction extends Action<Gate, GateState> {
  from = GateState.DESTROYED;

  to = '*' as const;

  async onTransition(instance: Gate, data: TransitionData<GateState, GatePayload>): Promise<boolean> {
    throw new Error('Gate has been exploded, nothing left to do with it');
  }
}
```

Finally, our Gate State Machine can be created.

```typescript
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
```

To interact with it, instantiate a new machine mapping your models.

```typescript
const gate = new GateStateMachine({
  name: 'Mines of Moria',
  password: 'friend',
});

// You shall not pass
await gate.goTo(GateState.LOCKED);

// Unlocks the gate passing a transition payload
await gate.goTo(GateState.CLOSED, { password: 'friend' });

// Now, you shall pass
await gate.goTo(GateState.OPENED);
```

**Interrupting a transition**

There are two ways of interrupting a transition: `soft interruption` and `hard interruption`.

A soft interruption does not throw any exception, but the state never changes in the machine.

```typescript
export class LockedGateMessageAction extends Action<Gate, GateState> {
  from = '*';
  to = GateState.OPENED;

  async onTransition(instance: Gate, data: TransitionData<GateState>) {
    
    if (data.from === GateState.LOCKED) {
      this.logger.warn('Gate is locked! We need a password');

      // Interrupts the transition without throwing any exception
      return false;
    }

    return true;
  }
}
```

A hard interruption stops the transition and throws an error to the caller.

```typescript
export class LockedGateMessageAction extends Action<Gate, GateState> {
  from = '*';
  to = GateState.OPENED;

  async onTransition(instance: Gate, data: TransitionData<GateState>) {
    
    if (data.from === GateState.LOCKED) {
      // Interrupts the transition with exception
      throw new Error('Gate is locked! We need a password');
    }

    return true;
  }
}
```

## API Reference

The full library reference is available in the `docs/` directory or published in https://nxtep-io.github.io/nano-fsm.

## Changelog

* **v0.0.2**: Array of states in Action definition

* **v0.0.1**: Initial version


## License

The project is licensed under the [MIT License](./LICENSE.md).
