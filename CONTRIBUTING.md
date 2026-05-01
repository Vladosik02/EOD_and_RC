# Як вносити зміни

## Перед тим як редагувати

1. Запусти локальний сервер і відкрий сторінку, яку міняєш:
   ```bash
   python3 -m http.server 8000
   ```
2. Перевіряй візуально кожну зміну в браузері — у нас немає CI з візуальною регресією.

## Конвенції

### HTML
- 2 пробіли індентації
- `<meta>`, `<link>` без trailing slash (HTML5)
- Атрибути в подвійних лапках
- Двомовний контент завжди в обох spans:
  ```html
  <span lang="uk" class="inline-ua">Текст</span>
  <span lang="en" class="inline-en">Text</span>
  ```

### CSS
- Спільні стилі (для всіх сторінок) → `assets/styles.css`
- Унікальні для сторінки → інлайн `<style>` у `<head>` тієї сторінки
- НЕ виносити частково-схожі правила в spільний — це вже одного разу зламало сайт (PR #4 → revert PR #5)

### JS
- Спільна логіка (lang switcher, hamburger, scroll-reveal, SW) → `assets/scripts.js`
- Сторінко-специфічна → інлайн `<script>` у тій сторінці
- ES5 синтаксис у спільному (для сумісності зі старими браузерами)

### Зображення
- Heavy зображення (>30 KB) обгортати в `<picture>`:
  ```html
  <picture>
    <source srcset="image.webp" type="image/webp">
    <img src="image.jpg" width="..." height="..." loading="lazy" alt="...">
  </picture>
  ```
- WebP версії генеруються через Pillow (див. README)
- Завжди прописувати `width` + `height` (запобігає Cumulative Layout Shift)
- Logo / hero — `loading="eager"`. Усе інше — `loading="lazy"`

## Перед commit

Швидкий чекліст:

```bash
# Тег-баланс перевірка
python3 -c "
import re, os
for f in os.listdir('.'):
    if not f.endswith('.html'): continue
    with open(f) as fp: c = fp.read()
    for tag in ['script','style','picture','form']:
        if c.count(f'<{tag}') != c.count(f'</{tag}>'):
            print(f'{f}: {tag} mismatch')
print('done')
"

# JSON-LD validation
python3 -c "
import json, re, os
for f in sorted(os.listdir('.')):
    if not f.endswith('.html'): continue
    with open(f) as fp: c = fp.read()
    for m in re.finditer(r'<script type=\"application/ld\+json\">\s*(\{.*?\})\s*</script>', c, re.DOTALL):
        try: json.loads(m.group(1))
        except Exception as e: print(f'{f}: {e}')
print('JSON-LD OK')
"
```

## Великі зміни → окрема гілка

Не комітити прямо в `main`. Завжди через PR.

```bash
git checkout -b feature/<short-description>
# ... зміни ...
git push -u origin feature/<short-description>
gh pr create --draft  # або через UI
```

## Якщо зламав

```bash
# Останній revert був як: PR #5 (revert "PR #4: CSS refactor")
git revert -m 1 <merge-sha-of-broken-PR>
git push
```

## Питання

- Куди йде форма зворотного зв'язку? → Formspree (`data-formspree-id` атрибут на `<form>` у prototype.html)
- Чому така купа inline CSS? → Сайт без bundler'а, `<style>` у `<head>` дає швидкий FCP без додаткового HTTP-запиту. Спільні правила ми виносимо в `assets/styles.css` поступово, тільки коли впевнені, що 100% ідентичні на всіх сторінках.
- Чому `lang="uk"` основний а EN перемикається через CSS? → Так було вирішено для SEO: одна канонічна URL = одна сторінка індексу. Альтернатива — окремі URL для кожної мови (`/en/...`) — потребувала б повної переробки.
