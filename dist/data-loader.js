// Öğrenci ve yönetim sayfaları aynı JSON şemasını kullanır.
function validateWordData(data) {
  const fail = message => { throw new Error(`Geçersiz veri: ${message}`); };
  const text = (value, required = false) => typeof value === 'string' && (!required || value.trim().length > 0);
  if (!data || data.version !== 1 || !Array.isArray(data.levels) || data.levels.length !== 4) fail('version: 1 ve dört seviye gerekli.');
  const used = new Set();
  const id = value => { if (!text(value, true) || !/^[a-zA-Z0-9_-]+$/.test(value) || used.has(value)) fail('Kimlikler benzersiz olmalı ve yalnızca harf, rakam, _ veya - içermeli.'); used.add(value); };
  const copy = JSON.parse(JSON.stringify(data));
  for (const level of copy.levels) {
    if (!level || !['a1', 'a2', 'b1', 'b2'].includes(level.id)) fail('Seviye kimliği A1–B2 olmalı.');
    id(level.id);
    if (!text(level.title, true) || !text(level.label, true) || !text(level.description) || !Array.isArray(level.topics)) fail('Seviye alanları eksik.');
    if (level.categories !== undefined && !Array.isArray(level.categories)) fail('Kategori listesi hatalı.');
    for (const category of level.categories || []) {
      if (!category || category.id === '__uncategorized') fail('Kategori kimliği hatalı.');
      id(category.id);
      if (!text(category.title, true) || category.title.length > 100) fail('Kategori adı gerekli.');
    }
    for (const topic of level.topics) {
      if (!topic) fail('Konu eksik.'); id(topic.id);
      if (topic.categoryId != null && !(level.categories || []).some(category => category.id === topic.categoryId)) fail('Deste kategorisi bu seviyede bulunamadı.');
      if (!text(topic.title, true) || topic.title.length > 100 || !Array.isArray(topic.words) || (topic.description !== undefined && !text(topic.description))) fail('Konu adı veya kelime listesi hatalı.');
      for (const word of topic.words) {
        if (!word) fail('Kelime eksik.'); id(word.id);
        if (!text(word.word, true) || !text(word.translation, true)) fail('Almanca ifade ve Türkçe anlam gerekli.');
        for (const key of ['example', 'exampleTranslation', 'type']) if (word[key] !== undefined && !text(word[key])) fail(`${key} metin olmalı.`);
      }
    }
  }
  // Yalnızca ek alanlar: özgün konu, kelime, kimlik ve tüm metinler korunur.
  for (const level of copy.levels) {
    if (!level.categories) {
      level.categories = ['Lektionlar', 'Kelimeler', 'Fiiller', 'Dil Bilgisi'].map((title, index) => {
        let candidate = `${level.id}-category-${index + 1}`;
        while (used.has(candidate)) candidate += '-new';
        used.add(candidate); return { id: candidate, title };
      });
    }
    for (const topic of level.topics) if (topic.categoryId === undefined) topic.categoryId = null;
  }
  return copy;
}
function levelCategories(level) { return [...level.categories, { id: '__uncategorized', title: 'Kategorisiz' }]; }
function categoryTopics(level, categoryId) { return level.topics.filter(topic => (topic.categoryId || '__uncategorized') === categoryId); }
function categoryPath(level, categoryId) { return `#${level.id}/category/${categoryId || '__uncategorized'}`; }
async function loadWordData() {
  try {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return validateWordData(await response.json());
  } catch (error) {
    throw new Error(`data.json okunamadı. Sayfayı yerel HTTP sunucusuyla aç (README.md). ${error.message}`);
  }
}
