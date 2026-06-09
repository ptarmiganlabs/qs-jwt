import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
    {
        ignores: ['build.cjs', 'node_modules/**', 'docs/**'],
    },
    js.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        plugins: {
            prettier,
            jsdoc,
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },

            ecmaVersion: 2022,
            sourceType: 'module',
        },

        rules: {
            'prettier/prettier': 'error',
            'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
            'jsdoc/require-jsdoc': [
                'error',
                {
                    require: {
                        FunctionDeclaration: true,
                        MethodDefinition: true,
                        ClassDeclaration: true,
                        ArrowFunctionExpression: false,
                        FunctionExpression: false,
                    },
                },
            ],
            'jsdoc/require-description': 'error',
            'jsdoc/require-param': 'error',
            'jsdoc/require-param-description': 'error',
            'jsdoc/require-param-name': 'error',
            'jsdoc/require-param-type': 'error',
            'jsdoc/require-returns': 'error',
            'jsdoc/require-returns-description': 'error',
            'jsdoc/require-returns-type': 'error',
        },
    },
];
