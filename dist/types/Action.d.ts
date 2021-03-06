import { LoggerInstance } from "nano-errors";
export interface ActionOptions {
    name?: string;
    logger?: LoggerInstance;
}
export declare type TransitionBasicData<State> = {
    from: State | State[];
    to: State | State[];
};
export declare type TransitionData<State, Payload = any> = TransitionBasicData<State> & Payload;
export default abstract class Action<Instance, State, Payload = any> {
    protected options: ActionOptions;
    abstract from: State | string | (State | string)[];
    abstract to: State | string | (State | string)[];
    name: string;
    protected logger: any;
    constructor(options?: ActionOptions);
    /**
     *
     * @param instance The state machine instance
     */
    beforeTransition(instance: Instance): void;
    /**
     * Handles a state transition
     *
     * @param instance The state machine instance.
     * @param data The transition payload passed to the fsm.goTo() method.
     */
    onTransition(instance: Instance, data: TransitionData<State, Payload>): Promise<boolean>;
    /**
     * Handles post transition results.
     *
     * @param instance The state machine instance.
     */
    afterTransition(instance: Instance): void;
    /**
     * Checks if action matches from/to state pair specified.
     *
     * @param from The original state to be checked against.
     * @param to The destination state to be checked against.
     */
    matches(from: "*" | State, to: "*" | State): boolean;
}
