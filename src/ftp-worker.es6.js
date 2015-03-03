import FtpClient from 'ftp';
import chalk from 'chalk';
import path from 'path';
import flatten from 'flatten';
import {inspect} from 'util';

export default class FtpWorker {
    constructor(connection) {
        if (!connection.host) {
            throw new Error(`No ftp host found at params ${inspect(connection)}`);
        }

        connection.path = connection.path || '/';

        this.connection = connection;

        this.__maxAge = null; // set 100 years as default max age
        this.client = new FtpClient();
    }

    async run() {
        return new Promise((resolve, reject) => {
            this.client.on('ready', async () => {
                console.log(chalk.green(`Connection established to ${this.connection.host}`));
                let result = await this.__reapDirectory(this.connection.path);

                let count = flatten(result).reduce((accumulator, current) => {
                    return current ? (accumulator + 1) : accumulator;
                }, 0);

                console.log(chalk.magenta(`${count} file${(count > 1 || count === 0) ? 's' : ''} deleted`));

                this.client.end();
            });

            this.client.on('error', clientError => {
                console.log(chalk.red(clientError));
                reject(clientError);
            });

            this.client.on('end', () => {
                console.log(chalk.green(`Connection to ${this.connection.host} closed`));
                resolve(true);
            });

            this.client.connect(this.connection);
        });
    }

    async __reapDirectory(currentWorkingDirectory) {
        let listOfDirectoryContent = await this.__listDirectory(currentWorkingDirectory);
        // let list directory error to bubble into reaper

        return Promise.all(listOfDirectoryContent.map(async (file) => {
            return await this.__processFile(file, currentWorkingDirectory);;
        }));
    }

    async __processFile(file, currentWorkingDirectory) {
        const filePathWithDirectory = path.resolve(currentWorkingDirectory, file.name);
        if (file.type === 'd') { // subdirectory
            return await this.__reapDirectory(filePathWithDirectory);
        }
        if (file.type === '-') { // if not file do nothing
            if (this.__judge(file)) {
                console.log(chalk.yellow(`Deleting file ftp://${this.connection.host}${filePathWithDirectory}`));
                // let possible file deletion error bubble up
                return await this.__deleteFile(filePathWithDirectory);
            } else {
                return false;
            }
        }
    }

    async __deleteFile(path) {
        return new Promise((resolve, reject) => {
            this.client.delete(path, (deleteFileError) => {
                if (deleteFileError) {
                    return reject(deleteFileError);
                }

                resolve(true);
            });
        });
    }

    async __listDirectory(currentWorkingDirectory) {
        console.log(`Retreiving content of directory ${currentWorkingDirectory}`);

        return new Promise((resolve, reject) => {
            this.client.list(currentWorkingDirectory, false, (listDirectoryError, list) => {
                if (listDirectoryError) {
                    reject(listDirectoryError);
                }

                resolve(list);
            });
        });
    }

    __judge(file) {
        if (this.__maxAge !== null) {
            return Date.now() - file.date.getTime() > this.__maxAge;
        } else {
            return false;
        }
    }

    set maxAge(time) {
        this.__maxAge = time;

        return this;
    }

    get maxAge() {
        return this.__maxAge;
    }
}
