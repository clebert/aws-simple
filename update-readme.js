// @ts-check

const cp = require(`child_process`);
const fs = require(`fs`);

const commandNames = [
  `<command>`,
  `create`,
  `upload`,
  `start`,
  `list`,
  `tag`,
  `clean-up`,
  `redeploy`,
  `flush-cache`,
];

async function getCommandUsage(commandName) {
  return new Promise((resolve, reject) => {
    cp.exec(
      `node lib/cjs/index.js ${
        commandName === `<command>` ? `` : commandName
      } -h`,
      (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim().replace(/index\.js/g, `aws-simple`));
        }
      },
    );
  });
}

function replaceCommandUsage(readmeText, commandName, usage) {
  const regExp = new RegExp(
    `\`\`\`\\s(?:Usage: )?aws-simple ${commandName}[\\s\\S]+?\\s\`\`\``,
  );

  return readmeText.replace(regExp, `\`\`\`\n${usage}\n\`\`\``);
}

(async () => {
  const initialReadmeText = fs.readFileSync(`README.md`).toString();

  const commandUsages = await Promise.all(
    commandNames.map(async (commandName) => ({
      commandName,
      usage: await getCommandUsage(commandName),
    })),
  );

  const updatedReadmeText = commandUsages.reduce(
    (readmeText, {commandName, usage}) =>
      replaceCommandUsage(readmeText, commandName, usage),
    initialReadmeText,
  );

  if (process.env.GITHUB_ACTION && updatedReadmeText !== initialReadmeText) {
    throw new Error(`The README is not up to date.`);
  }

  fs.writeFileSync(`README.md`, updatedReadmeText);
})().catch((error) => {
  console.error(error.toString());

  process.exit(1);
});
