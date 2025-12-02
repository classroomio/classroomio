import { Context, watch } from 'runed';
import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

const passwordOptions = {
	translations: zxcvbnEnPackage.translations,
	graphs: zxcvbnCommonPackage.adjacencyGraphs,
	dictionary: {
		...zxcvbnCommonPackage.dictionary,
		...zxcvbnEnPackage.dictionary
	}
};

zxcvbnOptions.setOptions(passwordOptions);

type PasswordRootStateProps = WritableBoxedValues<{
	hidden: boolean;
}> &
	ReadableBoxedValues<{
		minScore: number;
	}>;

type PasswordState = {
	value: string;
	copyMounted: boolean;
	toggleMounted: boolean;
	strengthMounted: boolean;
	tainted: boolean;
};

const defaultPasswordState: PasswordState = {
	value: '',
	copyMounted: false,
	toggleMounted: false,
	strengthMounted: false,
	tainted: false
};

class PasswordRootState {
	passwordState = $state(defaultPasswordState);

	constructor(readonly opts: PasswordRootStateProps) {}

	// only re-run when the password changes
	strength = $derived.by(() => zxcvbn(this.passwordState.value));
}

type PasswordInputStateProps = WritableBoxedValues<{
	value: string;
}> &
	ReadableBoxedValues<{
		ref: HTMLInputElement | null;
	}>;

class PasswordInputState {
	constructor(
		readonly root: PasswordRootState,
		readonly opts: PasswordInputStateProps
	) {
		watch(
			() => this.opts.value.current,
			() => {
				if (this.root.passwordState.value !== this.opts.value.current) {
					this.root.passwordState.tainted = true;
					this.root.passwordState.value = this.opts.value.current;
				}
			}
		);

		$effect(() => {
			if (!this.root.passwordState.strengthMounted) return;

			// if the password is empty, we let the `required` attribute handle the validation
			if (
				this.root.passwordState.value !== '' &&
				this.root.strength.score < this.root.opts.minScore.current
			) {
				this.opts.ref.current?.setCustomValidity('Password is too weak');
			} else {
				this.opts.ref.current?.setCustomValidity('');
			}
		});
	}

	props = $derived.by(() => ({
		'aria-invalid':
			this.root.strength.score < this.root.opts.minScore.current &&
			this.root.passwordState.tainted &&
			this.root.passwordState.strengthMounted
	}));
}

class PasswordToggleVisibilityState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.toggleMounted = true;

		// this way we go back to the correct padding when toggle is unmounted
		$effect(() => {
			return () => {
				this.root.passwordState.toggleMounted = false;
			};
		});
	}
}

class PasswordCopyState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.copyMounted = true;

		// this way we go back to the correct padding when copy is unmounted
		$effect(() => {
			return () => {
				this.root.passwordState.copyMounted = false;
			};
		});
	}
}

class PasswordStrengthState {
	constructor(readonly root: PasswordRootState) {
		this.root.passwordState.strengthMounted = true;

		$effect(() => {
			return () => {
				this.root.passwordState.strengthMounted = false;
			};
		});
	}

	get strength() {
		return this.root.strength;
	}
}

const ctx = new Context<PasswordRootState>('password-root-state');

export function usePassword(props: PasswordRootStateProps) {
	return ctx.set(new PasswordRootState(props));
}

export function usePasswordInput(props: PasswordInputStateProps) {
	return new PasswordInputState(ctx.get(), props);
}

export function usePasswordToggleVisibility() {
	return new PasswordToggleVisibilityState(ctx.get());
}

export function usePasswordCopy() {
	return new PasswordCopyState(ctx.get());
}

export function usePasswordStrength() {
	return new PasswordStrengthState(ctx.get());
}
