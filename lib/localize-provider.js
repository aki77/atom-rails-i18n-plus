'use babel';

import { escapeRegExp } from './util';

const SELECTOR = ['.source.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string'];

export default class LocalizeProvider {
  constructor(i18n) {
    this.i18n = i18n;

    this.selector = SELECTOR.join(', ');
    this.disableForSelector = SELECTOR_DISABLE.join(', ');
    this.suggestionPriority = 5;
  }

  getSuggestions({ editor, bufferPosition }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    const methods = atom.config.get('rails-i18n-plus.localizeMethods').map(escapeRegExp);
    const lineRegexp = new RegExp(
      `[^a-z.](?:${methods.join('|')})['"\\s(]+.*format: (:?([a-zA-Z0-9_]*))$`,
    );

    const matches = line.match(lineRegexp);
    if (!matches) {
      return [];
    }
    const [, replacementPrefix, formatPrefix] = matches;

    const suggestions = [];

    this.i18n.getTranslations().forEach((value, key) => {
      if (!key.startsWith('date.formats.') && !key.startsWith('time.formats.')) {
        return;
      }

      if (formatPrefix.length > 0 && !key.includes(formatPrefix)) {
        return;
      }

      const keys = key.split('.');
      suggestions.push({
        text: `:${keys[2]}`,
        displayText: keys[2],
        type: 'keyword',
        rightLabel: value,
        leftLabel: keys[0],
        description: value,
        replacementPrefix,
      });
    });

    return suggestions;
  }
}
