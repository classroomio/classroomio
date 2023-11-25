const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

module.exports = {
	extends: [
		"@vercel/style-guide/eslint/browser",
		"@vercel/style-guide/eslint/typescript",
		"@vercel/style-guide/eslint/react",
	].map(require.resolve),
	parserOptions: {
		project,
	},
	globals: {
		JSX: true,
	},
	settings: {
		"import/resolver": {
			typescript: {
				project,
			},
		},
	},
	ignorePatterns: ["node_modules/", "dist/", ".eslintrc.js"],

	rules: {
		// add specific rules configurations here
	},
};
