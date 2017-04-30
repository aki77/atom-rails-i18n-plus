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
  const priorityOfLocales = atom.config.get('rails-i18n-plus.priorityOfLocales');
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
  const promises = atom.config.get('rails-i18n-plus.localesPaths').map(getLocaleFiles);
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

export default {
  activate: () => {
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
  },

  deactivate: () => {
    delete this.providers;
    this.providers = null;
  },

  getProviders: () => this.providers,
};
