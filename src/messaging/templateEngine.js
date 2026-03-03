function renderTemplate(input, variables) {
  return input.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return String(variables[key]);
    }
    return `{${key}}`;
  });
}

module.exports = { renderTemplate };
