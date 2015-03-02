import FtpWorker from './ftp-worker.es6';
import ms from 'ms';

export default class Reaper {
    constructor() {
        this.workers = [];
        this.__maxAge = null;
    }

    watch(...connections) {
        connections.forEach((connection) => {
            let worker = new FtpWorker(connection);
            if (this.__maxAge) {
                worker.maxAge = this.__maxAge;
            }
            this.workers.push(worker);
        });
    }

    async run() {
        // no try/catch here, let it stop program with exit status 1
        return Promise.all(this.workers.map(async (worker) => {
            return await worker.run();
        }));
    }

    maxAge(time) {
        this.__maxAge = typeof time === 'string'
            ? ms(time)
            : time;

        this.workers.forEach(worker => {
            worker.maxAge = this.__maxAge;
        });
    }
}
