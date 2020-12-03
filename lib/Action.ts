import { Logger, LoggerInstance } from "nano-errors";

export type StateOptions<State> = State | State[] | '*';

export interface ActionOptions {
  name?: string;
  logger?: LoggerInstance;
}

export type TransitionBasicData<State> = {
  from: StateOptions<State>;
  to: StateOptions<State>;
}

export interface TransitionData<State, Payload> extends TransitionBasicData<State> {
  payload?: Payload;
};

/**
 * An action which occurs for one or many specific state transitions.
 */
export default abstract class Action<Instance, State, Payload = any> {
  /** The origin states for which the action is triggered. */
  public abstract from: StateOptions<State>;

  /** The destination states for which the action is triggered. */
  public abstract to: StateOptions<State>;

  /** The name of the action, defaults to the class name. */
  public name: string;

  /** An instance of a logger which implements the same interface as the Winston Logger */
  protected logger: LoggerInstance;

  constructor(protected options: ActionOptions = {}) {
    this.name = options.name || this.constructor.name;
    this.logger = options.logger || Logger.getInstance();
  }

  /**
   * 
   * @param instance The state machine instance
   */
  public beforeTransition(instance: Instance): void {
    this.logger.silly(`${this.name}: leaving state "${this.from}"`);
  }

  /**
   * Handles a state transition
   * 
   * @param instance The state machine instance.
   * @param data The transition payload passed to the fsm.goTo() method.
   */
  public async onTransition(instance: Instance, data: TransitionData<State, Payload>): Promise<boolean> {
    this.logger.silly(`${this.name}: transitioning states "${this.from}" => "${this.to}"`, { data });
    return true;
  }

  /**
   * Handles post transition results.
   * 
   * @param instance The state machine instance.
   */
  public afterTransition(instance: Instance): void {
    this.logger.silly(`${this.name}: entering "${this.to}"`);
  }

  /**
   * Checks if action matches from/to state pair specified.
   * 
   * @param from The original state to be checked against.
   * @param to The destination state to be checked against.
   */
  public matches(from: "*" | State, to: "*" | State): boolean {
    let matchesFrom: boolean = false;
    if (this.from === "*") {
      matchesFrom = true;
    } else if (Array.isArray(this.from)) {
      const array = this.from as State[];
      matchesFrom = array.some(state => state === from);
    } else {
      matchesFrom = this.from === from;
    }
    let matchesTo: boolean = false;
    if (this.to === "*") {
      matchesTo = true;
    } else if (Array.isArray(this.to)) {
      const array = this.to as State[];
      matchesTo = array.some(state => state === to);
    } else {
      matchesTo = this.to === to;
    }

    return matchesFrom && matchesTo;
  }
}
