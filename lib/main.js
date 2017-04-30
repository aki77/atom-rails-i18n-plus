'use babel';

import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import sortBy from 'lodash.sortby';
import { flatten } from 'flat';
import TranslateProvider from './translate-provider';
import TranslatePrefixProvider from './translate-prefix-provider';
import LocalizeProvider from './localize-provider';

const readdir = Promise.promisify(fs.readdir);
const readFile = Promise.promisify(fs.readFile);

const getLocaleFiles = (dirname) => {
  // TODO: multi projects
  const projectPath = atom.project.getPaths()[0];
  return readdir(path.join(projectPath, dirname)).catch((e) => {
    if (e.code !== 'ENOENT') throw e;
    return [];
  }).then(files => files.map(file => path.join(projectPath, dirname, file)));
};

const mergeTranslations = (translations) => {
  const priorityOfLocales = atom.config.get('autocomplete-rails-i18n.priorityOfLocales');
  const priorityData = Object.keys(translations).map((locale) => {
    const index = priorityOfLocales.indexOf(locale);
    return {
      priority: index < 0 ? 100 : index + 1,
      data: translations[locale],
    };
  });
  const sortedTranslations = sortBy(priorityData, 'priority').map(({ data }) => data);
  sortedTranslations.reverse();
  return Object.assign({}, ...sortedTranslations);
};

const loadLocales = () => {
  const promises = atom.config.get('autocomplete-rails-i18n.localesPaths').map(getLocaleFiles);
  return Promise.all(promises)
    .then(files => [].concat(...files))
    .then(files => Promise.all(files.map(file => readFile(file))))
    .then(buffers => buffers.map(buffer => yaml.safeLoad(buffer, { json: true })))
    .then((jsonArray) => {
      const translations = {};
      jsonArray.forEach((json) => {
        Object.keys(json).forEach((locale) => {
          const data = flatten(json[locale]);
          if (translations[locale]) {
            Object.assign(translations[locale], data);
          } else {
            translations[locale] = data;
          }
        });
      });
      return translations;
    })
    .then(mergeTranslations);
};

class AutocompleteRailsI18nPackage {
  constructor() {
    this.config = {
      localesPaths: {
        title: 'Locales paths',
        description: 'Directories list separated by comma(for example "config/locales, config/foo")',
        type: 'array',
        default: ['config/locales'],
      },
      translateMethods: {
        title: 'Translate methods',
        type: 'array',
        default: ['I18n.translate', 'I18n.t', 't'],
      },
      localizeMethods: {
        title: 'Localize methods',
        type: 'array',
        default: ['I18n.localize', 'I18n.l', 'l'],
      },
      priorityOfLocales: {
        title: 'Priority of locales',
        type: 'array',
        description: 'Priority locales list separated by comma(for example "ja en")',
        default: ['en'],
      },
    };
  }

  activate() {
    this.providers = [
      new TranslateProvider(),
      new TranslatePrefixProvider(),
      new LocalizeProvider(),
    ];

    loadLocales().then((translations) => {
      this.providers.forEach((provider) => {
        if (provider.setTranslations) provider.setTranslations(translations);
      });
    });
  }

  deactivate() {
    delete this.providers;
    this.providers = null;
  }

  getProviders() {
    return this.providers;
  }
}

export default new AutocompleteRailsI18nPackage();
