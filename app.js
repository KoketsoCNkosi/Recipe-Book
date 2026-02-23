const API  = 'https://mysite.itvarsity.org/api/recipe-book/';

const CATS = {
  main:    { label:'Entrées',    title:'Main Courses', sub:'Signature dishes and gourmet entrees', emoji:'🍽' },
  drink:   { label:'Boissons',   title:'Beverages',    sub:'Artisanal cocktails and fine selections', emoji:'🍸' },
  dessert: { label:'Pâtisserie', title:'Desserts',     sub:'Decadent sweets and pastries', emoji:'🍮' },
};

// ── State ──────────────────────────────────────────────
let navHistory = [];
let current    = { page: 'home', category: '' };

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
const backBtn = document.getElementById('backBtn');

// ── Nav ────────────────────────────────────────────────
function toggleNav() {
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('show', open);
  menuBtn.classList.toggle('open', open);
}
function closeNav() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  menuBtn.classList.remove('open');
}
function goBack() {
  const prev = navHistory.pop();
  if (!prev) return;
  if (prev.page === 'home')      showHome(false);
  else if (prev.page === 'list') showList(prev.category, false);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

// ── Page switching ─────────────────────────────────────
function showPage(id, push) {
  if (push) navHistory.push({ ...current });
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id + 'Page').classList.add('active');
  current.page = id;
  backBtn.classList.toggle('hidden', id === 'home');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeNav();
}

function showHome(push = true) {
  current.category = '';
  showPage('home', push);
}

function showList(cat, push = true) {
  current.category = cat;
  const c = CATS[cat];
  document.getElementById('listEyebrow').textContent  = c.label;
  document.getElementById('listTitle').textContent    = c.title;
  document.getElementById('listSubtitle').textContent = c.sub;
  showPage('list', push);
  loadList(cat);
}

function showDetail(id, push = true) {
  if (push) navHistory.push({ ...current });
  showPage('detail', false);
  loadDetail(id);
}

// ── Data fetching ──────────────────────────────────────
function loadList(cat) {
  const grid = document.getElementById('recipeGrid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  fetch(API + 'get-recipes/?category=' + cat)
    .then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(data => {
      // Inject our curated images — API doesn't include them
      if (data && data.length) {
        data.forEach(r => {
          const fb = FALLBACK_DETAIL[r.id];
          if (fb && !r.img) r.img = fb.img;
        });
      }
      renderList(data, cat);
    })
    .catch(() => renderList(FALLBACK_LIST[cat] || [], cat));
}

function loadDetail(id) {
  const box = document.getElementById('recipeDetail');
  box.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
  fetch(API + 'get-recipes/?id=' + id)
    .then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(data => {
      if (data && data.length) {
        const recipe = data[0];
        const fallback = FALLBACK_DETAIL[id];
        // Always use our curated image — the API doesn't provide images
        if (fallback) {
          recipe.img         = fallback.img;
          if (!recipe.ingredients || recipe.ingredients.trim() === '') recipe.ingredients = fallback.ingredients;
          if (!recipe.method      || recipe.method.trim()      === '') recipe.method      = fallback.method;
        }
        renderDetail(recipe);
      } else throw 0;
    })
    .catch(() => renderDetail(FALLBACK_DETAIL[id] || { title:'Not found', description:'', ingredients:'', method:'' }));
}

// ── Rendering ──────────────────────────────────────────
function renderList(recipes, cat) {
  const grid = document.getElementById('recipeGrid');
  if (!recipes.length) {
    grid.innerHTML = '<div class="loading">No recipes found.</div>';
    return;
  }
  const c = CATS[cat] || {};
  grid.innerHTML = recipes.map((r, i) => {
    // Try to get img from fallback if API doesn't provide one
    const img = r.img || (FALLBACK_DETAIL[r.id] && FALLBACK_DETAIL[r.id].img) || '';
    const thumb = img
      ? `<img src="${img}" alt="${r.title}" loading="lazy" onerror="this.parentElement.classList.add('no-img')">`
      : '';
    return `
    <div class="recipe-card" onclick="showDetail(${r.id})" style="animation-delay:${i * .06}s">
      <div class="rc-thumb ${img ? 'has-img' : ''}">
        ${thumb}
        <span class="rc-emoji">${c.emoji || '🍴'}</span>
        <span class="rc-num">${String(i + 1).padStart(2, '0')}</span>
      </div>
      <div class="rc-body">
        <span class="rc-cat">${c.label || cat}</span>
        <div class="rc-title">${r.title || 'Untitled'}</div>
        <div class="rc-desc">${r.description || ''}</div>
        <div class="rc-footer"><span class="rc-arrow">→</span></div>
      </div>
    </div>`;
  }).join('');
}

function renderDetail(r) {
  const c   = CATS[current.category] || {};
  const img = r.img || '';

  const tmp   = document.createElement('div');
  tmp.innerHTML = r.method || '';
  const steps = Array.from(tmp.querySelectorAll('li')).map(el => el.textContent.trim());
  const stepsHtml = steps.length
    ? steps.map((s, i) => `
        <li>
          <div class="step-n">${String(i + 1).padStart(2, '0')}</div>
          <span>${s}</span>
        </li>`).join('')
    : '<li><div class="step-n">01</div><span>No steps provided.</span></li>';

  const heroContent = img
    ? `<img src="${img}" alt="${r.title}" class="detail-hero-img">`
    : `<span class="detail-hero-emoji">${c.emoji || '🍴'}</span>`;

  document.getElementById('recipeDetail').innerHTML = `
    <div class="detail-wrap">
      <span class="eyebrow">${c.label || 'Recipe'}</span>
      <h1 class="detail-title">${r.title || 'Recipe'}</h1>
      <p class="detail-desc">${r.description || ''}</p>

      <div class="detail-hero ${img ? 'detail-hero--photo' : ''}">
        ${heroContent}
      </div>

      <div class="detail-cols">
        <div class="ingredients-box">
          <span class="sec-label">Ingredients</span>
          <div class="box-title">What you'll need</div>
          <ul class="ing-list">${r.ingredients || '<li>No ingredients listed</li>'}</ul>
        </div>
        <div>
          <span class="sec-label">Method</span>
          <div class="method-title">How to prepare</div>
          <ol class="step-list">${stepsHtml}</ol>
        </div>
      </div>
    </div>`;
}

// ── Fallback data ──────────────────────────────────────
const FALLBACK_LIST = {
  main: [
    { id:1,  title:'Beef Wellington',   description:'Beef tenderloin wrapped in puff pastry with mushroom duxelles',      img:'https://reallyeats.com/wp-content/uploads/2023/10/beef-wellington-plated-1200x800.jpg' },
    { id:2,  title:'Lobster Thermidor', description:'Lobster in a rich creamy sauce with a golden cheese crust',          img:'https://www.thesuburbansoapbox.com/wp-content/uploads/2020/12/Lobster-Thermidor-4.jpg' },
    { id:3,  title:'Duck Confit',       description:'Slow-cooked duck leg in its own fat with garlic and herbs',          img:'https://thelocalpalate.com/wp-content/uploads/2021/10/DuckConfit_TheLocalPalate.jpg' },
    { id:10, title:'Coq au Vin',        description:'Chicken braised in red wine with pearl onions and mushrooms',        img:'https://www.poshjournal.com/wp-content/uploads/2021/02/coq-au-vin-recipe.jpg' },
    { id:11, title:'Rack of Lamb',      description:'Herb-crusted rack of lamb with roasted vegetables and jus',          img:'https://www.platingsandpairings.com/wp-content/uploads/2019/03/herb-crusted-rack-of-lamb-3.jpg' },
  ],
  drink: [
    { id:4,  title:'Classic Martini',    description:'Premium gin or vodka with dry vermouth, garnished elegantly',        img:'https://cdn.shopify.com/s/files/1/0562/9579/3102/files/Classic_Martini_Cocktail_BarGiant.jpg' },
    { id:5,  title:'Château Margaux',    description:'Exceptional Bordeaux with notes of blackcurrant and cedar',         img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Chateau_margaux_2009.jpg/800px-Chateau_margaux_2009.jpg' },
    { id:6,  title:'Champagne Cocktail', description:'Champagne with sugar cube and Angostura bitters',                   img:'https://queenbeemixology.com/wp-content/uploads/2021/12/Classic-Champagne-Cocktail.jpg' },
    { id:12, title:'Old Fashioned',      description:'Classic whiskey cocktail with sugar, bitters, and orange peel',     img:'https://assets.bonappetit.com/photos/5b6a871b3e6b911dc39fcecd/1:1/w_2560%2Cc_limit/old-fashioned.jpg' },
    { id:13, title:'French 75',          description:'Gin, lemon juice, and champagne — bright and celebratory',          img:'https://www.cookingwithcurls.com/wp-content/uploads/2015/05/French-75-Cocktail.jpg' },
  ],
  dessert: [
    { id:7,  title:'Crème Brûlée',      description:'Vanilla custard beneath a perfectly caramelized sugar crust',       img:'https://ohsweetbasil.com/wp-content/uploads/salted-caramel-creme-brulee-recipe-1.jpg' },
    { id:8,  title:'Chocolate Soufflé', description:'Light airy chocolate dessert served with vanilla ice cream',        img:'https://www.browneyedbaker.com/wp-content/uploads/2018/02/chocolate-souffle-4-650.jpg' },
    { id:9,  title:'Tarte Tatin',       description:'Upside-down apple tart with caramelized apples and pastry',         img:'https://hips.hearstapps.com/hmg-prod/images/tarte-tatin-index-64423a4e8f6f9.jpg' },
    { id:14, title:'Tiramisu',          description:'Coffee-soaked ladyfingers with mascarpone cream',                   img:'https://bakingsecret.com/wp-content/uploads/2024/03/Tiramisu-Layer-Cake-Recipe.jpg' },
    { id:15, title:'Lemon Posset',      description:'Silky cream dessert with bright fresh lemon',                       img:'https://cheflindseyfarr.com/wp-content/uploads/2023/03/lemon-posset-featured.jpg' },
  ],
};

const FALLBACK_DETAIL = {
  1:  { title:'Beef Wellington',   description:'A showpiece of classical cuisine.',
        img:'https://reallyeats.com/wp-content/uploads/2023/10/beef-wellington-plated-1200x800.jpg',
        ingredients:'<li>2 lbs beef tenderloin, trimmed</li><li>1 lb puff pastry</li><li>8 oz mushrooms, finely chopped</li><li>2 shallots, minced</li><li>2 tbsp Dijon mustard</li><li>Fresh thyme</li><li>Salt and pepper</li>',
        method:'<li>Season beef and sear until browned all over</li><li>Brush with Dijon mustard and cool</li><li>Sauté mushrooms and shallots until dry</li><li>Spread duxelles on puff pastry</li><li>Wrap beef, seal edges</li><li>Bake at 200°C for 25–30 min until golden</li><li>Rest 10 minutes before slicing</li>' },

  2:  { title:'Lobster Thermidor', description:'Timeless luxury on a plate.',
        img:'https://www.thesuburbansoapbox.com/wp-content/uploads/2020/12/Lobster-Thermidor-4.jpg',
        ingredients:'<li>2 lobsters (700g each)</li><li>1 cup heavy cream</li><li>½ cup Gruyère, grated</li><li>¼ cup white wine</li><li>2 tbsp Dijon mustard</li><li>1 shallot, minced</li><li>Fresh tarragon</li>',
        method:'<li>Steam lobsters, remove meat, reserve shells</li><li>Cut meat into chunks</li><li>Sauté shallot, add wine and reduce</li><li>Stir in cream, mustard, tarragon and simmer</li><li>Fold in lobster, season to taste</li><li>Fill shells, top with Gruyère</li><li>Broil until golden and bubbling</li>' },

  3:  { title:'Duck Confit',       description:'Deep, rich, unmistakably Gascon.',
        img:'https://thelocalpalate.com/wp-content/uploads/2021/10/DuckConfit_TheLocalPalate.jpg',
        ingredients:'<li>4 duck legs</li><li>¼ cup coarse salt</li><li>4 garlic cloves</li><li>4 sprigs thyme</li><li>2 bay leaves</li><li>4 cups duck fat</li>',
        method:'<li>Rub legs with salt, garlic, thyme, bay leaves</li><li>Cure in fridge for 24 hours</li><li>Rinse and pat dry</li><li>Submerge in duck fat in an oven dish</li><li>Cook at 110°C for 2–3 hours</li><li>Store in fat until needed</li><li>Crisp skin in a hot pan to serve</li>' },

  4:  { title:'Classic Martini',   description:'The benchmark of cocktail elegance.',
        img:'https://cdn.shopify.com/s/files/1/0562/9579/3102/files/Classic_Martini_Cocktail_BarGiant.jpg',
        ingredients:'<li>60ml gin or vodka</li><li>15ml dry vermouth</li><li>Lemon twist or olives</li><li>Ice</li>',
        method:'<li>Chill martini glass in freezer</li><li>Stir spirit and vermouth over ice for 30 seconds</li><li>Strain into chilled glass</li><li>Garnish and serve immediately</li>' },

  5:  { title:'Château Margaux',   description:'Bordeaux at its most refined.',
        img:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Chateau_margaux_2009.jpg/800px-Chateau_margaux_2009.jpg',
        ingredients:'<li>1 bottle Château Margaux</li><li>Large Bordeaux glasses</li>',
        method:'<li>Open bottle 30–60 minutes before serving</li><li>Decant to open the aromas</li><li>Serve at 16–18°C</li>' },

  6:  { title:'Champagne Cocktail',description:'Timeless celebratory elegance.',
        img:'https://queenbeemixology.com/wp-content/uploads/2021/12/Classic-Champagne-Cocktail.jpg',
        ingredients:'<li>1 flute brut champagne</li><li>1 sugar cube</li><li>2 dashes Angostura bitters</li><li>Lemon twist</li>',
        method:'<li>Soak sugar cube in bitters, drop into flute</li><li>Pour champagne slowly over sugar</li><li>Garnish with lemon twist</li>' },

  7:  { title:'Crème Brûlée',      description:'Silky custard beneath shattered caramel.',
        img:'https://ohsweetbasil.com/wp-content/uploads/salted-caramel-creme-brulee-recipe-1.jpg',
        ingredients:'<li>480ml heavy cream</li><li>1 vanilla bean</li><li>5 egg yolks</li><li>80g sugar + extra for topping</li>',
        method:'<li>Heat cream with vanilla until simmering</li><li>Whisk yolks and sugar until pale</li><li>Stream hot cream into yolks, whisking</li><li>Strain into ramekins</li><li>Bake in water bath at 160°C for 35–40 min</li><li>Chill 2 hours, then caramelize sugar with a torch</li>' },

  8:  { title:'Chocolate Soufflé', description:'Drama and delight in equal measure.',
        img:'https://www.browneyedbaker.com/wp-content/uploads/2018/02/chocolate-souffle-4-650.jpg',
        ingredients:'<li>180g dark chocolate (70%)</li><li>6 eggs, separated</li><li>80g sugar, divided</li><li>45g butter</li><li>45g flour</li><li>240ml whole milk</li>',
        method:'<li>Butter and sugar ramekins, preheat oven to 190°C</li><li>Melt chocolate; make a separate pastry cream</li><li>Combine chocolate, pastry cream and yolks</li><li>Whip whites with sugar to soft peaks</li><li>Fold whites into chocolate in three additions</li><li>Fill ramekins and bake 12–15 min until risen</li><li>Serve immediately</li>' },

  9:  { title:'Tarte Tatin',       description:'The famous upside-down apple tart.',
        img:'https://hips.hearstapps.com/hmg-prod/images/tarte-tatin-index-64423a4e8f6f9.jpg',
        ingredients:'<li>6 apples, peeled and quartered</li><li>120g butter</li><li>200g caster sugar</li><li>1 sheet puff pastry</li><li>1 tsp cinnamon</li>',
        method:'<li>Melt butter in ovenproof skillet, add sugar</li><li>Cook to a deep amber caramel</li><li>Arrange apples tightly over caramel</li><li>Cook until apples soften slightly</li><li>Lay pastry over apples, tuck in edges</li><li>Bake at 200°C for 25–30 min</li><li>Cool 5 min, then invert onto a plate</li>' },

  10: { title:'Coq au Vin',        description:'The quintessential French braise.',
        img:'https://www.poshjournal.com/wp-content/uploads/2021/02/coq-au-vin-recipe.jpg',
        ingredients:'<li>1 chicken, jointed</li><li>1 bottle Burgundy</li><li>200g lardons</li><li>200g pearl onions</li><li>250g mushrooms</li><li>4 garlic cloves</li><li>2 tbsp tomato paste</li>',
        method:'<li>Marinate chicken in wine overnight</li><li>Pat dry and brown all over in oil</li><li>Sauté lardons, onions and garlic</li><li>Add tomato paste and reserved wine</li><li>Braise on low heat for 1½ hours</li><li>Add mushrooms in the final 20 min</li><li>Season and serve with crusty bread</li>' },

  11: { title:'Rack of Lamb',      description:'Elegant, herb-perfumed and stunning.',
        img:'https://www.platingsandpairings.com/wp-content/uploads/2019/03/herb-crusted-rack-of-lamb-3.jpg',
        ingredients:'<li>2 racks of lamb, frenched</li><li>3 tbsp Dijon mustard</li><li>1 cup fresh breadcrumbs</li><li>2 tbsp rosemary, chopped</li><li>2 tbsp parsley, chopped</li><li>3 garlic cloves, minced</li><li>Olive oil, salt, pepper</li>',
        method:'<li>Season racks and sear fat-side down in a hot pan</li><li>Brush with Dijon mustard</li><li>Mix breadcrumbs, herbs and garlic</li><li>Press herb crust onto the mustard-coated side</li><li>Roast at 200°C for 20–25 min for medium-rare</li><li>Rest 10 min before slicing into cutlets</li>' },

  12: { title:'Old Fashioned',     description:'The oldest whiskey cocktail — still unbeatable.',
        img:'https://assets.bonappetit.com/photos/5b6a871b3e6b911dc39fcecd/1:1/w_2560%2Cc_limit/old-fashioned.jpg',
        ingredients:'<li>60ml bourbon or rye</li><li>1 sugar cube or ½ tsp syrup</li><li>2 dashes Angostura bitters</li><li>Orange peel</li><li>Large ice cube</li>',
        method:'<li>Muddle sugar and bitters in a rocks glass</li><li>Add a large ice cube</li><li>Pour whiskey over</li><li>Stir gently for 20 seconds</li><li>Express orange peel over glass and garnish</li>' },

  13: { title:'French 75',         description:'Gin and champagne — bright and celebratory.',
        img:'https://www.cookingwithcurls.com/wp-content/uploads/2015/05/French-75-Cocktail.jpg',
        ingredients:'<li>45ml gin</li><li>22ml fresh lemon juice</li><li>15ml simple syrup</li><li>Brut champagne to top</li><li>Lemon twist</li>',
        method:'<li>Shake gin, lemon juice and syrup with ice</li><li>Strain into a champagne flute</li><li>Top with champagne</li><li>Garnish with lemon twist</li>' },

  14: { title:'Tiramisu',          description:"Italy's most beloved dessert.",
        img:'https://bakingsecret.com/wp-content/uploads/2024/03/Tiramisu-Layer-Cake-Recipe.jpg',
        ingredients:'<li>500g mascarpone</li><li>4 eggs, separated</li><li>120g caster sugar</li><li>300ml espresso, cooled</li><li>30ml Marsala or Kahlúa</li><li>24 Savoiardi biscuits</li><li>Cocoa powder to dust</li>',
        method:'<li>Whisk yolks and sugar until thick and pale</li><li>Beat in mascarpone until smooth</li><li>Fold in stiffly whipped egg whites</li><li>Mix espresso and liqueur in a shallow bowl</li><li>Briefly dip biscuits and layer in dish</li><li>Spread half the cream, add another layer, top with cream</li><li>Chill 4–6 hours and dust with cocoa to serve</li>' },

  15: { title:'Lemon Posset',      description:'The simplest, most elegant British dessert.',
        img:'https://cheflindseyfarr.com/wp-content/uploads/2023/03/lemon-posset-featured.jpg',
        ingredients:'<li>600ml double cream</li><li>150g caster sugar</li><li>80ml fresh lemon juice</li><li>Zest of 1 lemon</li>',
        method:'<li>Bring cream and sugar to a boil, stirring</li><li>Simmer for 3 minutes</li><li>Remove from heat, stir in lemon juice and zest</li><li>Pour into glasses or ramekins</li><li>Cool to room temperature, then chill 3+ hours</li><li>Serve with fresh berries or shortbread</li>' },
};

// ── Init ───────────────────────────────────────────────
showHome(false);
