/* eslint-disable @typescript-eslint/no-var-requires */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const keys = require('all-object-keys');
const jessy = require('jessy');
const set = require('lodash/set');

const englishTranslations = require('../src/lib/utils/translations/en.json');

// Load env variables
dotenv.config();

const SCRIPT_WAIT_TIME = 2000;

// Define file paths for each language
const languageFiles = {
  hi: path.resolve(__dirname, '../src/lib/utils/translations/hi.json'),
  fr: path.resolve(__dirname, '../src/lib/utils/translations/fr.json'),
  pt: path.resolve(__dirname, '../src/lib/utils/translations/pt.json'),
  de: path.resolve(__dirname, '../src/lib/utils/translations/de.json'),
  vi: path.resolve(__dirname, '../src/lib/utils/translations/vi.json'),
  ru: path.resolve(__dirname, '../src/lib/utils/translations/ru.json'),
  es: path.resolve(__dirname, '../src/lib/utils/translations/es.json')
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getMissingTranslations = async (toLanguage, outputFilePath) => {
  const englishKeys = keys(englishTranslations);
  const targetTranslations = require(outputFilePath); // Load target language translations
  const targetKeys = keys(targetTranslations);

  const missingKeys = englishKeys.filter((key) => !targetKeys.includes(key));

  const missingKeysWithDetails = {};
  missingKeys.forEach((key) => {
    const value = jessy(key, englishTranslations);
    if (value !== undefined) {
      missingKeysWithDetails[key] = value;
    }
  });

  console.log(`Details of missing keys in ${toLanguage.toUpperCase()}:`);
  console.log(missingKeysWithDetails, 'missingKeysWithDetails');

  // Check if there are missing translations, if not, stop the process
  if (!missingKeysWithDetails) {
    console.log(
      `No missing translations for ${toLanguage.toUpperCase()}. Stopping translation process.`
    );
    return;
  }

  return missingKeysWithDetails;
};

const translateLanguage = async (fromLanguage, toLanguage, outputFilePath) => {
  // Check if there are missing translations
  const missingTranslations = await getMissingTranslations(toLanguage, outputFilePath);
  console.log('Missing translations', missingTranslations);

  if (!Object.keys(missingTranslations).length) {
    console.log('No missing translation skip');
    return;
  }

  const targetTranslations = require(outputFilePath); // Load target language translations

  const flattenedEnglish = flattenJSON(missingTranslations);
  const jsonString = JSON.stringify(flattenedEnglish);

  const encodedParams = new URLSearchParams();
  encodedParams.set('from', fromLanguage);
  encodedParams.set('to', toLanguage);
  encodedParams.set('json', jsonString);

  const options = {
    method: 'POST',
    url: 'https://google-translate113.p.rapidapi.com/api/v1/translator/json',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'X-RapidAPI-Key': process.env.RAPID_API_KEY,
      'X-RapidAPI-Host': 'google-translate113.p.rapidapi.com'
    },
    data: encodedParams
  };

  try {
    console.log('Calling API');
    const response = await axios.request(options);
    const { trans } = response.data;

    console.log('Translation gotten', trans);

    if (trans) {
      for (const key in trans) {
        const value = trans[key];
        console.log('key', key);
        console.log('value', value);
        set(targetTranslations, key, value);
      }

      fs.writeFileSync(outputFilePath, JSON.stringify(targetTranslations, null, 2));
      console.log(`${toLanguage.toUpperCase()} translations updated successfully.`);
    } else {
      console.log(`Failed to update ${toLanguage.toUpperCase()} translations.`);
    }
  } catch (error) {
    console.error(`Error translating to ${toLanguage.toUpperCase()}:`, error);
  }
};

// Function to flatten the JSON object
const flattenJSON = (obj, prefix = '') => {
  let flattened = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const nested = flattenJSON(obj[key], `${prefix}${key}.`);
      flattened = { ...flattened, ...nested };
    } else {
      flattened[`${prefix}${key}`] = obj[key];
    }
  }
  return flattened;
};

// Loop through each language and translate the English text with a delay
const translate = async () => {
  for (const [language, filePath] of Object.entries(languageFiles)) {
    console.log(`============FROM: EN================`);
    console.log(`============TO: ${language.toUpperCase()}================`);

    await wait(SCRIPT_WAIT_TIME);
    await translateLanguage('en', language, filePath);

    console.log(`============COMPLETE================\n\n`);
  }
};

translate();
