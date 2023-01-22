class Events {
    subscribers: { [key: string]: Function[] } = {};

    on(name: string, handler: Function): void {
        const subscribers = this.subscribers[name] || (this.subscribers[name] = []);
        subscribers.push(handler);
    }

    off(name: string, handler: Function): void {
        const subscribers = this.subscribers[name];
        if (!subscribers) {

            return;
        }
        let idx = subscribers.indexOf(handler);
        if (idx !== -1) {
            subscribers.splice(idx, 1);
        }
    }

    trigger(event: {}, ...args: Array<{}>): void {
        let subscribers;
        let i;

        if (!event) {
            throw new Error('Event was invalid.');
        }

        if (typeof event === 'string') {
            subscribers = this.subscribers[event];
            if (!subscribers) {

                return;
            }
            subscribers = subscribers.slice();
            i = subscribers.length;

            while (i--) {
                try {
                    subscribers[i].apply(this, [event, ...args]);
                } catch (e) {
                    setTimeout(() => { throw e; });
                }
            }
        }
    }
}


export { Events };
