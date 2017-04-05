const templates = this.templates ? this.templates : {};

/**
 * @name View
 * @author Aleksandr Strutynskyy
 * @description Handlebars facade
 */
module.exports = function View(viewName, data) {
  if (!templates.hasOwnProperty(viewName)) {
    throw new Error(`View file "${viewName}" not found.`);
  }

  return templates[viewName](data);
}
