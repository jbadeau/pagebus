var DSUtils = require('../../utils');
var DSErrors = require('../../errors');

function linkInverse(resourceName, id, relations) {
  var _this = this;
  var definition = _this.definitions[resourceName];

  relations = relations || [];

  id = DSUtils.resolveId(definition, id);
  if (!definition) {
    throw new DSErrors.NER(resourceName);
  } else if (!DSUtils.isString(id) && !DSUtils.isNumber(id)) {
    throw new DSErrors.IA('"id" must be a string or a number!');
  } else if (!DSUtils.isArray(relations)) {
    throw new DSErrors.IA('"relations" must be an array!');
  }
  var linked = _this.get(resourceName, id);

  if (linked) {
    DSUtils.forOwn(_this.definitions, function (d) {
      DSUtils.forOwn(d.relations, function (relatedModels) {
        DSUtils.forOwn(relatedModels, function (defs, relationName) {
          if (relations.length && !DSUtils.contains(relations, d.name)) {
            return;
          }
          if (definition.name === relationName) {
            _this.linkAll(d.name, {}, [definition.name]);
          }
        });
      });
    });
  }

  return linked;
}

module.exports = linkInverse;
