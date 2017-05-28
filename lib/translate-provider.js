'use babel';

import fuzzaldrinPlus from 'fuzzaldrin-plus';
import sortBy from 'lodash.sortby';
import TranslateBaseProvider from './translate-base-provider';

export default class TranslateProvider extends TranslateBaseProvider {
  constructor(i18n) {
    super();
    this.suggestionPriority = 5;
    this.i18n = i18n;
  }

  getTranslateSuggestions({ replacementPrefix }) {
    const suggestions = [];
    this.i18n.getTranslations().forEach((value, key) => {
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
      return sortBy(suggestions, 'score').reverse();
    }
    return suggestions;
  }
}
