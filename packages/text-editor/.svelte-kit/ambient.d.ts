
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const npm_package_devDependencies__tailwindcss_typography: string;
	export const npm_package_dependencies_tiptap_markdown: string;
	export const NODE: string;
	export const npm_package_devDependencies_typescript: string;
	export const INIT_CWD: string;
	export const TERM: string;
	export const SHELL: string;
	export const npm_package_devDependencies_vite: string;
	export const npm_package_devDependencies__lucide_svelte: string;
	export const npm_package_devDependencies_clsx: string;
	export const npm_package_scripts_dev: string;
	export const npm_package_dependencies__tiptap_extension_list: string;
	export const npm_package_exports___EdraToolBar: string;
	export const npm_package_dependencies__tiptap_extension_highlight: string;
	export const npm_package_devDependencies__sveltejs_kit: string;
	export const npm_config_registry: string;
	export const npm_package_dependencies__tiptap_starter_kit: string;
	export const npm_package_exports__: string;
	export const npm_package_dependencies__tiptap_pm: string;
	export const USER: string;
	export const npm_package_devDependencies_tailwind_variants: string;
	export const SUDO_USER: string;
	export const SUDO_UID: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const npm_package_dependencies_tiptap_extension_auto_joiner: string;
	export const npm_package_devDependencies__tailwindcss_vite: string;
	export const SSH_AUTH_SOCK: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_package_dependencies__tiptap_extension_code_block_lowlight: string;
	export const npm_execpath: string;
	export const npm_package_dependencies__aarkue_tiptap_math_extension: string;
	export const npm_package_dependencies__tiptap_extensions: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_package_dependencies__tiptap_extension_text_style: string;
	export const npm_package_dependencies_katex: string;
	export const PATH: string;
	export const MAIL: string;
	export const npm_package_devDependencies_bits_ui: string;
	export const npm_package_devDependencies_tailwindcss: string;
	export const npm_command: string;
	export const PWD: string;
	export const npm_package_scripts_preview: string;
	export const npm_package_devDependencies__sveltejs_package: string;
	export const npm_package_devDependencies_publint: string;
	export const npm_package_dependencies_lowlight: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const npm_package_exports___EdraEditor: string;
	export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
	export const npm_package_dependencies__tiptap_extension_superscript: string;
	export const npm_package_dependencies__tiptap_suggestion: string;
	export const NODE_PATH: string;
	export const npm_package_exports___types: string;
	export const npm_package_devDependencies_tw_animate_css: string;
	export const npm_package_dependencies_tippy_js: string;
	export const npm_package_devDependencies_tailwind_merge: string;
	export const npm_config_node_gyp: string;
	export const npm_package_version: string;
	export const npm_package_devDependencies__sveltejs_adapter_auto: string;
	export const npm_package_dependencies__tiptap_core: string;
	export const HOME: string;
	export const SUDO_COMMAND: string;
	export const npm_package_type: string;
	export const SHLVL: string;
	export const npm_package_dependencies__tiptap_extension_image: string;
	export const npm_package_dependencies__tiptap_extension_subscript: string;
	export const npm_package_devDependencies__internationalized_date: string;
	export const LOGNAME: string;
	export const npm_package_exports___EdraDragHandleExtended: string;
	export const npm_package_dependencies__tiptap_extension_typography: string;
	export const npm_package_dependencies_svelte: string;
	export const npm_package_peerDependencies_svelte: string;
	export const npm_lifecycle_script: string;
	export const npm_package_dependencies__tiptap_extension_table: string;
	export const npm_package_dependencies__tiptap_extension_text_align: string;
	export const npm_config_user_agent: string;
	export const npm_package_devDependencies__types_node: string;
	export const SUDO_GID: string;
	export const npm_package_dependencies__floating_ui_dom: string;
	export const npm_package_dependencies__tiptap_extension_bubble_menu: string;
	export const npm_package_dependencies_svelte_tiptap: string;
	export const COLORTERM: string;
	export const npm_node_execpath: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		npm_package_devDependencies__tailwindcss_typography: string;
		npm_package_dependencies_tiptap_markdown: string;
		NODE: string;
		npm_package_devDependencies_typescript: string;
		INIT_CWD: string;
		TERM: string;
		SHELL: string;
		npm_package_devDependencies_vite: string;
		npm_package_devDependencies__lucide_svelte: string;
		npm_package_devDependencies_clsx: string;
		npm_package_scripts_dev: string;
		npm_package_dependencies__tiptap_extension_list: string;
		npm_package_exports___EdraToolBar: string;
		npm_package_dependencies__tiptap_extension_highlight: string;
		npm_package_devDependencies__sveltejs_kit: string;
		npm_config_registry: string;
		npm_package_dependencies__tiptap_starter_kit: string;
		npm_package_exports__: string;
		npm_package_dependencies__tiptap_pm: string;
		USER: string;
		npm_package_devDependencies_tailwind_variants: string;
		SUDO_USER: string;
		SUDO_UID: string;
		PNPM_SCRIPT_SRC_DIR: string;
		npm_package_dependencies_tiptap_extension_auto_joiner: string;
		npm_package_devDependencies__tailwindcss_vite: string;
		SSH_AUTH_SOCK: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_package_dependencies__tiptap_extension_code_block_lowlight: string;
		npm_execpath: string;
		npm_package_dependencies__aarkue_tiptap_math_extension: string;
		npm_package_dependencies__tiptap_extensions: string;
		npm_config_frozen_lockfile: string;
		npm_package_dependencies__tiptap_extension_text_style: string;
		npm_package_dependencies_katex: string;
		PATH: string;
		MAIL: string;
		npm_package_devDependencies_bits_ui: string;
		npm_package_devDependencies_tailwindcss: string;
		npm_command: string;
		PWD: string;
		npm_package_scripts_preview: string;
		npm_package_devDependencies__sveltejs_package: string;
		npm_package_devDependencies_publint: string;
		npm_package_dependencies_lowlight: string;
		npm_lifecycle_event: string;
		LANG: string;
		npm_package_name: string;
		npm_package_exports___EdraEditor: string;
		npm_package_devDependencies__sveltejs_vite_plugin_svelte: string;
		npm_package_dependencies__tiptap_extension_superscript: string;
		npm_package_dependencies__tiptap_suggestion: string;
		NODE_PATH: string;
		npm_package_exports___types: string;
		npm_package_devDependencies_tw_animate_css: string;
		npm_package_dependencies_tippy_js: string;
		npm_package_devDependencies_tailwind_merge: string;
		npm_config_node_gyp: string;
		npm_package_version: string;
		npm_package_devDependencies__sveltejs_adapter_auto: string;
		npm_package_dependencies__tiptap_core: string;
		HOME: string;
		SUDO_COMMAND: string;
		npm_package_type: string;
		SHLVL: string;
		npm_package_dependencies__tiptap_extension_image: string;
		npm_package_dependencies__tiptap_extension_subscript: string;
		npm_package_devDependencies__internationalized_date: string;
		LOGNAME: string;
		npm_package_exports___EdraDragHandleExtended: string;
		npm_package_dependencies__tiptap_extension_typography: string;
		npm_package_dependencies_svelte: string;
		npm_package_peerDependencies_svelte: string;
		npm_lifecycle_script: string;
		npm_package_dependencies__tiptap_extension_table: string;
		npm_package_dependencies__tiptap_extension_text_align: string;
		npm_config_user_agent: string;
		npm_package_devDependencies__types_node: string;
		SUDO_GID: string;
		npm_package_dependencies__floating_ui_dom: string;
		npm_package_dependencies__tiptap_extension_bubble_menu: string;
		npm_package_dependencies_svelte_tiptap: string;
		COLORTERM: string;
		npm_node_execpath: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
