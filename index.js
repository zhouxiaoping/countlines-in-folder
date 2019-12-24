const fs = require("fs");
const util = require("util");
const readdir = util.promisify(fs.readdir);
const allFiles = [];

function isFolder(name) {
  return !name.match(/\.[a-zA-Z-0-9]+/);
}

function isRequiredFile(name) {
  return name.match(/\.(jsx?|tsx?|scss|css)/);
}

async function getFilesInFolder(path) {
  let folderFiles = [];

  if (isRequiredFile(path)) {
    allFiles.push(path);
    return allFiles;
  } else if (isFolder(path)) {
    try {
      folderFiles = await readdir(path);
    } catch (e) {}
  }

  for (let name of folderFiles) {
    await getFilesInFolder(path + "/" + name);
  }

  return allFiles;
}

async function getLineCount(path) {
  return new Promise((resolve, reject) => {
    let count = 0;
    fs.createReadStream(path)
      .on("data", function(chunk) {
        for (let i = 0; i < chunk.length; ++i) if (chunk[i] == 10) count++;
      })
      .on("end", function() {
        resolve(count);
      })
      .on("error", function(e) {
        reject(e);
      });
  });
}

async function run(path) {
  const allFiles = await getFilesInFolder(path);
  const filesMap = {};
  let total = 0;
  for (let path of allFiles) {
    try {
      const lineCount = await getLineCount(path);
      total += lineCount;
      filesMap[path] = lineCount;
    } catch (e) {
      console.log(`${path} line count fetch error`, e);
    }
  }

  console.log(filesMap);
  console.log(`totalLineCount: ${total}`);
  console.log(`totalFile: ${Object.keys(filesMap).length}`);
}

run(process.argv[2]);
