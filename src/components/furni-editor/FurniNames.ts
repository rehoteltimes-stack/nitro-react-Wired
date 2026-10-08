import ENGLISH_ADJECTIVES from './furni-english-adjectives.json';
import LEARNED_WORDS from './furni-words.json';

// Furni name helper for the Furni Editor: translates names from the languages the hotels we imported from use
// (French, Portuguese, Spanish, Italian, German, Dutch, Finnish, Turkish, Swedish) into English and puts the words in
// English order: adjectives (colours, sizes, materials...) before the noun, "X de Y" -> "Y X" ("Livros de Magia" ->
// "Magic Books", "Coussin Rouge" -> "Red Cushion"), and an English name in the wrong order ("Pillow Red") is fixed too.
// Words it does not know stay as they are (title-cased), so the result is always a suggestion to check, never saved alone.

type Kind = 'adj' | 'noun';

const entries: [ Kind, string, string[] ][] = [
    // colours
    [ 'adj', 'Red', [ 'red', 'rouge', 'vermelho', 'vermelha', 'rojo', 'roja', 'rosso', 'rossa', 'rot', 'rote', 'roter', 'rood', 'rode', 'punainen', 'kirmizi', 'rod', 'roda' ] ],
    [ 'adj', 'Blue', [ 'blue', 'bleu', 'bleue', 'azul', 'blu', 'blau', 'blaue', 'blauw', 'blauwe', 'sininen', 'mavi', 'bla' ] ],
    [ 'adj', 'Green', [ 'green', 'vert', 'verte', 'verde', 'grun', 'gruen', 'grune', 'groen', 'groene', 'vihrea', 'yesil', 'gron' ] ],
    [ 'adj', 'Yellow', [ 'yellow', 'jaune', 'amarelo', 'amarela', 'amarillo', 'amarilla', 'giallo', 'gialla', 'gelb', 'gelbe', 'geel', 'gele', 'keltainen', 'sari', 'gul' ] ],
    [ 'adj', 'Black', [ 'black', 'noir', 'noire', 'preto', 'preta', 'negro', 'negra', 'nero', 'nera', 'schwarz', 'schwarze', 'zwart', 'zwarte', 'musta', 'siyah', 'svart' ] ],
    [ 'adj', 'White', [ 'white', 'blanc', 'blanche', 'branco', 'branca', 'blanco', 'blanca', 'bianco', 'bianca', 'weiss', 'weisse', 'wit', 'witte', 'valkoinen', 'beyaz', 'vit' ] ],
    [ 'adj', 'Pink', [ 'pink', 'rose', 'rosa', 'roze', 'pinkki', 'pembe' ] ],
    [ 'adj', 'Purple', [ 'purple', 'violet', 'violette', 'roxo', 'roxa', 'morado', 'morada', 'viola', 'lila', 'paars', 'paarse', 'violetti', 'mor' ] ],
    [ 'adj', 'Orange', [ 'orange', 'laranja', 'naranja', 'arancione', 'oranje', 'oranssi', 'turuncu' ] ],
    [ 'adj', 'Brown', [ 'brown', 'marron', 'marrom', 'marrone', 'braun', 'braune', 'bruin', 'bruine', 'ruskea', 'kahverengi', 'brun' ] ],
    [ 'adj', 'Grey', [ 'grey', 'gray', 'gris', 'grise', 'cinza', 'grigio', 'grigia', 'grau', 'graue', 'grijs', 'grijze', 'harmaa', 'gri', 'gra' ] ],
    [ 'adj', 'Gold', [ 'gold', 'golden', 'dore', 'doree', 'dourado', 'dourada', 'dorado', 'dorada', 'dorato', 'dorata', 'goldene', 'gouden', 'kulta', 'altin', 'ouro', 'oro', 'or' ] ],
    [ 'adj', 'Silver', [ 'silver', 'argent', 'argente', 'prateado', 'prata', 'plateado', 'plata', 'argento', 'silber', 'zilver', 'hopea', 'gumus' ] ],
    [ 'adj', 'Turquoise', [ 'turquoise', 'turquesa', 'turchese', 'turkis', 'turkoois', 'turkoosi' ] ],
    [ 'adj', 'Beige', [ 'beige', 'bege' ] ],
    // other adjectives
    [ 'adj', 'Wooden', [ 'wooden', 'wood', 'bois', 'madeira', 'madera', 'legno', 'holz', 'hout', 'houten', 'puinen', 'ahsap', 'tra' ] ],
    [ 'adj', 'Big', [ 'big', 'large', 'grand', 'grande', 'gross', 'grosse', 'groot', 'grote', 'iso', 'buyuk', 'stor' ] ],
    [ 'adj', 'Small', [ 'small', 'petit', 'petite', 'pequeno', 'pequena', 'piccolo', 'piccola', 'klein', 'kleine', 'pieni', 'kucuk', 'liten' ] ],
    [ 'adj', 'Old', [ 'old', 'ancien', 'ancienne', 'vieux', 'vieille', 'antigo', 'antiga', 'viejo', 'vieja', 'antico', 'antica', 'alt', 'alte', 'oud', 'oude', 'vanha', 'eski' ] ],
    [ 'adj', 'New', [ 'new', 'nouveau', 'nouvelle', 'novo', 'nova', 'nuevo', 'nueva', 'nuovo', 'nuova', 'neu', 'neue', 'nieuw', 'nieuwe', 'uusi', 'yeni', 'ny' ] ],
    [ 'adj', 'Magic', [ 'magic', 'magique', 'magia', 'magico', 'magica', 'magisch', 'magische', 'taika', 'sihirli' ] ],
    [ 'adj', 'Evil', [ 'evil', 'mal', 'mau', 'ma', 'malvado', 'malvada', 'malvagio', 'bose', 'boze', 'paha', 'kotu' ] ],
    [ 'adj', 'Royal', [ 'royal', 'royale', 'real', 'reale', 'koniglich', 'koninklijk', 'kuninkaallinen', 'kraliyet' ] ],
    [ 'adj', 'Double', [ 'double', 'duplo', 'dupla', 'doble', 'doppio', 'doppia', 'doppel', 'dubbel', 'kaksois', 'cift' ] ],
    [ 'adj', 'Single', [ 'single', 'simple', 'solteiro', 'individual', 'singolo', 'einzel', 'eenpersoons', 'yhden', 'tek' ] ],
    [ 'adj', 'Round', [ 'round', 'rond', 'ronde', 'redondo', 'redonda', 'rotondo', 'rotonda', 'rund', 'runde', 'pyorea', 'yuvarlak' ] ],
    [ 'adj', 'Crystal', [ 'crystal', 'cristal', 'cristallo', 'kristall', 'kristal', 'kristalli' ] ],
    [ 'adj', 'Ice', [ 'ice', 'glace', 'gelo', 'hielo', 'ghiaccio', 'eis', 'ijs', 'jaa', 'buz' ] ],
    [ 'adj', 'Stone', [ 'stone', 'pierre', 'pedra', 'piedra', 'pietra', 'stein', 'steen', 'kivi', 'tas', 'sten' ] ],
    [ 'adj', 'Student', [ 'student', 'estudante', 'estudiante', 'etudiant', 'studente', 'studenten', 'opiskelija', 'ogrenci' ] ],
    [ 'adj', 'Glass', [ 'glass', 'verre', 'vidro', 'vidrio', 'vetro', 'glas', 'lasi', 'cam' ] ],
    // nouns
    [ 'noun', 'Sleeping Bag', [ 'sleepingbag', 'schlafsack', 'slaapzak', 'makuupussi', 'sacco' ] ],
    [ 'noun', 'Bed', [ 'bed', 'lit', 'cama', 'letto', 'bett', 'sanky', 'sang', 'yatak' ] ],
    [ 'noun', 'Chair', [ 'chair', 'chaise', 'cadeira', 'silla', 'sedia', 'stuhl', 'stoel', 'tuoli', 'stol', 'sandalye' ] ],
    [ 'noun', 'Armchair', [ 'armchair', 'fauteuil', 'poltrona', 'sillon', 'sessel', 'nojatuoli', 'koltuk', 'fatolj' ] ],
    [ 'noun', 'Sofa', [ 'sofa', 'canape', 'divano', 'bank', 'sohva', 'kanepe', 'soffa' ] ],
    [ 'noun', 'Bench', [ 'bench', 'banc', 'banco', 'panca', 'penkki', 'bench' ] ],
    [ 'noun', 'Stool', [ 'stool', 'tabouret', 'banquinho', 'taburete', 'sgabello', 'hocker', 'kruk', 'jakkara', 'tabure', 'pall' ] ],
    [ 'noun', 'Throne', [ 'throne', 'trone', 'trono', 'thron', 'troon', 'valtaistuin', 'taht', 'tron' ] ],
    [ 'noun', 'Rug', [ 'rug', 'carpet', 'tapis', 'tapete', 'alfombra', 'tappeto', 'teppich', 'tapijt', 'kleed', 'matto', 'hali', 'kilim', 'matta' ] ],
    [ 'noun', 'Hammock', [ 'hammock', 'hamac', 'rede', 'hamaca', 'amaca', 'hangematte', 'hangmat', 'riippumatto', 'hamak' ] ],
    [ 'noun', 'Table', [ 'table', 'mesa', 'tavolo', 'tisch', 'tafel', 'poyta', 'masa', 'bord' ] ],
    [ 'noun', 'Desk', [ 'desk', 'bureau', 'escrivaninha', 'escritorio', 'scrivania', 'schreibtisch', 'pupitre', 'carteira', 'kirjoituspoyta' ] ],
    [ 'noun', 'Lamp', [ 'lamp', 'lampe', 'lampada', 'lampara', 'luminaria', 'lamppu', 'lamba' ] ],
    [ 'noun', 'Cushion', [ 'cushion', 'coussin', 'almofada', 'cojin', 'cuscino', 'kissen', 'kussen', 'tyyny', 'yastik', 'kudde' ] ],
    [ 'noun', 'Pillow', [ 'pillow', 'oreiller', 'travesseiro', 'almohada', 'guanciale' ] ],
    [ 'noun', 'Plant', [ 'plant', 'plante', 'planta', 'pianta', 'pflanze', 'kasvi', 'bitki', 'vaxt' ] ],
    [ 'noun', 'Flower', [ 'flower', 'fleur', 'flor', 'fiore', 'blume', 'bloem', 'kukka', 'cicek', 'blomma' ] ],
    [ 'noun', 'Flowers', [ 'flowers', 'fleurs', 'flores', 'fiori', 'blumen', 'bloemen', 'kukat', 'cicekler' ] ],
    [ 'noun', 'Tree', [ 'tree', 'arbre', 'arvore', 'arbol', 'albero', 'baum', 'boom', 'agac', 'trad' ] ],
    [ 'noun', 'Window', [ 'window', 'fenetre', 'janela', 'janelao', 'ventana', 'finestra', 'fenster', 'raam', 'ikkuna', 'pencere', 'fonster' ] ],
    [ 'noun', 'Door', [ 'door', 'porte', 'porta', 'puerta', 'tur', 'deur', 'ovi', 'kapi', 'dorr' ] ],
    [ 'noun', 'Shelf', [ 'shelf', 'etagere', 'estante', 'estanteria', 'scaffale', 'regal', 'plank', 'hylly', 'raf', 'hylla' ] ],
    [ 'noun', 'Wardrobe', [ 'wardrobe', 'armoire', 'armario', 'armadio', 'schrank', 'kast', 'kaappi', 'dolap', 'garderob' ] ],
    [ 'noun', 'Statue', [ 'statue', 'estatua', 'statua', 'standbeeld', 'patsas', 'heykel', 'staty' ] ],
    [ 'noun', 'Painting', [ 'painting', 'tableau', 'quadro', 'cuadro', 'dipinto', 'bild', 'schilderij', 'taulu', 'tablo', 'tavla' ] ],
    [ 'noun', 'Clock', [ 'clock', 'horloge', 'relogio', 'reloj', 'orologio', 'uhr', 'klok', 'kello', 'saat', 'klocka' ] ],
    [ 'noun', 'Mirror', [ 'mirror', 'miroir', 'espelho', 'espejo', 'specchio', 'spiegel', 'peili', 'ayna', 'spegel' ] ],
    [ 'noun', 'Pillar', [ 'pillar', 'colonne', 'pilar', 'columna', 'coluna', 'colonna', 'pilastro', 'saule', 'pilaar', 'pylvas', 'sutun', 'pelare' ] ],
    [ 'noun', 'Roof', [ 'roof', 'toit', 'telhado', 'teto', 'tejado', 'tetto', 'dach', 'dak', 'katto', 'cati', 'tak' ] ],
    [ 'noun', 'Wall', [ 'wall', 'mur', 'parede', 'pared', 'muro', 'wand', 'muur', 'seina', 'duvar', 'vagg' ] ],
    [ 'noun', 'Floor', [ 'floor', 'sol', 'chao', 'piso', 'suelo', 'pavimento', 'boden', 'vloer', 'lattia', 'zemin', 'golv' ] ],
    [ 'noun', 'Tile', [ 'tile', 'dalle', 'carrelage', 'azulejo', 'baldosa', 'piastrella', 'fliese', 'tegel', 'laatta', 'fayans', 'kakel' ] ],
    [ 'noun', 'Fountain', [ 'fountain', 'fontaine', 'fonte', 'fuente', 'fontana', 'brunnen', 'fontein', 'suihkulahde', 'cesme', 'fontan' ] ],
    [ 'noun', 'Bat', [ 'bat', 'chauve', 'morcego', 'murcielago', 'pipistrello', 'fledermaus', 'vleermuis', 'lepakko', 'yarasa' ] ],
    [ 'noun', 'Pumpkin', [ 'pumpkin', 'citrouille', 'abobora', 'calabaza', 'zucca', 'kurbis', 'pompoen', 'kurpitsa', 'balkabagi' ] ],
    [ 'noun', 'Dragon', [ 'dragon', 'dragao', 'dragon', 'drago', 'drache', 'draak', 'lohikaarme', 'ejderha', 'drake' ] ],
    [ 'noun', 'Book', [ 'book', 'livre', 'livro', 'libro', 'buch', 'boek', 'kirja', 'kitap', 'bok' ] ],
    [ 'noun', 'Books', [ 'books', 'livres', 'livros', 'libros', 'libri', 'bucher', 'boeken', 'kirjat', 'kitaplar', 'bocker' ] ],
    [ 'noun', 'Box', [ 'box', 'boite', 'caixa', 'caja', 'scatola', 'kiste', 'doos', 'laatikko', 'kutu', 'lada' ] ],
    [ 'noun', 'Chest', [ 'chest', 'coffre', 'bau', 'cofre', 'baule', 'truhe', 'kist', 'arkku', 'sandik', 'kista' ] ],
    [ 'noun', 'Bathtub', [ 'bathtub', 'baignoire', 'banheira', 'banera', 'vasca', 'badewanne', 'badkuip', 'kylpyamme', 'kuvet' ] ],
    [ 'noun', 'Fireplace', [ 'fireplace', 'cheminee', 'lareira', 'chimenea', 'camino', 'kamin', 'openhaard', 'takka', 'somine' ] ],
    [ 'noun', 'Curtain', [ 'curtain', 'rideau', 'cortina', 'tenda', 'vorhang', 'gordijn', 'verho', 'perde', 'gardin' ] ],
    [ 'noun', 'Candle', [ 'candle', 'bougie', 'vela', 'candela', 'kerze', 'kaars', 'kynttila', 'mum', 'ljus' ] ],
    [ 'noun', 'Vase', [ 'vase', 'vaso', 'jarron', 'vaas', 'maljakko', 'vazo' ] ],
    [ 'noun', 'Fence', [ 'fence', 'barriere', 'cloture', 'cerca', 'valla', 'recinto', 'zaun', 'hek', 'aita', 'cit', 'staket' ] ],
    [ 'noun', 'Stairs', [ 'stairs', 'escalier', 'escada', 'escalera', 'scala', 'treppe', 'trap', 'portaat', 'merdiven', 'trappa' ] ],
    [ 'noun', 'Crab', [ 'crab', 'crabe', 'cangrejo', 'caranguejo', 'granchio', 'krabbe', 'krab', 'rapu', 'yengec', 'krabba' ] ],
    [ 'noun', 'Feast', [ 'feast', 'banquet', 'festin', 'banquete', 'banchetto', 'festmahl', 'bankett', 'feestmaal', 'juhla', 'ziyafet', 'festmaltid' ] ],
    [ 'noun', 'Tray', [ 'tray', 'platter', 'plateau', 'bandeja', 'vassoio', 'tablett', 'dienblad', 'tarjotin', 'tepsi', 'bricka' ] ],
    [ 'noun', 'Cold Cuts', [ 'charcuterie', 'charcuteries', 'frios', 'embutidos', 'salumi', 'aufschnitt', 'vleeswaren', 'leikkeleet', 'sarkuteri' ] ],
    [ 'noun', 'Sword', [ 'sword', 'epee', 'espada', 'spada', 'schwert', 'zwaard', 'miekka', 'kilic', 'svard' ] ],
    [ 'noun', 'Edge', [ 'edge', 'border', 'borda', 'bordure', 'borde', 'bordo', 'rand', 'reuna' ] ],
    [ 'noun', 'Sign', [ 'sign', 'panneau', 'placa', 'cartel', 'cartello', 'schild', 'bord', 'kyltti', 'tabela', 'skylt' ] ],
    // German Habbo furni words (plus other languages where common). Umlauts written without dots, sz as ss.
    [ 'noun', 'Chair', [ 'stuhl', 'stuhle' ] ],
    [ 'noun', 'Armchair', [ 'sessel', 'ohrensessel', 'lehnstuhl' ] ],
    [ 'noun', 'Sofa', [ 'sofa', 'couch', 'kanapee' ] ],
    [ 'noun', 'Corner Sofa', [ 'ecksofa', 'eckcouch' ] ],
    [ 'noun', 'Bench', [ 'bank', 'sitzbank', 'parkbank' ] ],
    [ 'noun', 'Stool', [ 'hocker', 'schemel', 'barhocker' ] ],
    [ 'noun', 'Table', [ 'tisch', 'tische', 'couchtisch', 'esstisch' ] ],
    [ 'noun', 'Coffee Table', [ 'kaffeetisch', 'beistelltisch' ] ],
    [ 'noun', 'Desk', [ 'schreibtisch', 'pult' ] ],
    [ 'noun', 'Bed', [ 'bett', 'betten' ] ],
    [ 'noun', 'Bunk Bed', [ 'etagenbett', 'hochbett' ] ],
    [ 'noun', 'Crib', [ 'kinderbett', 'wiege' ] ],
    [ 'noun', 'Shelf', [ 'regal', 'regale' ] ],
    [ 'noun', 'Bookshelf', [ 'bucherregal' ] ],
    [ 'noun', 'Wardrobe', [ 'schrank', 'kleiderschrank' ] ],
    [ 'noun', 'Cabinet', [ 'vitrine' ] ],
    [ 'noun', 'Dresser', [ 'kommode' ] ],
    [ 'noun', 'Nightstand', [ 'nachttisch', 'nachtschrank' ] ],
    [ 'noun', 'Chest', [ 'truhe', 'schatztruhe' ] ],
    [ 'noun', 'Crate', [ 'kiste', 'holzkiste' ] ],
    [ 'noun', 'Box', [ 'box', 'karton', 'schachtel' ] ],
    [ 'noun', 'Counter', [ 'theke', 'tresen' ] ],
    [ 'noun', 'Bar', [ 'bar' ] ],
    [ 'noun', 'Throne', [ 'thron' ] ],
    [ 'noun', 'Stairs', [ 'treppe', 'treppen', 'stufe', 'stufen' ] ],
    [ 'noun', 'Railing', [ 'gelander' ] ],
    [ 'noun', 'Fence', [ 'zaun' ] ],
    [ 'noun', 'Gate', [ 'tor', 'gartentor' ] ],
    [ 'noun', 'Door', [ 'tur', 'turen' ] ],
    [ 'noun', 'Window', [ 'fenster' ] ],
    [ 'noun', 'Wall', [ 'wand', 'mauer' ] ],
    [ 'noun', 'Floor', [ 'boden', 'fussboden' ] ],
    [ 'noun', 'Tile', [ 'fliese', 'fliesen', 'kachel' ] ],
    [ 'noun', 'Rug', [ 'teppich', 'matte' ] ],
    [ 'noun', 'Curtain', [ 'vorhang', 'gardine' ] ],
    [ 'noun', 'Blinds', [ 'jalousie', 'rollo' ] ],
    [ 'noun', 'Pillow', [ 'kissen', 'kopfkissen' ] ],
    [ 'noun', 'Blanket', [ 'decke' ] ],
    [ 'noun', 'Mirror', [ 'spiegel' ] ],
    [ 'noun', 'Clock', [ 'uhr', 'wanduhr' ] ],
    [ 'noun', 'Picture', [ 'bild', 'gemalde', 'poster' ] ],
    [ 'noun', 'Frame', [ 'rahmen', 'bilderrahmen' ] ],
    [ 'noun', 'Lamp', [ 'lampe', 'lampen' ] ],
    [ 'noun', 'Light', [ 'licht', 'leuchte' ] ],
    [ 'noun', 'Chandelier', [ 'kronleuchter' ] ],
    [ 'noun', 'Candle', [ 'kerze', 'kerzen' ] ],
    [ 'noun', 'Fireplace', [ 'kamin' ] ],
    [ 'noun', 'Radiator', [ 'heizung', 'heizkorper' ] ],
    [ 'noun', 'Fan', [ 'ventilator' ] ],
    [ 'noun', 'Fridge', [ 'kuhlschrank', 'refrigerateur', 'frigo', 'geladeira', 'nevera', 'koelkast' ] ],
    [ 'noun', 'Stove', [ 'herd', 'cuisiniere', 'fogao', 'estufa', 'fornuis' ] ],
    [ 'noun', 'Oven', [ 'ofen', 'backofen', 'forno', 'horno' ] ],
    [ 'noun', 'Microwave', [ 'mikrowelle', 'microondas', 'micro-ondes', 'magnetron' ] ],
    [ 'noun', 'Sink', [ 'waschbecken', 'spule', 'evier', 'pia', 'lavabo', 'gootsteen' ] ],
    [ 'noun', 'Toilet', [ 'toilette', 'klo', 'wc', 'toilettes', 'privada', 'inodoro' ] ],
    [ 'noun', 'Shower', [ 'dusche', 'douche', 'chuveiro', 'ducha' ] ],
    [ 'noun', 'Bathtub', [ 'badewanne', 'wanne' ] ],
    [ 'noun', 'Kitchen', [ 'kuche', 'cuisine', 'cozinha', 'cocina', 'keuken' ] ],
    [ 'noun', 'Bathroom', [ 'badezimmer', 'bad' ] ],
    [ 'noun', 'Cup', [ 'tasse', 'becher' ] ],
    [ 'noun', 'Plate', [ 'teller' ] ],
    [ 'noun', 'Glass', [ 'glas' ] ],
    [ 'noun', 'Bottle', [ 'flasche' ] ],
    [ 'noun', 'Pot', [ 'topf' ] ],
    [ 'noun', 'Pan', [ 'pfanne' ] ],
    [ 'noun', 'House', [ 'haus', 'hauschen', 'maison', 'casa', 'huis' ] ],
    [ 'noun', 'Castle', [ 'schloss', 'burg', 'chateau', 'castelo', 'castillo', 'kasteel' ] ],
    [ 'noun', 'Tower', [ 'turm', 'torre', 'toren' ] ],
    [ 'noun', 'Bridge', [ 'brucke', 'pont', 'ponte', 'puente', 'brug' ] ],
    [ 'noun', 'Roof', [ 'dach' ] ],
    [ 'noun', 'Column', [ 'saule' ] ],
    [ 'noun', 'Arch', [ 'bogen', 'torbogen' ] ],
    [ 'noun', 'Garden', [ 'garten', 'jardin', 'jardim', 'tuin' ] ],
    [ 'noun', 'Pool', [ 'pool', 'schwimmbad', 'becken', 'piscine', 'piscina', 'zwembad' ] ],
    [ 'noun', 'Fountain', [ 'brunnen' ] ],
    [ 'noun', 'Pond', [ 'teich' ] ],
    [ 'noun', 'Tree', [ 'baum', 'baume' ] ],
    [ 'noun', 'Bush', [ 'busch', 'strauch', 'hecke' ] ],
    [ 'noun', 'Hedge', [ 'hecke' ] ],
    [ 'noun', 'Flower', [ 'blume', 'bluten' ] ],
    [ 'noun', 'Flowers', [ 'blumen' ] ],
    [ 'noun', 'Plant', [ 'pflanze', 'pflanzen', 'topfpflanze' ] ],
    [ 'noun', 'Grass', [ 'gras', 'rasen' ] ],
    [ 'noun', 'Rock', [ 'fels', 'felsen' ] ],
    [ 'noun', 'Stone', [ 'stein', 'steine' ] ],
    [ 'noun', 'Sand', [ 'sand' ] ],
    [ 'noun', 'Water', [ 'wasser', 'eau', 'agua' ] ],
    [ 'noun', 'Fire', [ 'feuer', 'feu', 'fogo', 'fuego', 'vuur' ] ],
    [ 'noun', 'Ice', [ 'eis' ] ],
    [ 'noun', 'Snow', [ 'schnee', 'neige', 'neve', 'nieve', 'sneeuw' ] ],
    [ 'noun', 'Snowman', [ 'schneemann' ] ],
    [ 'noun', 'Sun', [ 'sonne', 'soleil', 'sol', 'zon' ] ],
    [ 'noun', 'Moon', [ 'mond', 'lune', 'lua', 'luna', 'maan' ] ],
    [ 'noun', 'Star', [ 'stern', 'sterne', 'etoile', 'estrela', 'estrella', 'ster' ] ],
    [ 'noun', 'Cloud', [ 'wolke', 'wolken', 'nuage', 'nuvem', 'nube', 'wolk' ] ],
    [ 'noun', 'Rainbow', [ 'regenbogen', 'arc-en-ciel', 'arco-iris' ] ],
    [ 'noun', 'Christmas Tree', [ 'weihnachtsbaum', 'tannenbaum' ] ],
    [ 'noun', 'Gift', [ 'geschenk', 'geschenke', 'cadeau', 'presente', 'regalo' ] ],
    [ 'noun', 'Present', [ 'prasent' ] ],
    [ 'noun', 'Pumpkin', [ 'kurbis' ] ],
    [ 'noun', 'Ghost', [ 'geist', 'gespenst', 'fantome', 'fantasma' ] ],
    [ 'noun', 'Skeleton', [ 'skelett', 'squelette', 'esqueleto' ] ],
    [ 'noun', 'Coffin', [ 'sarg', 'cercueil', 'caixao', 'ataud' ] ],
    [ 'noun', 'Grave', [ 'grab', 'tombe', 'tumulo', 'tumba' ] ],
    [ 'noun', 'Egg', [ 'ei', 'eier', 'oeuf', 'ovo', 'huevo' ] ],
    [ 'noun', 'Heart', [ 'herz', 'herzen', 'coeur', 'coracao', 'corazon' ] ],
    [ 'noun', 'Balloon', [ 'ballon', 'luftballon' ] ],
    [ 'noun', 'Ball', [ 'ball' ] ],
    [ 'noun', 'Goal', [ 'tor' ] ],
    [ 'noun', 'Trophy', [ 'pokal', 'trophae' ] ],
    [ 'noun', 'Crown', [ 'krone', 'couronne', 'coroa', 'corona', 'kroon' ] ],
    [ 'noun', 'King', [ 'konig', 'roi', 'rei', 'rey', 'koning' ] ],
    [ 'noun', 'Queen', [ 'konigin', 'reine', 'rainha', 'reina', 'koningin' ] ],
    [ 'noun', 'Knight', [ 'ritter', 'chevalier', 'cavaleiro', 'caballero', 'ridder' ] ],
    [ 'noun', 'Pirate', [ 'pirat', 'pirate', 'pirata', 'piraat' ] ],
    [ 'noun', 'Ship', [ 'schiff', 'navire', 'navio', 'barco', 'schip' ] ],
    [ 'noun', 'Boat', [ 'bateau' ] ],
    [ 'noun', 'Car', [ 'auto', 'voiture', 'carro', 'coche' ] ],
    [ 'noun', 'Rocket', [ 'rakete', 'fusee', 'foguete', 'cohete', 'raket' ] ],
    [ 'noun', 'Robot', [ 'roboter' ] ],
    [ 'noun', 'Computer', [ 'computer', 'rechner', 'ordinateur', 'computador' ] ],
    [ 'noun', 'TV', [ 'fernseher', 'tv', 'television', 'televisao' ] ],
    [ 'noun', 'Radio', [ 'radio' ] ],
    [ 'noun', 'Speaker', [ 'lautsprecher', 'box' ] ],
    [ 'noun', 'Guitar', [ 'gitarre', 'guitare', 'guitarra', 'gitaar' ] ],
    [ 'noun', 'Piano', [ 'klavier', 'flugel' ] ],
    [ 'noun', 'Drum', [ 'trommel', 'schlagzeug' ] ],
    [ 'noun', 'Book', [ 'buch' ] ],
    [ 'noun', 'Books', [ 'bucher' ] ],
    [ 'noun', 'Sword', [ 'schwert' ] ],
    [ 'noun', 'Shield', [ 'schild' ] ],
    [ 'noun', 'Flag', [ 'flagge', 'fahne', 'drapeau', 'bandeira', 'bandera', 'vlag' ] ],
    [ 'noun', 'Sign', [ 'schild' ] ],
    [ 'noun', 'Poster', [ 'poster', 'plakat' ] ],
    [ 'noun', 'Dog', [ 'hund', 'chien', 'cachorro', 'perro', 'hond' ] ],
    [ 'noun', 'Cat', [ 'katze', 'gato', 'kat' ] ],
    [ 'noun', 'Fish', [ 'fisch', 'poisson', 'peixe', 'pez', 'vis' ] ],
    [ 'noun', 'Bird', [ 'vogel', 'oiseau', 'passaro', 'pajaro' ] ],
    [ 'noun', 'Duck', [ 'ente', 'canard', 'pato', 'eend' ] ],
    [ 'noun', 'Horse', [ 'pferd', 'cheval', 'cavalo', 'caballo', 'paard' ] ],
    [ 'noun', 'Bear', [ 'bar', 'ours', 'urso', 'oso', 'beer' ] ],
    [ 'noun', 'Lion', [ 'lowe', 'lion', 'leao', 'leon', 'leeuw' ] ],
    [ 'noun', 'Snake', [ 'schlange', 'serpent', 'cobra', 'serpiente', 'slang' ] ],
    [ 'noun', 'Spider', [ 'spinne', 'araignee', 'aranha', 'arana' ] ],
    [ 'noun', 'Owl', [ 'eule', 'hibou', 'coruja', 'buho', 'uil' ] ],
    [ 'noun', 'Frog', [ 'frosch', 'grenouille', 'sapo', 'rana', 'kikker' ] ],
    [ 'noun', 'Dragon', [ 'drache', 'drachen' ] ],
    [ 'noun', 'Unicorn', [ 'einhorn', 'licorne', 'unicornio', 'eenhoorn' ] ],
    [ 'noun', 'Cake', [ 'kuchen', 'torte', 'gateau', 'bolo', 'pastel', 'taart' ] ],
    [ 'noun', 'Ice Cream', [ 'eiscreme', 'glace', 'sorvete', 'helado', 'ijsje' ] ],
    [ 'noun', 'Candy', [ 'bonbon', 'sussigkeit' ] ],
    [ 'noun', 'Pizza', [ 'pizza' ] ],
    [ 'noun', 'Bread', [ 'brot', 'pain', 'pao', 'brood' ] ],
    [ 'noun', 'Fruit', [ 'obst', 'frucht' ] ],
    [ 'noun', 'Apple', [ 'apfel', 'pomme', 'maca', 'manzana', 'appel' ] ],
    [ 'noun', 'Coffee', [ 'kaffee', 'cafe', 'koffie' ] ],
    [ 'noun', 'Tea', [ 'tee', 'the', 'cha', 'te', 'thee' ] ],
    [ 'adj', 'Wooden', [ 'holz', 'holzern' ] ],
    [ 'adj', 'Metal', [ 'metall', 'eisen' ] ],
    [ 'adj', 'Golden', [ 'golden', 'goldene', 'goldener' ] ],
    [ 'adj', 'Old', [ 'alter', 'altes' ] ],
    [ 'adj', 'New', [ 'neuer', 'neues' ] ],
    [ 'adj', 'Big', [ 'grosse', 'grosser', 'grosses' ] ],
    [ 'adj', 'Small', [ 'kleiner', 'kleines', 'mini' ] ],
    [ 'adj', 'Round', [ 'runder', 'rundes' ] ],
    [ 'adj', 'Square', [ 'eckig', 'quadratisch' ] ],
    [ 'adj', 'Corner', [ 'eck', 'ecke' ] ],
    [ 'adj', 'Double', [ 'doppel', 'doppelt' ] ],
    [ 'adj', 'High', [ 'hoch', 'hoher', 'hohe' ] ],
    [ 'adj', 'Low', [ 'niedrig', 'niedrige' ] ],
    [ 'adj', 'Dark', [ 'dunkel', 'dunkle', 'dunkler' ] ],
    [ 'adj', 'Light', [ 'hell', 'helle', 'heller' ] ],
    [ 'adj', 'Modern', [ 'modern', 'moderne', 'moderner' ] ],
    [ 'adj', 'Classic', [ 'klassisch', 'klassische' ] ],
    [ 'adj', 'Royal', [ 'koniglich', 'konigliche' ] ],
    [ 'adj', 'Big', [ 'gross' ] ],
    [ 'adj', 'Small', [ 'klein' ] ],
    [ 'adj', 'Old', [ 'alt' ] ],
    [ 'adj', 'New', [ 'neu' ] ],
    [ 'adj', 'Round', [ 'rund' ] ],
    [ 'adj', 'Wooden', [ 'holzern' ] ],
    [ 'adj', 'Magic', [ 'magisch', 'magische', 'zauber' ] ],
    [ 'adj', 'Haunted', [ 'verfluchte', 'spuk' ] ],
    [ 'adj', 'Frozen', [ 'gefroren' ] ],
    [ 'adj', 'Christmas', [ 'weihnachts', 'weihnachtlich' ] ],
    [ 'adj', 'Easter', [ 'oster' ] ],
    [ 'adj', 'Summer', [ 'sommer' ] ],
    [ 'adj', 'Winter', [ 'winter' ] ],
    [ 'adj', 'Spring', [ 'fruhling' ] ],
    [ 'adj', 'Autumn', [ 'herbst' ] ],
    [ 'adj', 'Red', [ 'roter', 'rotes' ] ],
    [ 'adj', 'Blue', [ 'blauer', 'blaues' ] ],
    [ 'adj', 'Green', [ 'gruner', 'grunes' ] ],
    [ 'adj', 'Yellow', [ 'gelber', 'gelbes' ] ],
    [ 'adj', 'Black', [ 'schwarzer', 'schwarzes' ] ],
    [ 'adj', 'White', [ 'weisser', 'weisses' ] ],
    [ 'adj', 'Pink', [ 'pinker', 'rosa' ] ],
    [ 'adj', 'Purple', [ 'lila', 'violett' ] ],
    [ 'adj', 'Orange', [ 'orange' ] ],
    [ 'adj', 'Brown', [ 'brauner', 'braunes' ] ],
    [ 'adj', 'Grey', [ 'grauer', 'graues' ] ],
    [ 'adj', 'Silver', [ 'silberner', 'silbernes' ] ],
    // short common words (2026-09-28): the learner skips words under 4 letters, so these are hand-made. Each one checked
    // against the 85-hotel index (C:/tools/stock_retro/shortwords.py: which English word the same furni has in English)
    [ 'noun', 'Light', [ 'luz', 'lumiere', 'luce' ] ],
    [ 'noun', 'Lights', [ 'luzes', 'lumieres', 'luci', 'lichter' ] ],
    [ 'noun', 'Sea', [ 'mar', 'mer', 'mare', 'zee', 'meer' ] ],
    [ 'adj', 'Christmas', [ 'natal', 'noel', 'natale', 'navidad', 'kerst', 'navideno', 'navidena' ] ],
    [ 'noun', 'Sun', [ 'sole' ] ],
    [ 'noun', 'King', [ 'kral' ] ],
    [ 'noun', 'House', [ 'ev' ] ],
    [ 'noun', 'Hand', [ 'mano', 'mao' ] ],
    [ 'noun', 'Eye', [ 'ojo', 'olho', 'oeil', 'auge', 'oog', 'goz' ] ],
    [ 'noun', 'Wine', [ 'vin', 'vino', 'vinho', 'wein', 'wijn', 'sarap' ] ],
    [ 'noun', 'Bread', [ 'pane' ] ],
    [ 'adj', 'Gold', [ 'goud' ] ],
    // "lampara de pie" / "candeeiro de pe" = standing lamp (the PHRASES below turn "de pie" into "standing")
    [ 'adj', 'Standing', [ 'standing' ] ],
    // frequent words the learner still missed (English synonyms split its vote); each checked with shortwords.py
    [ 'noun', 'Counter', [ 'bancone', 'encimera' ] ],
    [ 'noun', 'Barrier', [ 'barreira' ] ],
    [ 'noun', 'Coffee', [ 'caffe' ] ],
    [ 'adj', 'Floral', [ 'cicekli' ] ],
    [ 'noun', 'Divider', [ 'cloison' ] ],
    [ 'adj', 'Giant', [ 'gigante', 'geant', 'geante' ] ],
    [ 'noun', 'Cherry Tree', [ 'kirschbaum' ] ],
    [ 'noun', 'Sign', [ 'insegna' ] ],
    [ 'adj', 'Lime', [ 'limao' ] ],
    [ 'noun', 'Pot', [ 'maceta' ] ],
    [ 'noun', 'Furniture', [ 'mueble', 'muebles' ] ],
    [ 'noun', 'Painting', [ 'peinture' ] ],
    [ 'noun', 'Display', [ 'presentoir' ] ],
    [ 'adj', 'Rustic', [ 'rustico', 'rustica' ] ],
    [ 'noun', 'Snake', [ 'serpente' ] ],
    [ 'noun', 'Ceiling', [ 'techo' ] ],
    [ 'adj', 'Long', [ 'uzun' ] ],
    [ 'adj', 'Valentine', [ 'valentino' ] ],
    [ 'adj', 'Colorful', [ 'renkli' ] ],
    [ 'adj', 'Tradeable', [ 'ruilbaar' ] ],
    [ 'adj', 'Not', [ 'niet' ] ],
    [ 'noun', 'Circus', [ 'circo', 'cirque' ] ],
    // seco / secca = dry in the index ("Hierba Seca" is the Dried Grass furni)
    [ 'adj', 'Dried', [ 'seca', 'seco', 'secas', 'secos', 'secca', 'secco', 'kuru' ] ],
];

// multi-word names of one thing, joined before translating
const PHRASES: [ RegExp, string ][] = [
    [ /\bchauve[\s_-]+souris\b/gi, 'bat' ],
    [ /\bsac[\s_]+de[\s_]+couchage\b/gi, 'sleepingbag' ],
    [ /\bsaco[\s_]+de[\s_]+dormir\b/gi, 'sleepingbag' ],
    [ /\bpalmier\b/gi, 'palm tree' ],
    // "de pie" (es) / "de pé" (pt): standing, not "of foot" (Lámpara de pie = Standing Lamp)
    [ /\bde[\s_]+pi[eé](?![a-zà-ÿ])/gi, 'standing' ],
    [ /\bde[\s_]+p[eé](?![a-zà-ÿ])/gi, 'standing' ]
];

const DICTIONARY = new Map<string, { kind: Kind, en: string }>();

for(const [ kind, en, words ] of entries) for(const word of words) if(!DICTIONARY.has(word)) DICTIONARY.set(word, { kind, en });

// words that only glue "X of Y" together (dropped; the part after them moves in front)
// foreign "of / in" words that glue "X of Y" together (dropped; the part after them moves in front). English "of" is not
// one of them: "Game of Thrones" stays as it is.
const LINKS = [ 'de', 'du', 'des', 'da', 'do', 'das', 'dos', 'del', 'di', 'della', 'dello', 'van', 'von', 'der', 'aus', 'en', 'em',
    // "à / au / aux" (fr), "ao / aos / à" (pt), "al / alla / ai" (es, it), "zum / zur" (de): Machine à café = Coffee Machine
    'a', 'au', 'aux', 'ao', 'aos', 'al', 'alla', 'alle', 'ai', 'zum', 'zur' ];
// "and" in the hotel languages: the name is translated on both sides of it (Sol y Luna -> Floor and Moon)
const AND_WORDS = [ 'y', 'e', 'et', 'und', 've', 'och', 'ja' ];
const ARTICLES = [ 'le', 'la', 'les', 'l', 'o', 'os', 'as', 'el', 'los', 'las', 'il', 'lo', 'gli', 'die', 'het', 'een', 'un', 'une', 'um', 'uma', 'the' ];

// letters NFD does not take apart: ß, Turkish dotless ı, ł, ø, æ, œ
const plain = (word: string) => word.toLowerCase().replace(/ß/g, 'ss').replace(/ı/g, 'i').replace(/ł/g, 'l').replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '');
// unknown words keep their own capitals (IKEA, McDonald), only the first letter is raised
const title = (word: string) => word ? (word.charAt(0).toUpperCase() + word.slice(1)) : word;
const ROMAN = /^(x{0,3})(ix|iv|v?i{0,3})$/i;
// numbers and roman numerals ("2", "II") are series markers: they stay at the end, roman numerals in capitals
const isMarker = (word: string) => /^\d+$/.test(word) || (ROMAN.test(word) && (word.length > 0) && (word.length <= 4) && !/^[vx]$/i.test(word) && (word.toLowerCase() !== 'i' || false));

interface Token { text: string, kind: Kind | null }

// diminutives: telhadinho -> telhado + small, casita -> casa + small, maisonnette -> maison + small
const DIMINUTIVES: [ RegExp, string[] ][] = [ [ /(zinho|zinha|inho|inha)$/, [ 'o', 'a', '' ] ], [ /(ito|ita|illo|illa)$/, [ 'o', 'a', '' ] ], [ /(ette|chen|tje|je)$/, [ '', 'e' ] ] ];

// Word translations staff added in the Furni Editor's Words tab (hcms_furni_words, sent by the plugin). They win over the
// hand-made and learned words, so they also correct a wrong learned word.
const CUSTOM = new Map<string, { kind: Kind, en: string }>();

export const SetCustomWords = (words: { word: string, english: string, kind: string }[]) =>
{
    CUSTOM.clear();

    for(const w of words) CUSTOM.set(w.word, { kind: (w.kind === 'adj') ? 'adj' : 'noun', en: w.english });
}

/** The form a word is stored in (lower case, no accents or punctuation around it): "Nebelmaschine," -> nebelmaschine */
export const PlainWord = (word: string) => plain(word || '').replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');

// English words that act like adjectives in English furni names: they go before the noun (Dried Grass, Golden Throne).
// From build-furni-words.py (a word nearly always in front in the English names), plus the usual English endings.
const ADJECTIVE_WORDS = new Set<string>(ENGLISH_ADJECTIVES as string[]);
const englishKind = (english: string): Kind =>
{
    const w = plain(english || '').split(' ')[0];
    const meaning = DICTIONARY.get(w);

    if(meaning) return meaning.kind;

    return (ADJECTIVE_WORDS.has(w) || ((w.length > 4) && /(ed|ful|ous|less|ive)$/.test(w))) ? 'adj' : 'noun';
}

const lookupKnown = (word: string): { kind: Kind, en: string, small?: boolean } =>
{
    // brackets / quotes around a word don't matter: "(Yeşil)" -> yesil
    const w = PlainWord(word);
    const custom = CUSTOM.get(w);

    if(custom) return custom;

    const known = DICTIONARY.get(w);

    if(known) return known;

    // German adjective endings: koniglicher / konigliches / koniglichen -> koniglich, grosses -> gross
    for(const ending of [ 'em', 'en', 'er', 'es', 'e' ])
    {
        if(!w.endsWith(ending) || (w.length - ending.length < 3)) continue;

        const found = DICTIONARY.get(w.slice(0, -ending.length));

        if(found && (found.kind === 'adj')) return found;
    }

    // plural of a hand-made word (glaces -> glace) wins over anything learned
    for(const singular of [ w.replace(/es$/, ''), w.replace(/s$/, '') ])
    {
        const found = (singular !== w) && DICTIONARY.get(singular);

        // a noun stays plural in English (chaises -> Chairs); adjectives have no plural in English (rouges -> Red)
        if(found) return (found.kind === 'noun' && !/s$/i.test(found.en)) ? { ...found, en: found.en + 's' } : found;
    }

    // words learned from the 85-hotel names index (C:/tools/stock_retro/build-furni-words.py -> furni-words.json):
    // an adjective when its English meaning is one in the hand-made list above, otherwise a noun
    const learned = (LEARNED_WORDS as Record<string, string>)[w];

    if(learned)
    {
        const meaning = DICTIONARY.get(learned);

        return { kind: englishKind(learned), en: meaning ? meaning.en : title(learned) };
    }

    for(const [ ending, bases ] of DIMINUTIVES)
    {
        if(!ending.test(w)) continue;

        for(const base of bases)
        {
            const found = DICTIONARY.get(w.replace(ending, base));

            if(found) return { ...found, small: true };
        }
    }

    return null;
}

// ---- suggestions (C:/tools/stock_retro/build-furni-words.py -> furni-word-suggestions.json on the CDN): English words
// seen next to a foreign word in the 85-hotel names index, not certain enough for the dictionary. Loaded once when a
// staff member opens the Furni Editor (1.3MB, never part of the client bundle). { word: [ [english, share, names], ... ] }
let SUGGESTIONS: Record<string, [ string, number, number? ][]> = null;
let suggestionsLoading: Promise<void> = null;
const suggestionListeners = new Set<() => void>();

export const LoadWordSuggestions = (url: string): Promise<void> =>
{
    if(SUGGESTIONS || suggestionsLoading || !url) return suggestionsLoading || Promise.resolve();

    suggestionsLoading = fetch(url).then(response => (response.ok ? response.json() : {})).then(data =>
    {
        SUGGESTIONS = data || {};
        suggestionListeners.forEach(listener => listener());
    }).catch(() => { SUGGESTIONS = {}; });

    return suggestionsLoading;
}

export const OnWordSuggestionsLoaded = (listener: () => void) =>
{
    suggestionListeners.add(listener);

    return () => { suggestionListeners.delete(listener); };
}

/** The best English guess for a word the dictionary doesn't know, with how sure it is (0-1), or null. */
export const SuggestWord = (word: string): { en: string, share: number, names: number, clear: boolean } =>
{
    const found = SUGGESTIONS && SUGGESTIONS[PlainWord(word)];

    if(!found || !found.length) return null;

    const names = (found[0][2] || 1);

    // clear = the best guess is seen in more names than the runner-up (no tie)
    return { en: title(found[0][0]), share: found[0][1], names, clear: (found.length < 2) || (names > (found[1][2] || 1)) };
}

/** Translation also uses a suggestion by itself when it is fairly sure: >= 2 names and >= 50% of them agree. */
const SUGGESTION_AUTO_SHARE = 0.5;
const SUGGESTION_AUTO_NAMES = 2;

const lookup = (word: string): { kind: Kind, en: string, small?: boolean } =>
{
    const known = lookupKnown(word);

    if(known) return known;

    const suggestion = SuggestWord(word);

    if(!suggestion || !suggestion.clear || (suggestion.share < SUGGESTION_AUTO_SHARE) || (suggestion.names < SUGGESTION_AUTO_NAMES)) return null;

    const meaning = DICTIONARY.get(PlainWord(suggestion.en));

    return { kind: englishKind(suggestion.en), en: meaning ? meaning.en : suggestion.en };
}

const toTokens = (words: string[]): Token[] => words.flatMap(word =>
{
    const known = lookup(word);

    // an unknown long word may be a compound of known words (German: Holzstuhl = Holz + Stuhl -> Wooden Chair)
    if(!known && (word.length >= 6))
    {
        const parts = splitGlued(word);

        // the parts stay together and in their order (Eismaschine -> "Ice Machine"), as one token of the last part's kind
        if(parts.length > 1)
        {
            const inner = toTokens(parts);

            return [ { text: inner.map(t => t.text).join(' '), kind: inner[inner.length - 1].kind } ];
        }
    }

    // an English word the dictionary doesn't know (an English name in the wrong order: "Grass Dried") still has its role
    if(!known) return [ { text: title(word), kind: (englishKind(word) === 'adj') ? 'adj' as Kind : null } ];

    return known.small ? [ { text: 'Small', kind: 'adj' as Kind }, { text: known.en, kind: known.kind } ] : [ { text: known.en, kind: known.kind } ];
});

// adjectives first, then everything else in its order
const englishOrder = (tokens: Token[]) => [ ...tokens.filter(t => t.kind === 'adj'), ...tokens.filter(t => t.kind !== 'adj') ];

/** English name suggestion for a furni name in any of the listed languages (or an English name in the wrong order). */
export const TranslateFurniName = (name: string): string =>
{
    const original = (name || '').replace(/\s+/g, ' ').trim();
    let text = original;

    for(const [ pattern, replacement ] of PHRASES) text = text.replace(pattern, replacement);

    // a hyphenated word the dictionary doesn't know as a whole is split (Grün-Gestreifte -> Grün Gestreifte)
    const all = text.replace(/[_*]+/g, ' ').split(/\s+/).flatMap(w => (w.includes('-') && !lookup(w.replace(/-/g, ''))) ? w.split('-') : [ w ]).filter(w => w.length);

    // nothing this translator knows (not even as parts of a compound): leave the name exactly as it is
    if(!all.some(w => lookup(w) || (w.length >= 6 && splitGlued(w).length > 1))) return original;

    const markers = all.filter(isMarker).map(w => /^\d+$/.test(w) ? w : w.toUpperCase());
    const words = all.filter(w => !isMarker(w) && !ARTICLES.includes(plain(w)));

    if(!words.length) return original;

    // "X y Y" / "X et Y": translate each side on its own and join them with "and"
    const and = words.findIndex((w, i) => (i > 0) && (i < words.length - 1) && AND_WORDS.includes(plain(w)));

    if(and > 0) return [ TranslateFurniName(words.slice(0, and).join(' ')), 'and', TranslateFurniName(words.slice(and + 1).join(' ')), ...markers ].join(' ');

    let tokens: Token[];

    // "X de Y" (Romance / Dutch / German genitive) -> "Y X": Livros de Magia -> Magic Books
    const link = words.findIndex((w, i) => (i > 0) && (i < words.length - 1) && LINKS.includes(plain(w)));

    if(link > 0)
    {
        const head = toTokens(words.slice(0, link));
        const tail = toTokens(words.slice(link + 1).filter(w => !LINKS.includes(plain(w))));

        tokens = [ ...englishOrder(tail), ...englishOrder(head) ];
    }
    else tokens = englishOrder(toTokens(words));

    const small = [ 'of', 'the', 'and', 'a', 'an', 'with', 'in', 'on' ];

    return [ ...tokens.map((t, i) => ((i > 0) && small.includes(t.text.toLowerCase())) ? t.text.toLowerCase() : t.text), ...markers ].join(' ');
}

/** Placeholder "names" some hotels ship (classname_name, raw classnames): not offered as a name. */
export const IsPlaceholderName = (name: string) => /(_name|_desc)$/i.test((name || '').trim()) || /[a-z0-9]+_[a-z0-9_]+ name$/i.test((name || '').trim()) || /^[a-z0-9]+(_[a-z0-9*]+)+$/i.test((name || '').trim());

/** True when the name has a word from another language, or is English with the words in the wrong order. */
export const NeedsTranslation = (name: string) =>
{
    const suggestion = TranslateFurniName(name);

    return !!suggestion && (suggestion !== (name || '').trim());
}

/** The name's words in English where the dictionary knows them (lower case), for the sit / lay / walk name rules. */
export const EnglishWords = (name: string): string[] =>
{
    let text = (name || '');

    for(const [ pattern, replacement ] of PHRASES) text = text.replace(pattern, replacement);

    return text.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[^A-Za-zÀ-ſ]+/).filter(w => w.length > 1).flatMap(word =>
    {
        const known = DICTIONARY.get(plain(word));

        return known ? known.en.toLowerCase().split(' ') : [ plain(word) ];
    });
}

const LINK_LETTERS = [ 'n', 's', 'en', 'e', 'es', 'er' ];

// splits a glued word into dictionary words when it can be split completely ("pilarazul" -> [ "pilar", "azul" ])
const splitGlued = (word: string): string[] =>
{
    const w = plain(word);

    if(lookupKnown(w) || (w.length < 6)) return [ word ];

    for(let i = w.length - 3; i >= 3; i--)
    {
        const right = w.slice(i);
        // the left part may carry a German linking letter: Drache-n-lampe, Geburtstag-s-kuchen
        const left = [ w.slice(0, i), ...LINK_LETTERS.filter(l => w.slice(0, i).endsWith(l) && (i - l.length >= 3)).map(l => w.slice(0, i - l.length)) ].find(part => !!lookupKnown(part));

        if(!left) continue;

        const rest = splitGlued(right);

        if(rest.every(part => !!lookupKnown(part))) return [ left, ...rest ];
    }

    return [ word ];
}

/** True when the name is missing or just the classname / file name ("minidisco_kdh_25", "Minidisco Kdh"). */
export const LooksLikeClassname = (name: string, itemName: string) =>
{
    const a = plain(name || '').replace(/[^a-z0-9]/g, ''), b = plain((itemName || '').split('*')[0]).replace(/[^a-z0-9]/g, '');

    return !a || (a === b) || (!!b && b.startsWith(a) && (a.length >= b.length - 6)) || /^[a-z0-9]+(_[a-z0-9]+)+$/i.test((name || '').trim());
}

/** A readable English name made from the classname ("pilarazul_kdh_25" -> "Blue Pillar"). */
export const ConvertClassname = (itemName: string): string =>
{
    const words = (itemName || '').split('*')[0]
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(/[^A-Za-z0-9\u00C0-\u017F]+/)
        .filter(w => w.length && !/\d/.test(w))
        .flatMap(splitGlued)
        // short set / creator codes (kdh, cf, hc, xm...) are dropped unless they are a real word
        .filter(w => !!lookup(w) || (w.length > 3));

    return words.length ? TranslateFurniName(words.join(' ')) : '';
}

/** Word-by-word translation hints for a name: every word the translator knows, with its English meaning. */
export const WordHints = (name: string): { word: string, en: string }[] =>
{
    let text = (name || '');

    for(const [ pattern, replacement ] of PHRASES) text = text.replace(pattern, replacement);

    const hints: { word: string, en: string }[] = [];

    for(const word of text.replace(/[_*]+/g, ' ').split(/\s+/).filter(w => w.length > 1))
    {
        if(ARTICLES.includes(plain(word)) || LINKS.includes(plain(word)) || isMarker(word)) continue;

        const known = lookupKnown(word);

        if(known && (plain(known.en) !== plain(word))) hints.push({ word, en: (known.small ? 'Small ' : '') + known.en });
    }

    return hints;
}

/** The words of a name the translator doesn't know (not even as parts of a compound): the ones worth adding. */
export const UnknownWords = (name: string): string[] =>
{
    let text = (name || '');

    for(const [ pattern, replacement ] of PHRASES) text = text.replace(pattern, replacement);

    const seen = new Set<string>();

    return text.replace(/[_*]+/g, ' ').split(/[\s-]+/).filter(word =>
    {
        const w = PlainWord(word);

        if((w.length < 3) || /\d/.test(w) || seen.has(w) || ARTICLES.includes(w) || LINKS.includes(w) || isMarker(word)) return false;

        seen.add(w);

        return !lookupKnown(w) && (splitGlued(w).length < 2);
    });
}
