'use babel';

import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { flatten } from 'flat';
import TranslateBlurbsProvider from './translate-blurbs-provider';
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

const loadLocales = () => {
  const promises = atom.config.get('autocomplete-rails-i18n.localesPaths').map(getLocaleFiles);
  return Promise.all(promises)
    .then(files => [].concat(...files))
    .then(files => Promise.all(files.map(file => readFile(file))))
    .then(buffers => buffers.map(buffer => yaml.safeLoad(buffer, { json: true })))
    .then((data) => {
      const translations = data.map((json) => {
        // TODO: locale settings
        const localeData = Object.keys(json).map(key => json[key]);
        return flatten(Object.assign({}, ...localeData));
      });
      return Object.assign({}, ...translations);
    });
};

class AutocompleteRailsI18nPackage {
  constructor() {
    this.config = {
      localesPaths: {
        title: 'Locales paths',
        description: 'Directoriesl list separated by comma(for example "config/locales, config/foo")',
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
    };
  }

  activate() {
    this.providers = [
      new TranslateBlurbsProvider(),
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
