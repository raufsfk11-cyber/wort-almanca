# Wort öğrenci sitesini yayımlama

Bu depo yalnızca `dist/` öğrenci çıktısını ve yayın yapılandırmasını içerir. Yerel admin, taslak, yedek ve dışa aktarma dosyaları gönderilmez. GitHub Pages kaynağı **GitHub Actions** olmalıdır. İş akışı `dist/` klasörünü doğrular ve yalnızca bu klasörü yayımlar.

## Güncelleme

Yerel proje klasöründe:

1. Admin panelinden güncel koleksiyonu JSON olarak dışa aktar; eski `data.json` dosyasını yedekle, ardından indirilen dosyayı onun yerine koy.
2. `powershell -ExecutionPolicy Bypass -File .\build.ps1` çalıştır. Admin ve build araçları yerel klasörde kalır; workflow yeniden build yapmaz, incelenmiş çıktıyı kullanır.
3. `git diff --stat` ve `git diff -- dist/data.json` ile değişiklikleri incele. Uygunsa `git add dist` çalıştır.
4. `git diff --cached --name-only` listesini kontrol et; admin, yedek veya taslak bulunmamalıdır.
5. `git commit -m "Update student collection"` ve `git push origin main` çalıştır.
6. GitHub **Actions → Publish student site** sonucunu bekle. Başarılı deployment bağlantısını aç; kategori, deste, kart ve sonuç ekranlarını kontrol et. Başarısız workflow yayınlandı sayılmaz.

Admin localStorage kaydı otomatik yayın yapmaz. `data.json` ve `dist/data.json` güncellenip commit/push yapılmadan ziyaretçilere yeni koleksiyon ulaşmaz. GitHub token veya parola dosyalarını bu depoya ekleme.
