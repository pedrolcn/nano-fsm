import { GateStateMachine, GateState } from '../lib/sample';

describe("lib.samples.GateStateMachine", () => {
  let gate;

  beforeEach(async () => {
    gate = new GateStateMachine({
      name: 'Test Gate',
      password: 'test',
    });
  })

  it("should transition to a valid state properly", async () => {
    // Start by locking the gate, a valid transition
    expect(gate.canGoTo(GateState.LOCKED)).toBe(true);
    await gate.goTo(GateState.LOCKED);
    expect(gate.state).toBe(GateState.LOCKED);
    await expect(gate.goTo(GateState.LOCKED)).rejects.toThrow(/already in \"locked\" state/ig);

    // Should enable go to OPEN, but never accomplish.
    expect(gate.canGoTo(GateState.OPENED)).toBe(true);
    expect(await gate.goTo(GateState.OPENED)).toBe(false);

    // Should not go to current state either
    expect(gate.canGoTo(GateState.LOCKED)).toBe(false);
  });

  it("should transition to a valid state with a valid payload", async () => {
    // Start by locking the gate, a valid transition
    await gate.goTo(GateState.LOCKED);
    expect(gate.state).toBe(GateState.LOCKED);

    // Now, unlock the gate properly
    expect(await gate.goTo(GateState.CLOSED, { password: 'test' })).toBe(true);
    expect(gate.state).toBe(GateState.CLOSED);

    // Open the gate!
    await gate.goTo(GateState.OPENED);
    expect(gate.state).toBe(GateState.OPENED);

    // Now, an invalid transition
    await expect(gate.goTo(GateState.LOCKED)).rejects.toThrow(/no action available/ig);
    expect(gate.state).toBe(GateState.OPENED);
  });


  it("should not transition to a valid state without a valid payload", async () => {
    // Start by locking the gate, a valid transition
    await gate.goTo(GateState.LOCKED);
    expect(gate.state).toBe(GateState.LOCKED);

    // Now, an invalid transition
    await expect(gate.goTo(GateState.CLOSED, {})).rejects.toThrow(/invalid gate password/ig);
    expect(gate.state).toBe(GateState.LOCKED);
  });

  it("should not transition unknown state ", async () => {
    expect(gate.goTo('unknonwn')).rejects.toThrow(/Invalid state/ig);
  });

  describe('allow same state', async () => {
    let gate;

    beforeEach(async () => {
      gate = new GateStateMachine({
        name: 'Test Gate',
        password: 'test',
      }, { state: GateState.OPENED, allowSameState: true });
    })

    it("should transition to the initial state properly", async () => {
      // Should go to current state
      expect(gate.state).toBe(GateState.OPENED);
      expect(gate.canGoTo(GateState.OPENED)).toBe(true);
      expect(await gate.goTo(GateState.OPENED)).toBe(true);
    });
  });

  describe('invalid initial state', async () => {
    let gate;

    beforeEach(async () => {
      gate = new GateStateMachine({
        name: 'Test Gate',
        password: 'test',
      });

      gate.initialState = 'unknown';
    })

    it("should transition to the initial state properly", async () => {
      // Should go to current state
      expect(() => gate.state).toThrow(/Invalid initial state/ig);
    });
  });

  describe('invalid initial state from constructor', async () => {
    let gate;

    beforeEach(async () => {
      gate = new GateStateMachine({
        name: 'Test Gate',
        password: 'test',
      }, { state: 'unknown' as any });
    })

    it("should transition to the initial state properly", async () => {
      // Should go to current state
      expect(() => gate.state).toThrow(/Invalid initial state/ig);
    });
  });
});
