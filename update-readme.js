// @ts-check

const cp = require('child_process');
const fs = require('fs');

async function getCommandUsage(commandName) {
  return new Promise((resolve, reject) => {
    cp.exec(
      `node lib/cjs/index.js ${
        commandName === '<command>' ? '' : commandName
      } -h`,
      (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim().replace(/index\.js/g, 'aws-simple'));
        }
      }
    );
  });
}

async function replaceCommandUsage(readmeText, commandName) {
  const regExp = new RegExp(
    `\`\`\`\\s(?:Usage: )?aws-simple ${commandName}[\\s\\S]+?\\s\`\`\``
  );

  return readmeText.replace(
    regExp,
    `\`\`\`\n${await getCommandUsage(commandName)}\n\`\`\``
  );
}

(async () => {
  const readmeText = fs.readFileSync('README.md').toString();

  let updatedReadmeText = readmeText;

  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, '<command>');
  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, 'create');
  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, 'upload');
  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, 'start');
  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, 'list');
  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, 'tag');
  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, 'clean-up');
  updatedReadmeText = await replaceCommandUsage(updatedReadmeText, 'redeploy');

  if (process.env.GITHUB_ACTION && updatedReadmeText !== readmeText) {
    throw new Error('The README is not up to date.');
  }

  fs.writeFileSync('README.md', updatedReadmeText);
})().catch((error) => {
  console.error(error.toString());

  process.exit(1);
});
