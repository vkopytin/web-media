export interface ITask {
    isRunning: boolean;
    fails: number;
    exec(...args: unknown[]): void;
}

export class Scheduler {
    running = 0;
    tasks: ITask[] = [];
    inProgress: ITask[] = [];

    static inst: Scheduler | null = null;

    static getCurrent(): Scheduler {
        if (Scheduler.inst === null) {
            Scheduler.inst = new Scheduler();
        }
        return Scheduler.inst;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    static Command<T extends Function>(fn: T) {
        const current = Scheduler.getCurrent();

        return {
            isRunning: false,
            exec: (...args: unknown[]) => current.exec({
                isRunning: false,
                fails: 0,
                exec: () => fn(...args)
            })
        };
    }

    constructor(public concurrency = 1) {

    }

    async enqueue(task: ITask) {
        return new Promise(resolve => {
            this.tasks.push({
                ...task,
                exec: async (...args) => {
                    console.log('running tasks:', Scheduler.getCurrent().inProgress);
                    const res = await task.exec(...args);
                    resolve(res);

                    return res;
                }
            });
        });
    }

    async run(task: ITask) {
        const done = async () => {
            this.inProgress = this.inProgress.filter(a => a !== task);
            this.running--;
            if (this.tasks.length > 0) {
                await this.run(this.tasks.shift() as ITask);
            }
        };
        this.running++;
        this.inProgress.push(task);
        try {
            task.isRunning = true;
            await task.exec();
        } catch (ex) {
            setTimeout(() => {
                if (task.fails < 3) {
                    task.fails++;
                    this.exec(task);
                    return;
                }
                console.log('Failed task: ', task);
                throw ex;
            });
        } finally {
            task.isRunning = false;
            done();
        }
    }

    async exec(task: ITask) {
        const res = await this.running < this.concurrency ? this.run(task) : this.enqueue(task);
        return res;
    }
}
