const ERROR_MSG_MODULE_MUTATION = 'Mutation of imported value';

function reportViolation(context, node) {
    context.report(node, ERROR_MSG_MODULE_MUTATION);
}

function handleImports(context, imports) {
  return function(node) {
        node.specifiers.forEach(specifier => {
            imports.push(specifier.local.name)
        });
  }
}

function handleExpression(context, imports) {
    return function(node) {
        const isModuleValue = ref => imports.includes(ref);

        switch (node.type) {
            case 'AssignmentExpression':
                if (
                    isModuleValue(node.left.name) ||
                    (node.left.object && isModuleValue(node.left.object.name))
                ) {
                    reportViolation(context, node);
                }
                break;
            case 'UpdateExpression':
            	if (isModuleValue(node.argument.name)) {
                    reportViolation(context, node);
                }
				break;
            case 'UnaryExpression':
                if (
                    node.operator === "delete" &&
                    isModuleValue(node.argument.object.name)
                ) {
                    reportViolation(context, node);
                }
                break;
        }
    }
}

module.exports = {
    create(context) {
        const moduleImports = [];

        const handlers = {
            ImportDeclaration: handleImports(context, moduleImports),
            AssignmentExpression: handleExpression(context, moduleImports),
            UpdateExpression: handleExpression(context, moduleImports),
            UnaryExpression: handleExpression(context, moduleImports),
        };

        return handlers;
    }
}
