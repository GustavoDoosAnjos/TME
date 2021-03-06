const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const render = require('./render')

const forbiddenDirs = [];

class Runner {
    constructor() {
        this.testFiles = ['node_modules'];
    }

    async runTests() {
        for (let file of this.testFiles) {
            console.log(chalk.yellow(`running tests on - ${file.shortName} - `))

            const beforeEaches = [];
            global.render = render;
            global.beforeEach = (fn) => {
                beforeEaches.push(fn)
            }
            global.it = async (desc, fn) => {
                beforeEaches.forEach(func => func());
                console.log('----- ', desc);

                try {
                    await fn();
                    console.log(chalk.green(`\t OK - test ${desc} succeeded`));
                } catch (error) {
                    const message = err.message.replace(/\n/g, '\n\t\t')
                    console.log(chalk.red(`\t X - test ${desc} failed`));
                    console.log(chalk.red('\t', error.message))
                }
            };

            try {
                require(file.name);
            } catch (error) {
                console.log(chalk.red(error))
            }
        }
    }

    async collectFiles(targetPath) {
        const files = await fs.promises.readdir(targetPath);

        for (let file of files) {
            const filepath = path.join(targetPath, file);
            const stats = await fs.promises.lstat(filepath)

            if (stats.isFile() && file.includes('.test.js')) {
                this.testFiles.push({ name: filepath, shortName: file });
            } else if (stats.isDirectory() && !forbiddenDirs.includes(file)) {
                const childFiles = await fs.promises.readdir(filepath);

                files.push(...childFiles.map(f => path.join(file, f)));
            }
        }
    }
}

module.exports = Runner;