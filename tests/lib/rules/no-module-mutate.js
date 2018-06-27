/**
 * @fileoverview Disallow mutation of imported values
 * @author V. Hayrapetyan
 */

'use strict';

const rule = require('../../../lib/rules/no-module-mutate'),
    RuleTester = require('eslint').RuleTester;

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  }
});

const ruleTester = new RuleTester();

const DEFAULT_IMPORT = "import foo from 'foo';";
const SPECIFIC_IMPORT = "import { foo } from 'foo';";
const NAMESPACE_IMPORT = "import * as foo from 'foo';";

const importCases = [DEFAULT_IMPORT, SPECIFIC_IMPORT, NAMESPACE_IMPORT];

let validCases = [];
let invalidCases = [];

const ERROR_MSG_MODULE_MUTATION = 'Mutation of imported module \'foo\'';
const ERROR_MSG_MODULE_PROPERTY_MUTATION = 'Mutation of property in imported module \'foo\'';

importCases.forEach(importDeclaration => {
    validCases = validCases.concat([
        { code: `${importDeclaration} const bar = foo;` },
        { code:`${importDeclaration} function baz(foo) { foo++; };`}
    ])

    invalidCases = invalidCases.concat([
        { code: `${importDeclaration} foo = 1;`, errors: [{ message: ERROR_MSG_MODULE_MUTATION }] },
        { code: `${importDeclaration} foo += 1;`, errors: [{ message: ERROR_MSG_MODULE_MUTATION }] },
        { code: `${importDeclaration} foo.prop = 1;`, errors: [{ message: ERROR_MSG_MODULE_PROPERTY_MUTATION }] },
        { code: `${importDeclaration} foo.prop += 1;`, errors: [{ message: ERROR_MSG_MODULE_PROPERTY_MUTATION }] },
        { code: `${importDeclaration} delete foo.prop;`, errors: [{ message: ERROR_MSG_MODULE_PROPERTY_MUTATION }] },
    ])
});

ruleTester.run('no-module-mutate', rule, {
    valid: validCases,
    invalid: invalidCases,
});