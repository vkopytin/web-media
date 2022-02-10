export interface ITask {
    isRunning: boolean;
    exec(...args);
}

export class Scheduler {
    running = 0;
    tasks: ITask[] = [];
    inProgress: ITask[] = [];

    static inst: Scheduler = null;

    static getCurrent(): Scheduler {
        if (Scheduler.inst === null) {
            Scheduler.inst = new Scheduler();
        }
        return Scheduler.inst;
    }

    static Command(fn: (...args) => any) {
        const current = Scheduler.getCurrent();

        return {
            isRunning: false,
            exec: (...args) => current.exec({
                isRunning: true,
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
                    const res = await task.exec(...args);
                    resolve(res);

                    return res;
                }
            });
        });
    }

    async run(task: ITask) {
        const done = async () => {
            this.running--;
            if (this.tasks.length > 0) {
                await this.run(this.tasks.shift());
            }
        };
        this.running++;
        this.inProgress.push(task);
        try {
            task.isRunning = true;
            await task.exec();
        } catch (ex) {
            setTimeout(() => {
                console.log(this.inProgress);
                throw ex;
            });
        } finally {
            task.isRunning = false;
            this.inProgress = this.inProgress.filter(a => a !== task);
            done();
        }
    }

    async exec(task: ITask) {
        const res = await this.running < this.concurrency ? this.run(task) : this.enqueue(task);
        return res;
    }
}
