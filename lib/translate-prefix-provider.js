'use babel';

import path from 'path';
import TranslateBaseProvider from './translate-base-provider';

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["getTranslateSuggestions"] }] */
export default class TranslatePrefixProvider extends TranslateBaseProvider {
  constructor() {
    super();
    this.suggestionPriority = 10;
  }

  getTranslateSuggestions({ editor, replacementPrefix }) {
    const projectPath = atom.project.getPaths()[0];
    const paths = [];
    paths.push(
      ...path.dirname(editor.getPath()).replace(`${projectPath}${path.sep}`, '').split(path.sep),
    );
    paths.push(path.basename(editor.getPath()).split('.', 2)[0]);
    paths.shift();

    return [paths.join('.'), paths.slice(1).join('.')]
      .filter(
        suggestion => replacementPrefix.legnth === 0 || suggestion.startsWith(replacementPrefix),
      )
      .map(suggestion => ({
        text: `${suggestion}.`,
        displayText: suggestion,
        type: 'keyword',
        replacementPrefix,
      }));
  }
}
