'use babel';

import TranslateProvider from './translate-provider';
import TranslatePrefixProvider from './translate-prefix-provider';
import LocalizeProvider from './localize-provider';

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
      new TranslateProvider(),
      new TranslatePrefixProvider(),
      new LocalizeProvider(),
    ];
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
