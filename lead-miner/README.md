# Lead Miner

إيجنت ذكي بيشتغل كل يوم الصبح، بيدور على جوجل مابس (ولينكد إن من خلال البحث العام) على الليدز اللي إنت محددها، وبيطلعلك ملف Excel فيه الليدز **الجديدة بس**.

## بيشتغل إزاي

```
الحملة (campaigns.yaml)
   │
   ├─ 1. التخطيط: Claude بياخد الهدف والكلمات المفتاحية ويطلع منهم كلمات بحث كتير
   │     (عربي وإنجليزي، مرادفات، مناطق جوه المدينة). كلماتك إنت بتتبحث دايمًا الأول.
   ├─ 2. البحث: Playwright بيفتح جوجل مابس، يعمل scroll على النتايج، ويفتح كل مكان
   │     ويسحب الاسم والنوع والتليفون والموقع والعنوان والتقييم وعدد المراجعات والإحداثيات.
   │     ولينكد إن: بحث عام على site:linkedin.com/company (من غير تسجيل دخول).
   ├─ 3. منع التكرار: أي ليد اتشاف قبل كده (في SQLite) بيتشال.
   ├─ 4. الإثراء: لو طالب إيميل أو سوشيال، بيدخل على موقع المكان ويدور في الصفحة الرئيسية وصفحة Contact.
   │     ولو linkedin_lookup شغال، بيدور على صفحة الشركة على لينكد إن.
   ├─ 5. الفلاتر: أقل تقييم، أقل عدد مراجعات، حقول لازم تكون موجودة، كلمات مرفوضة.
   ├─ 6. التقييم: Claude بيدي كل ليد درجة من 0 لـ 100 حسب الهدف، وسبب في جملة.
   └─ 7. التصدير: data/out/<التاريخ>/<الحملة>.xlsx و .csv
```

لو مفيش مفتاح API أو Claude وقع، الإيجنت بيكمل عادي: بيبحث بكلماتك × مناطقك، ويطبق الفلاتر من غير تقييم.

## تعريف حملة

كل حملة في `config/campaigns.yaml` (انسخه من `config/campaigns.example.yaml`):

```yaml
campaigns:
  - name: sahel-chalets-for-rent
    target: real_estate            # companies | real_estate | custom
    goal: "شاليهات للإيجار في الساحل الشمالي، مكاتب أو ملاك مباشر"
    keywords: ["شاليهات للإيجار", "chalets for rent"]
    locations: ["الساحل الشمالي", "مارينا العلمين"]
    sources: [google_maps]         # و/أو linkedin
    fields: [name, phone, whatsapp, website, address, rating, maps_url, score, reason]
    filters:
      min_rating: 4.0
      must_have: [phone]
      exclude_words: ["فندق"]
      min_score: 50                # أقل درجة من Claude عشان الليد يتقبل
    max_results_per_query: 30
    max_queries: 10
```

الحقول المتاحة: `name category phone website address rating reviews maps_url latitude longitude plus_code email facebook instagram linkedin twitter tiktok whatsapp source query score reason`

## التسطيب على الهوم سيرفر (Linux)

```bash
git clone <repo> && cd lead-miner
sudo deploy/install.sh
sudo nano /etc/lead-miner.env              # حط ANTHROPIC_API_KEY
nano config/campaigns.yaml                 # عرّف حملاتك
```

السكريبت بيعمل venv، ويسطب Chromium، ويفعّل systemd timer يشغّل الإيجنت كل يوم الساعة 7 الصبح. ولو السيرفر كان مقفول الساعة 7، هيشتغل أول ما يفتح.

```bash
sudo systemctl start lead-miner.service    # تشغيل دلوقتي
journalctl -u lead-miner -f                # اللوجز
systemctl list-timers lead-miner.timer     # إمتى التشغيل الجاي
```

## الأوامر

```bash
python -m leadminer list                     # الحملات
python -m leadminer plan -c <name>           # يوريك كلمات البحث من غير ما يبحث
python -m leadminer run                      # يشغّل كل الحملات
python -m leadminer run -c <name> --headful  # حملة واحدة والمتصفح ظاهر (للتجربة)
python -m leadminer run --no-ai              # من غير Claude
python -m leadminer export -c <name>         # كل الليدز المقبولة من أول يوم في ملف واحد
```

## الإعدادات (env)

| المتغير | الافتراضي | |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | مفتاح Claude |
| `LEADMINER_MODEL` | `claude-opus-5-5` | الموديل |
| `LEADMINER_EFFORT` | `medium` | `low` أرخص، `high` أدق |
| `LEADMINER_AI` | `on` | `off` يقفل الذكاء الاصطناعي |
| `LEADMINER_CONFIG` | `config/campaigns.yaml` | |
| `LEADMINER_DATA` | `data` | الداتابيز والملفات الناتجة |
| `LEADMINER_CHROMIUM` | — | مسار Chromium لو مش عايز اللي بيسطبه Playwright |

## ملاحظات مهمة

- **جوجل مابس:** الإيجنت بيفتح الأماكن واحد ورا التاني وبيستنى بين كل خطوة والتانية، عشان ما يتعملوش بلوك. ولو جوجل غيّر شكل الصفحة، كل الـ selectors موجودين في أول `leadminer/gmaps.py`. السحب الآلي من جوجل مابس ممكن يخالف شروط جوجل، والبديل الرسمي هو Google Places API.
- **لينكد إن:** الإيجنت مش بيسجل دخول ولا بيفتح صفحات linkedin.com، بيقرا بس نتايج البحث العامة. سحب البيانات من لينكد إن نفسه بيخالف شروطه وبيقفل الحسابات.
- **الاختبارات:** `pip install pytest && python -m pytest -q`
