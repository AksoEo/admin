import { remove, TASKS } from './store';

/// Abstract task container.
export default class Task {
    running = false;
    error = null;
    isDropped = false;

    constructor (id, options, parameters) {
        this.id = id;
        this.options = options;
        this.pendingParameters = parameters;
    }

    /// Yells at the user if this task has been dropped but they’re trying to perform an action.
    dropCheck (action) {
        if (this.isDropped) {
            self.postMessage({
                type: 'task-error',
                id: this.id,
                error: {
                    code: 'drop-check',
                    message: `resurrection is not allowed (attempt to ${action})`,
                },
            });
            return true;
        }
    }

    /// Updates task parameters.
    update (parameters) {
        if (this.dropCheck('update')) return;
        this.pendingParameters = parameters;
    }

    /// Run implementation.
    async run () {}

    /// Run wrapper that handles IPC and stuff.
    async $run () {
        if (this.dropCheck('run')) return;
        if (this.running) return;
        this.running = true;
        this.parameters = this.pendingParameters;

        let result, error;
        try {
            result = await this.run(this.options, this.parameters);
        } catch (err) {
            error = err;
        }
        this.running = false;
        if (this.isDropped) return;

        if (error) {
            self.postMessage({
                type: 'task-error',
                id: this.id,
                error: {
                    code: error.code,
                    message: error.message || error.toString(),
                },
            });
        } else {
            self.postMessage({ type: 'task-success', id: this.id, result });
            this.drop();
        }
    }

    /// Drops the task.
    drop () {
        if (this.dropCheck('drop (don’t drop twice)')) return;
        this.isDropped = true;
        remove([TASKS, this.id]);
    }
}