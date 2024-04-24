/* eslint-disable @typescript-eslint/no-var-requires */

const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const english = require('../src/lib/utils/translations/en.json');

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
  ru: path.resolve(__dirname, '../src/lib/utils/translations/re.json'),
  es: path.resolve(__dirname, '../src/lib/utils/translations/es.json')
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const translateTextWithDelay = async (fromLanguage, toLanguage, outputFilePath, delay) => {
  await wait(delay);
  await translateText(fromLanguage, toLanguage, outputFilePath);
};

// Function to translate text from English to a specified language
const translateText = async (fromLanguage, toLanguage, outputFilePath) => {
  const flattenedEnglish = flattenJSON(english);
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
    const response = await axios.request(options);
    const { trans } = response.data;
    if (trans) {
      const unflattenedTranslatedData = unflattenJSON(trans);
      fs.writeFileSync(outputFilePath, JSON.stringify(unflattenedTranslatedData, null, 2));
      console.log(`${toLanguage.toUpperCase()} translations updated successfully.`);
    } else {
      console.log(`Failed to update ${toLanguage.toUpperCase()} translations.`);
    }
  } catch (error) {
    console.error(`Error translating to ${toLanguage.toUpperCase()}:`, error);
  }
};

// Function to flatten the JSON object
// (This is because .stringify method doesn't get nested objects, the api recieves `[Object]`
// instead so i flatten to sent to the api then unflatted my response so an object data is gotten back.)
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

// Function to unflatten the JSON object
const unflattenJSON = (obj) => {
  let unflattened = {};
  for (const key in obj) {
    const keys = key.split('.');
    let nested = unflattened;
    for (let i = 0; i < keys.length - 1; i++) {
      nested[keys[i]] = nested[keys[i]] || {};
      nested = nested[keys[i]];
    }
    nested[keys[keys.length - 1]] = obj[key];
  }
  return unflattened;
};

// Loop through each language and translate the English text with a delay
const translate = async (delay) => {
  for (const [language, filePath] of Object.entries(languageFiles)) {
    await translateTextWithDelay('en', language, filePath, delay);
  }
};

translate(SCRIPT_WAIT_TIME);
