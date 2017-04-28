'use babel';

import CompletionProvider from './completion-provider';

class AutocompleteRailsI18nPackage {
  constructor() {
    this.config = {
      localesPaths: {
        title: 'Locales paths',
        description: 'Directoriesl list separated by comma(for example "config/locales, config/foo")',
        type: 'array',
        default: ['config/locales'],
      },
    };
  }

  activate() {
    this.completionProvider = new CompletionProvider();
  }

  deactivate() {
    delete this.completionProvider;
    this.completionProvider = null;
  }

  getCompletionProvider() {
    return this.completionProvider;
  }
}

export default new AutocompleteRailsI18nPackage();
