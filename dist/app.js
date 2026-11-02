const el = id => document.getElementById(id);
let levels = [];
let selectedCategory, selectedLevel, selectedChapter, session, revealed = false, view = 'home';

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function announce(text) { el('notice').textContent = text; }
function topicUrl(topic) { return `#${selectedLevel.id}/${topic.id}`; }
function updateSidebar() {
  el('chapters').replaceChildren();
  for (const level of levels) {
    const link = node('a', 'chapter'); link.href = `#${level.id}`;
    link.classList.toggle('active', selectedLevel?.id === level.id);
    if (selectedLevel?.id === level.id) link.setAttribute('aria-current', 'page');
    link.append(node('span', 'chapter-icon', level.title));
    const copy = node('span'); copy.append(node('strong', '', level.label), node('small', '', 'Konu koleksiyonları'));
    link.append(copy); el('chapters').append(link);
  }
}
function route() {
  const parts = location.hash.slice(1).split('/');
  selectedLevel = levels.find(level => level.id === parts[0]);
  selectedChapter = selectedLevel?.topics.find(topic => topic.id === parts[1]);
  selectedCategory = selectedLevel && levelCategories(selectedLevel).find(category => category.id === (parts[1] === 'category' ? parts[2] : selectedChapter?.categoryId || '__uncategorized'));
  view = selectedChapter ? 'study' : selectedLevel ? (parts[1] === 'category' && selectedCategory ? 'topics' : 'categories') : 'home';
  revealed = false; session = null;
  el('catalog').hidden = !['home', 'categories', 'topics'].includes(view);
  el('study').hidden = view !== 'study';
  el('round-results').hidden = true;
  el('breadcrumb').textContent = selectedChapter ? `${selectedLevel.title} / ${selectedChapter.title}` : selectedLevel ? `${selectedLevel.title} / ${view === 'categories' ? 'Kategoriler' : selectedCategory?.title || 'Kategoriler'}` : 'Seviyeler';
  el('level-badge').textContent = selectedLevel ? `${selectedLevel.title} · ${selectedLevel.label}` : 'DE · KELİME KOLEKSİYONU';
  updateSidebar(); announce('');
  if (view === 'study') startStudy();
  else { renderCatalog(); }
}
function renderCatalog() {
  const home = view === 'home', categories = view === 'categories';
  el('catalog-title').textContent = home ? 'Bir seviye seç. Bir adım at.' : categories ? selectedLevel.title + ' · Kategoriler' : selectedCategory.title;
  el('catalog-description').textContent = home ? 'Seviyeni, kategorini ve desteni seç.' : categories ? 'Önce bir kategori seç.' : 'Bir deste seç ve kelimelerle çalış.';

  const grid = el('catalog-grid'); grid.replaceChildren();
  if (!home) { const back = node('a', 'boxed', categories ? '← Seviyeler' : '← Kategoriler'); back.href = categories ? '#' : '#' + selectedLevel.id; grid.append(back); }
  if (home) {
    for (const level of levels) {
      const link = node('a', 'collection-card level-card'); link.href = '#' + level.id;
      link.append(node('span', 'level-number', level.title), node('h2', '', level.label), node('p', '', level.description), node('span', 'card-link', levelCategories(level).length + ' kategori · Aç ↗')); grid.append(link);
    }
  } else if (categories) {
    for (const category of levelCategories(selectedLevel)) {
      const card = node('article', 'collection-card'), link = node('a', 'topic-link'); link.href = categoryPath(selectedLevel, category.id);
      link.append(node('span', 'topic-mark', '▤'), node('h2', '', category.title), node('span', 'card-link', categoryTopics(selectedLevel, category.id).length + ' deste · Aç ↗'));
      card.append(link);

      grid.append(card);
    }
  } else {
    const topics = categoryTopics(selectedLevel, selectedCategory.id);
    for (const topic of topics) {
      const card = node('article', 'collection-card'), link = node('a', 'topic-link'); link.href = topicUrl(topic);
      link.append(node('span', 'topic-mark', '✧'), node('h2', '', topic.title), node('p', '', topic.description || 'Kelime destesi'), node('span', 'card-link', topic.words.length + ' kelime · Kartları aç ↗')); card.append(link);

      grid.append(card);
    }
    if (!topics.length) grid.append(node('p', 'empty-state', 'Bu kategoride henüz deste yok.'));
  }
}
function startStudy(words = selectedChapter.words, retry = false) {
  session = new StudyRound(words);
  view = 'study';
  el('study').hidden = false;
  el('round-results').hidden = true;
  el('missed-list-section').hidden = true;
  el('show-missed').setAttribute('aria-expanded', 'false');
  el('chapter-title').textContent = selectedLevel.title;
  el('chapter-topic').textContent = selectedChapter.title;
  el('word-count').textContent = `${session.total} kelime${retry ? ' · Yanlışlar turu' : ''}`;
  el('back-topics').href = categoryPath(selectedLevel, selectedChapter.categoryId);
  el('restart').disabled = !selectedChapter.words.length; renderCard();
}
function renderCard() {
  revealed = false;
  const word = session.current();
  el('round-position').textContent = word ? `${session.answered + 1} / ${session.total} kelime` : '0 kelime';
  el('word').textContent = word ? word.word : 'Kelimeler yakında.';
  el('word-type').textContent = word ? word.type || 'Almanca ifade' : 'Bu konu henüz boş';
  el('example').textContent = word ? word.example || '' : 'Bu konu için kelimeler henüz hazırlanmadı. Diğer konulara göz atabilirsin.';
  el('translation').textContent = word?.translation || '';
  el('example-translation').textContent = word?.exampleTranslation || '';
  el('answer').hidden = true; el('rating').hidden = true; el('reveal').hidden = !word;
  el('keyboard-hint').hidden = !word;
  el('card-hint').textContent = word ? 'Bir an düşün. Aklına geliyor mu?' : 'Başka bir konu seçebilirsin.';
  el('keyboard-hint').innerHTML = '<kbd>Space</kbd> veya <kbd>Enter</kbd> ile cevabı aç';
  el('flashcard').classList.remove('is-revealed');
}
function reveal() {
  if (view !== 'study' || revealed || !session?.current()) return;
  revealed = true; el('answer').hidden = false; el('reveal').hidden = true; el('rating').hidden = false;
  el('flashcard').classList.add('is-revealed');
  el('card-hint').textContent = 'Hatırladın mı? Kendine karşı dürüst ol.';
  el('keyboard-hint').innerHTML = '<kbd>1</kbd> Bilmiyorum <span class="key-gap"></span> <kbd>2</kbd> Biliyorum';
  el('unknown').focus({ preventScroll: true });
}
function rate(known) {
  if (view !== 'study' || !revealed) return;
  revealed = false;
  session.rate(known);
  if (session.finished) { renderResults(); return; }
  renderCard(); el('reveal').focus({ preventScroll: true });
}
function renderResults() {
  view = 'results';
  el('study').hidden = true;
  el('round-results').hidden = false;
  el('result-topic').textContent = `${selectedLevel.title} / ${selectedChapter.title} · Bu turun sonucu`;
  el('result-title').textContent = `${session.total} kelimeden ${session.correct.length}'ini bildin.`;
  el('result-correct').textContent = session.correct.length;
  el('result-incorrect').textContent = session.incorrect.length;
  el('result-percentage').textContent = `%${session.percentage}`;
  el('result-progress').value = session.percentage;
  el('result-progress').textContent = `%${session.percentage}`;
  el('result-message').textContent = session.incorrect.length ? 'Bir sonraki adım: bilmediğin kelimelere yeniden yer aç.' : 'Tebrikler! Bu turdaki bütün kelimeleri bildiğini belirttin.';
  el('show-missed').hidden = !session.incorrect.length;
  el('retry-missed').hidden = !session.incorrect.length;
  el('results-back').href = categoryPath(selectedLevel, selectedChapter.categoryId);
  el('missed-list').replaceChildren();
  for (const word of session.incorrect) {
    const item = node('li', 'missed-word');
    item.append(node('strong', '', word.word), node('span', '', word.translation));
    el('missed-list').append(item);
  }
  announce(`Tur tamamlandı. ${session.correct.length} doğru, ${session.incorrect.length} yanlış. Başarı yüzde ${session.percentage}.`);
  el('restart-topic').focus({ preventScroll: true });
}
el('show-missed').addEventListener('click', () => {
  const section = el('missed-list-section');
  section.hidden = !section.hidden;
  el('show-missed').setAttribute('aria-expanded', String(!section.hidden));
});
el('retry-missed').addEventListener('click', () => {
  if (view !== 'results' || !session.incorrect.length) return;
  startStudy([...session.incorrect], true);
  announce('Yalnızca önceki turda bilmediğin kelimelerle yeni tur başladı.');
  el('reveal').focus({ preventScroll: true });
});
el('restart-topic').addEventListener('click', () => {
  startStudy(); announce('Tüm konu ile yeni tur başladı.'); el('reveal').focus({ preventScroll: true });
});
el('reveal').addEventListener('click', reveal);
el('unknown').addEventListener('click', () => rate(false)); el('known').addEventListener('click', () => rate(true));
el('restart').addEventListener('click', () => { startStudy(); el('reveal').focus({ preventScroll: true }); });
document.addEventListener('keydown', event => {
  if (view !== 'study' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (event.key === '1' || event.key === '2') { event.preventDefault(); rate(event.key === '2'); }
  else if (!revealed && (event.code === 'Space' || event.key === 'Enter')) {
    if (event.target.closest('button, a')) return;
    event.preventDefault(); reveal();
  }
});
window.addEventListener('hashchange', route);
const studentDataSource = typeof loadStudentWordData === 'function'
  ? loadStudentWordData
  : async () => ({ data: await loadWordData(), message: 'Yayınlanmış koleksiyon · İlerlemen yalnızca bu sayfa açıkken tutulur.' });
studentDataSource().then(({ data, message }) => {
  levels = data.levels;
  el('data-status').textContent = message;
  route();
}).catch(error => {
  el('data-status').textContent = error.message;
  el('catalog-title').textContent = 'Koleksiyon yüklenemedi.';
});
