/**
 * @fileoverview Disallow mutation of imported values
 * @author V. Hayrapetyan
 */

'use strict';

const ERROR_MSG_MODULE_MUTATION = 'Mutation of imported module \'{{moduleName}}\'';
const ERROR_MSG_MODULE_PROPERTY_MUTATION = 'Mutation of property in imported module \'{{moduleName}}\'';

const stopNodePattern = /(?:Statement|Declaration|Function(?:Expression)?|Program)$/;

module.exports = {
    create(context) {
        const imports = [];

        function handleImports(node) {
            const importedModules = context.getDeclaredVariables(node);

            importedModules.forEach(importedModule => imports.push(importedModule));
        }
        

        function isModifyingProp(reference) {
            let node = reference.identifier;
            let parent = node.parent;

            while (parent && !stopNodePattern.test(parent.type)) {
                switch (parent.type) {

                    // e.g. foo.a = 0;
                    case "AssignmentExpression":
                        return parent.left === node;

                    // e.g. ++foo.a;
                    case "UpdateExpression":
                        return true;

                    // e.g. delete foo.a;
                    case "UnaryExpression":
                        if (parent.operator === "delete") {
                            return true;
                        }
                        break;

                    // EXCLUDES: e.g. cache.get(foo.a).b = 0;
                    case "CallExpression":
                        if (parent.callee !== node) {
                            return false;
                        }
                        break;

                    // EXCLUDES: e.g. cache[foo.a] = 0;
                    case "MemberExpression":
                        if (parent.property === node) {
                            return false;
                        }
                        break;

                    // EXCLUDES: e.g. ({ [foo]: a }) = bar;
                    case "Property":
                        if (parent.key === node) {
                            return false;
                        }
                        break;
                }

                node = parent;
                parent = node.parent;
            }

            return false;
        }

        function checkVariableReference(reference, index, references) {
            if (reference.isWrite()) {
                context.report({
                    node: reference.identifier,
                    message: ERROR_MSG_MODULE_MUTATION,
                    data: {
                        moduleName: reference.identifier.name
                    }
                });
            } else if (isModifyingProp(reference)) {
                context.report({
                    node: reference.identifier,
                    message: ERROR_MSG_MODULE_PROPERTY_MUTATION,
                    data: {
                        moduleName: reference.identifier.name
                    }
                });
            }
        }

        function handleProgram(node) {
            imports.forEach(importVar => importVar.references.forEach(checkVariableReference));
        }

        const handlers = {
            'Program:exit': handleProgram,
            ImportDeclaration: handleImports,
        }

        return handlers;
    }
}