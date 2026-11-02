// Her kelime kuyrukta tek kez bulunur. Zor kelimeler 2, bilinenler 7 kart sonra döner.
class ReviewQueue {
  constructor(words) {
    this.queue = [...words];
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }
  current() { return this.queue[0] || null; }
  rate(known) {
    if (!this.queue.length) return null;
    const word = this.queue.shift();
    this.queue.splice(Math.min(known ? 7 : 2, this.queue.length), 0, word);
    return this.current();
  }
}

// Öğrenci turu sonludur: değerlendirilen kelime aynı turda geri gelmez.
// Yerel yönetimdeki eski önizleme kuyruğu bağımsız kalır.
class StudyRound extends ReviewQueue {
  constructor(words) {
    super(words);
    this.total = this.queue.length;
    this.correct = [];
    this.incorrect = [];
  }
  rate(known) {
    const word = this.queue.shift();
    if (!word) return null;
    (known ? this.correct : this.incorrect).push(word);
    return this.current();
  }
  get answered() { return this.correct.length + this.incorrect.length; }
  get finished() { return this.total > 0 && this.queue.length === 0; }
  get percentage() { return this.total ? Math.round(this.correct.length / this.total * 100) : 0; }
}
