'use babel';

import fuzzaldrinPlus from 'fuzzaldrin-plus';
import sortBy from 'lodash.sortby';
import TranslateBaseProvider from './translate-base-provider';

export default class TranslateProvider extends TranslateBaseProvider {
  constructor() {
    super();
    this.suggestionPriority = 5;

    this.translations = [];
  }

  setTranslations(translations) {
    this.translations = translations;
  }

  getTranslateSuggestions({ replacementPrefix }) {
    return new Promise((resolve) => {
      const suggestions = [];
      Object.keys(this.translations).forEach((key) => {
        const value = this.translations[key];
        const suggestion = {
          text: key,
          type: 'keyword',
          rightLabel: value,
          description: value,
          replacementPrefix,
        };

        if (replacementPrefix.length > 0) {
          const score = fuzzaldrinPlus.score(key, replacementPrefix);
          if (score > 0) {
            suggestion.score = score;
            suggestions.push(suggestion);
          }
        } else {
          suggestions.push(suggestion);
        }
      });

      if (replacementPrefix.length > 0) {
        resolve(sortBy(suggestions, 'score').reverse());
      } else {
        resolve(suggestions);
      }
    });
  }
}
