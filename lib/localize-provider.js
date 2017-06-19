'use babel';

import { escapeRegExp } from './util';

const SELECTOR = ['.source.ruby'];
const SELECTOR_DISABLE = ['.comment', '.string'];
const OBJECT_NAME_SUFFIXES = [
  {
    type: 'date',
    suffixes: ['_on', '_date'],
  },
  {
    type: 'time',
    suffixes: ['_at', '_time', '_datetime'],
  },
];

const typeOfObjectName = (objectName) => {
  const value = OBJECT_NAME_SUFFIXES.find(({ suffixes }) =>
    suffixes.some(suffix => objectName.endsWith(suffix)),
  );
  return value ? value.type : null;
};

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
      `[^a-z.](?:${methods.join('|')})(?:\\s+|\\()([\\w.]+),\\s*format: (:?([a-zA-Z0-9_]*))$`,
    );

    const matches = line.match(lineRegexp);
    if (!matches) {
      return [];
    }
    const [, objectName, replacementPrefix, formatPrefix] = matches;

    const suggestions = [];
    const objectType = typeOfObjectName(objectName);

    this.i18n.getTranslations().forEach((value, key) => {
      if (!key.startsWith('date.formats.') && !key.startsWith('time.formats.')) {
        return;
      }

      if (objectType && !key.startsWith(`${objectType}.formats.`)) {
        return;
      }

      if (formatPrefix.length > 0 && !key.includes(formatPrefix)) {
        return;
      }

      const keys = key.split('.');
      suggestions.push({
        text: key,
        // NOTE: not unique https://github.com/atom/autocomplete-plus/blob/master/lib/autocomplete-manager.js#L418
        snippet: `:${keys[2]}`,
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
