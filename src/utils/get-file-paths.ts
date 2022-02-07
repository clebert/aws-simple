import {lstat, readdir} from 'fs/promises';
import {join} from 'path';

export async function getFilePaths(
  directoryPath: string,
): Promise<readonly string[]> {
  if (!(await lstat(directoryPath)).isDirectory()) {
    throw new Error(`The path does not refer to a directory: ${directoryPath}`);
  }

  const childPaths = (await readdir(directoryPath))
    .filter((childName) => !childName.startsWith(`.`))
    .map((childName) => join(directoryPath, childName));

  const filePaths: string[] = [];

  for (const childPath of childPaths) {
    const stats = await lstat(childPath);

    if (stats.isDirectory()) {
      filePaths.push(...(await getFilePaths(childPath)));
    } else if (stats.isFile()) {
      filePaths.push(childPath);
    }
  }

  return filePaths;
}
