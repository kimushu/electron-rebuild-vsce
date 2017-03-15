"use strict"

const {argv} = require("yargs")
  .alias("h", "help")
//.alias("v", "version")
  .alias("f", "force")
//.alias("a", "arch")
  .alias("m", "module-dir")
  .alias("w", "which-module")
//.alias("e", "electron-prebuilt-dir")
  .alias("d", "dist-url")
  .alias("t", "types")
  .alias("p", "parallel")
  .alias("s", "sequential")
  .alias("c", "vscode")
const {spawn} = require("child_process")
const ext = (process.platform === "win32") ? ".cmd" : ""

let MATRIX = {
  "1.10.2": {
    electron: "1.4.6",
    platforms: {
      win32: ["ia32"],
      linux: ["x64", "ia32"],
      darwin: ["x64"]
    }
  }
}

exports.run = () => {
  if (argv.help) {
    spawn(
      "electron-rebuild" + ext, ["-h"], {stdio: "inherit"}
    ).on("exit", (exitCode) => {
      if (exitCode !== 0) {
        throw Error("Failed to spawn electron-rebuild (not installed?)")
      }
    })
    return
  }
  let {vscode} = argv
  if (!vscode) {
    throw Error("-c or --vscode option required")
  }
  let info = MATRIX[vscode]
  if (!info) {
    throw Error("Unknown VSCode version: " + vscode)
  }
  let archs = info.platforms[process.platform].slice(0)
  console.log("VSCode:   " + vscode)
  console.log("Electron: " + info.electron)
  console.log("Platform: " + process.platform)
  console.log("Arch:     " + archs.join(" "))
  let rebuild = () => {
    let arch = archs.shift()
    if (!arch) {
      // No more arch to build
      return
    }
    let opts = ["--arch", arch, "--version", info.electron]
    let copyopt = (name, with_value = false) => {
      let v = argv[name]
      if (v) {
        opts.push("--" + name)
        if (with_value) {
          opts.push(v)
        }
      }
    }
    copyopt("force")
    copyopt("module-dir", true)
    copyopt("which-module", true)
    copyopt("dist-url", true)
    copyopt("type", true)
    copyopt("parallel")
    copyopt("sequential")
    console.log("> electron-rebuild " + opts.join(" "))
    spawn(
      "electron-rebuild" + ext,
      opts,
      {stdio: "inherit"}
    ).on("exit", (exitCode) => {
      if (exitCode !== 0) {
        throw Error("electron-rebuild failed")
      }
      rebuild()
    })
  }
  rebuild()
}

/*
  -h, --help                   ヘルプを表示                               [真偽]
  -v, --version                The version of Electron to build against
  -f, --force                  Force rebuilding modules, even if we would skip
                               it otherwise
  -a, --arch                   Override the target architecture to something
                               other than your system's
  -m, --module-dir             The path to the node_modules directory to rebuild
  -w, --which-module           A specific module to build, or comma separated
                               list of modules
  -e, --electron-prebuilt-dir  The path to electron-prebuilt
  -d, --dist-url               Custom header tarball URL
  -t, --types                  The types of dependencies to rebuild.  Comma
                               seperated list of "prod", "dev" and "optional".
                               Default is "prod,optional"
  -p, --parallel               Rebuild in parallel, this is enabled by default
                               on macOS and Linux
  -s, --sequential             Rebuild modules sequentially, this is enabled by
                               default on Windows
*/

