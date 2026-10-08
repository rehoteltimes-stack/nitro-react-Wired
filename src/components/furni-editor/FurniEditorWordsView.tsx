import { FC, useEffect, useMemo, useState } from 'react';
import { IFurniEditorWord } from '../../api/furni-editor/FurniEditorProtocol';
import { Button, Flex, Text } from '../../common';
import { OnWordSuggestionsLoaded, PlainWord, SuggestWord, UnknownWords, WordHints } from './FurniNames';

// Staff-added word translations (hcms_furni_words, plugin FurniWords): teach the name translator a word, or correct a
// wrong learned one. They are used straight away by every Translate / suggestion (FurniNames SetCustomWords), and the
// plugin sends each change to every online editor.

export type WordKind = 'adj' | 'noun';
export interface IWordPrefill { word: string, english?: string, kind?: WordKind, key: number }
export type SaveWord = (word: string, english: string, kind: WordKind) => void;

/** One word: foreign word -> English, adjective (goes before the noun, like colours) or noun. */
export const WordForm: FC<{ prefill?: IWordPrefill, words: IFurniEditorWord[], onSave: SaveWord }> = props =>
{
    const { prefill = null, words, onSave } = props;
    const [ word, setWord ] = useState('');
    const [ english, setEnglish ] = useState('');
    const [ kind, setKind ] = useState<WordKind>('noun');

    useEffect(() =>
    {
        if(!prefill) return;

        const plain = PlainWord(prefill.word);
        const known = words.find(w => w.word === plain);

        setWord(plain);
        setEnglish(known ? known.english : (prefill.english || ''));
        setKind(known ? known.kind : (prefill.kind || 'noun'));
    }, [ prefill ]);

    const plain = PlainWord(word);
    const existing = words.find(w => w.word === plain);
    const save = () =>
    {
        if(!plain || plain.includes(' ') || !english.trim()) return;

        onSave(plain, english.trim(), kind);
        setWord('');
        setEnglish('');
    }

    return (
        <Flex gap={ 1 } alignItems="center" className="furni-editor-word-form">
            <input className="form-control form-control-sm" placeholder="Word (any language)" value={ word } onChange={ e => setWord(e.target.value) } onKeyDown={ e => (e.key === 'Enter') && save() } />
            <Text small>=</Text>
            <input className="form-control form-control-sm" placeholder="English" value={ english } onChange={ e => setEnglish(e.target.value) } onKeyDown={ e => (e.key === 'Enter') && save() } />
            <select className="form-select form-select-sm" value={ kind } onChange={ e => setKind(e.target.value as WordKind) } title="Adjectives (colours, materials...) go before the noun in English">
                <option value="noun">noun</option>
                <option value="adj">adjective</option>
            </select>
            <Button variant="success" disabled={ !plain || plain.includes(' ') || !english.trim() } onClick={ save }>{ existing ? 'Change' : 'Add word' }</Button>
        </Flex>
    );
}

/** Clickable word chips for a name: unknown words (to add) and known ones with their English (to correct). */
export const WordChips: FC<{ name: string, onPick: (prefill: IWordPrefill) => void }> = props =>
{
    const { name, onPick } = props;
    const unknown = UnknownWords(name);
    const known = WordHints(name);
    const [ , setLoaded ] = useState(0);

    // the suggestions file arrives after the editor opens
    useEffect(() => OnWordSuggestionsLoaded(() => setLoaded(v => v + 1)), []);

    if(!unknown.length && !known.length) return null;

    return (
        <div className="furni-editor-word-chips">
            { unknown.map(w =>
            {
                const suggestion = SuggestWord(w);

                // a suggestion (seen next to this word in other hotels' names) fills the form; save, or change it first
                return suggestion
                    ? <span key={ 'u' + w } className="chip unknown suggested" title={ `Not in the dictionary. Other hotels' names suggest "${ suggestion.en }" (${ suggestion.names } name${ suggestion.names === 1 ? '' : 's' }, ${ Math.round(suggestion.share * 100) }% agree): click to add it` } onClick={ () => onPick({ word: w, english: suggestion.en, key: Date.now() }) }>{ w } ? → { suggestion.en }</span>
                    : <span key={ 'u' + w } className="chip unknown" title="Not in the dictionary: click to add it" onClick={ () => onPick({ word: w, key: Date.now() }) }>{ w } ?</span>;
            }) }
            { known.map(h => <span key={ 'k' + h.word } className="chip" title="Click to correct this word" onClick={ () => onPick({ word: h.word, english: h.en, key: Date.now() }) }>{ h.word } → { h.en }</span>) }
        </div>
    );
}

/** The Words tab: every staff-added word, search, add / change / delete. */
export const FurniEditorWordsView: FC<{ words: IFurniEditorWord[], onSave: SaveWord }> = props =>
{
    const { words, onSave } = props;
    const [ search, setSearch ] = useState('');
    const [ prefill, setPrefill ] = useState<IWordPrefill>(null);

    const shown = useMemo(() =>
    {
        const q = PlainWord(search);

        return q ? words.filter(w => w.word.includes(q) || PlainWord(w.english).includes(q)) : words;
    }, [ words, search ]);

    return (
        <div className="furni-editor-words">
            <Text small className="furni-editor-muted">Words added here are used straight away by Translate and every name suggestion, and they win over the built-in and learned words (so they also fix a wrong translation).</Text>
            <WordForm prefill={ prefill } words={ words } onSave={ onSave } />
            <Flex gap={ 1 } alignItems="center">
                <input className="form-control form-control-sm" placeholder="Search words..." value={ search } onChange={ e => setSearch(e.target.value) } />
                <Text small className="furni-editor-muted text-nowrap">{ shown.length } / { words.length } words</Text>
            </Flex>
            <div className="furni-editor-words-list">
                { !shown.length && <Text small className="furni-editor-muted p-1">{ words.length ? 'No word matches.' : 'No words added yet.' }</Text> }
                { shown.map(w =>
                    <div key={ w.word } className="word-row">
                        <span className="word">{ w.word }</span>
                        <span className="english">{ w.english }</span>
                        <span className="kind">{ (w.kind === 'adj') ? 'adjective' : 'noun' }</span>
                        <span className="by">{ w.addedBy }</span>
                        <Button variant="dark" onClick={ () => setPrefill({ word: w.word, english: w.english, kind: w.kind, key: Date.now() }) }>Edit</Button>
                        <Button variant="danger" onClick={ () => onSave(w.word, '', w.kind) }>Delete</Button>
                    </div>) }
            </div>
        </div>
    );
}
