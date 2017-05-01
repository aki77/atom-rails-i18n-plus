'use babel';

import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import sortBy from 'lodash.sortby';
import { flatten } from 'flat';

const readdir = Promise.promisify(fs.readdir);
const readFile = Promise.promisify(fs.readFile);

const getLocaleFiles = dirname =>
  readdir(dirname)
    .catch((e) => {
      if (e.code !== 'ENOENT') throw e;
      return [];
    })
    .then(files => files.map(file => path.join(dirname, file)));

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

const getTranslations = (localesPaths) => {
  const promises = localesPaths.map(getLocaleFiles);
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

const escapeRegExp = string => string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');

export { getTranslations, escapeRegExp };
