import { writable } from 'svelte/store';
import i18n, { type Config } from 'sveltekit-i18n';
import { profile } from '$lib/utils/store/user';
// import { supabase } from './supabase';
// import { onMount } from 'svelte';

// async function fetchProfile() {
// 	const { data, error } = await supabase
// 		.from('profile')
// 		.select('*')

// 	if (data) {
// 		const profileData = data;
// 		profileData.map((data) => (data = data.language || ''));
// 		console.log('profileData:', profileData);
// 	}

// 	if (error) {
// 		console.error('Error fetching profileData:', error.message);
// 	}
// }

// onMount(() => {
// 	fetchProfile()
// })

let userLanguage: any;

profile.subscribe((value) => (userLanguage = value));

interface Params {
	dateValue: number;
	value: number;
	download: number;
	award: number;
	val: Date;
}

const config: Config<Partial<Params>> = {
	initLocale: userLanguage.language,
	// parser: parser(),
	loaders: [
		{
			locale: 'en',
			key: '',
			loader: async () => (await import('../../components/Lang/en.json')).default
		},
		{
			locale: 'hi',
			key: '',
			loader: async () => (await import('../../components/Lang/hi.json')).default
		},
		{
			locale: 'fr',
			key: '',
			loader: async () => (await import('../../components/Lang/fr.json')).default
		},
		{
			locale: 'pt',
			key: '',
			loader: async () => (await import('../../components/Lang/pt.json')).default
		},
		{
			locale: 'de',
			key: '',
			loader: async () => (await import('../../components/Lang/de.json')).default
		},
		{
			locale: 'vi',
			key: '',
			loader: async () => (await import('../../components/Lang/vi.json')).default
		},
		{
			locale: 'ru',
			key: '',
			loader: async () => (await import('../../components/Lang/ru.json')).default
		},
		{
			locale: 'es',
			key: '',
			loader: async () => (await import('../../components/Lang/es.json')).default
		},
	]
};

export const { t, loading, locales, locale, initialized, translations, loadTranslations } =
	new i18n(config);

export const selectedLocale = writable<string>(userLanguage.language);

// Translations logs
loading.subscribe(async ($loading) => {
	if ($loading) {
		console.log('Loading translations...');

		await loading.toPromise();
		console.log('Updated translations', translations.get());
	}
});
