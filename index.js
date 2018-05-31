function about(otherData, prerequisites, cb) {
  return (data, odInfo) => {
    let firstFailure = prerequisites.find(prereq => !prereq(data));

    if(odInfo) {
      if(firstFailure) return firstFailure(data, odInfo);

      let finalData = {};
      for(let key in odInfo) {
        finalData[key] = otherData[key] || "No information available";
      }
      return finalData;
    }
    if(firstFailure) return false;
    return cb(data);
  };
}

class Command {
  constructor({description = "No description provided", requirements = [], usage = [], options = {}, callback} = {}) {
    this.paths = {};
    this.callback = callback;
    this.description = description;
    this.requirements = requirements;
    this.options = options;
    this.argInfo = usage.map(usagePart => {
      if(Array.isArray(usagePart)) usagePart = usagePart.join`|`;
      return `[${usagePart}]`;
    }).join` ` || ""; // TODO be able to tell subusages about the usages above them
  }
  add(path, usage) { // TODO add should support parse paths and also things like no path, no path = take their usage and merge it with ours
    this.paths[path] = usage;
    usage.parent = this;
    usage._prefix = `${path} `;
  }
  get prefix() {
    let prefix = "";
    if(this.parent) prefix += this.parent.prefix;
    if(this._prefix) prefix += this._prefix;
    return prefix;
  }
  depricate(path, replacement) {
    this.paths[path] = new Command({
      "description": "This command is depricated",
      "requirements": [about({"preCheck": `This command has been renamed to \`${replacement}\`. Please use that instead.`}, [], _ => false)]
    });
  }
  getFailedRequirement(data) {
    let failedRequirement = this.requirements.find(requirement => !requirement(data));
    if(failedRequirement)
      return failedRequirement(data, {"preCheck": ""}).preCheck || "This command could not be run. No reason was specified.";
    return undefined;
  }
  checkRequirements(data) {
    return !this.getFailedRequirement(data);
  }
  parse(data, command) { // TODO support requirements // TODO return the thing to say so this can be unit teste
    let failedRequirement = this.getFailedRequirement(data);
    if(failedRequirement) return failedRequirement;
    let cmd = command.split` `;
    let nextPath = cmd.shift();
    if(this.paths[nextPath]) {
      cmd = cmd.join` `;
      return this.paths[nextPath].parse(data, cmd);
    } // TODO else if loop over regex options
    if(!this.callback) return `Command not found. List of commands:\`\`\`${this.getUsage({"layers": 2, "data": data}).join`\n`}\`\`\``;

    data.commandCommand = this.getUsage({"layers": 2, "data": data}).join`\n`;
    this.callback(data, ...command.split` `);

    return;
  }
  getUsage({layers = -1, data} = {}) {
    if(layers === 0) return [`${this.prefix || ""}...`];
    if(data && !this.checkRequirements(data)) return [];
    let usage = [];
    if(this.callback) {
      usage.push(`${this.prefix || ""}${this.argInfo}`);
    }
    for(let path in this.paths) {
      let belowCommand = this.paths[path].getUsage({"layers": layers - 1, "data": data});
      // belowCommand = belowCommand.map(u => `${path} ${u}`);
      usage.push(...belowCommand);
    }
    return usage;
  }
  path(path) {
    path = path.split` `;
    let nextPath = path.shift();
    if(!nextPath) return this;
    nextPath = this.paths[nextPath];
    if(!nextPath) throw new Error("Path not found");
    return nextPath.path(path.join` `);
  }
  static get about() {return about;}
}

module.exports = Command;
